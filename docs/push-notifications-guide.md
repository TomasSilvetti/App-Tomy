# Guía de Notificaciones Push — Stack y Lecciones Aprendidas

Guía completa para implementar notificaciones push correctamente desde cero, basada en el desarrollo de App-Turnos. Incluye el stack exacto, arquitectura, errores reales y cómo evitarlos.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16+ (App Router) |
| Runtime | Node.js |
| ORM | Prisma 5+ con PostgreSQL |
| Push library (server) | `web-push` ^3.6.7 |
| Auth | NextAuth 5 (beta) |
| Deploy | Vercel |

---

## Cómo funciona Web Push (resumen)

1. El servidor genera un par de claves **VAPID** (pública + privada).
2. El cliente (browser) se suscribe usando la clave pública → recibe un objeto `PushSubscription` con `endpoint`, `p256dh` y `auth`.
3. Ese objeto se guarda en la DB.
4. El servidor usa la clave privada + `web-push` para enviar mensajes al endpoint.
5. El **Service Worker** recibe el evento `push` y muestra la notificación.

---

## Variables de entorno requeridas

```env
# Clave pública embebida en el build del cliente — NEXT_PUBLIC_ es obligatorio
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGUj...

# Solo en servidor
VAPID_PRIVATE_KEY=3GLb...
VAPID_SUBJECT=mailto:tuemail@dominio.com
```

### Generar claves VAPID

```bash
npx web-push generate-vapid-keys
```

---

## ⚠️ Errores críticos y cómo evitarlos

### 1. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` debe estar en el build

**Problema:** En Next.js, las variables `NEXT_PUBLIC_*` se inyectan en tiempo de **build**, no de runtime. Si agregás la variable en Vercel después del deploy, sigue siendo `undefined` hasta hacer un nuevo deploy.

**Solución:** Agregar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en Vercel **antes** del primer deploy. Si la agregás después, hacer redeploy obligatorio.

**Verificación en código:**
```typescript
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
if (!vapidPublicKey) throw new Error("VAPID_KEY_MISSING"); // falla rápido y claro
```

---

### 2. NO llamar `unsubscribe()` al desactivar notificaciones

**Problema:** Si el toggle de "desactivar" llama `subscription.unsubscribe()` en el browser, la suscripción del browser se destruye. Al reactivar, el código intenta crear una nueva con `pushManager.subscribe()` — lo que requiere la VAPID key embebida. En producción esto falla si la key no estaba en el build.

**Solución correcta para desactivar:**
```typescript
// ✅ Solo eliminar de la DB, NO llamar unsubscribe() en el browser
await fetch("/api/push-subscriptions", {
  method: "DELETE",
  body: JSON.stringify({ endpoint: sub.endpoint }),
});
localStorage.setItem("push_notifications_disabled", "true");
```

**Solución correcta para reactivar:**
```typescript
const registration = await navigator.serviceWorker.ready;
const existingSub = await registration.pushManager.getSubscription();

if (existingSub) {
  // ✅ Reutilizar la suscripción existente del browser — no necesita VAPID key
  const { endpoint, keys } = existingSub.toJSON();
  await fetch("/api/push-subscriptions", { method: "POST", body: JSON.stringify({ endpoint, keys }) });
} else {
  // Solo si el usuario limpió datos del browser — sí necesita VAPID key
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  // ...guardar en DB
}
```

---

### 3. Limpiar suscripciones inválidas (410 / 403)

Cuando el browser invalida un endpoint (usuario desinstalando la PWA, limpiando datos, etc.), el servidor recibe `statusCode: 410` o `403`. Hay que eliminar esa suscripción de la DB.

```typescript
} catch (err) {
  const status = (err as { statusCode?: number }).statusCode;
  if (status === 410 || status === 403) {
    await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
  }
}
```

---

### 4. Service Worker debe estar en `/public/sw.js`

El SW debe estar en la raíz del dominio (`/sw.js`) para tener scope sobre toda la app. En Next.js eso significa ponerlo en `/public/sw.js`.

```javascript
// public/sw.js
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Nueva notificación", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Notificación", {
      body: payload.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url ?? "/" },
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: payload.tag ?? "notification",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
```

---

### 5. Registrar el SW en el cliente antes de suscribirse

```typescript
navigator.serviceWorker.register("/sw.js").catch(() => {});
// Esperar a que esté listo antes de suscribir
const registration = await navigator.serviceWorker.ready;
```

---

### 6. `web-push` importarlo dinámicamente en el servidor (Next.js)

`web-push` tiene dependencias de Node.js que no son compatibles con el Edge Runtime. Importarlo dinámicamente evita errores en build.

```typescript
const webpush = (await import("web-push")).default;
webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
```

---

### 7. Función `urlBase64ToUint8Array` — siempre incluirla en el cliente

La VAPID key llega como base64url y necesita convertirse a `Uint8Array` para `pushManager.subscribe()`.

```typescript
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
```

---

## Arquitectura de la DB (Prisma)

```prisma
model PushSubscription {
  id               String   @id @default(cuid())
  endpoint         String   @unique
  p256dh           String
  auth             String
  userId           String   // FK al usuario
  createdAt        DateTime @default(now())
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("push_subscriptions")
}
```

- `endpoint` debe ser `@unique` — el mismo browser no puede tener dos suscripciones iguales.
- `onDelete: Cascade` — si se borra el usuario, se borran sus suscripciones.
- Un usuario puede tener múltiples suscripciones (varios dispositivos).

---

## API Routes mínimas

### `POST /api/push-subscriptions` — registrar suscripción

```typescript
export async function POST(request: Request) {
  // 1. Verificar autenticación
  // 2. Validar body: endpoint, keys.p256dh, keys.auth
  // 3. Upsert en DB (no crear duplicados)
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: body.endpoint } });
  if (existing) return NextResponse.json({ ok: true }); // idempotente

  await prisma.pushSubscription.create({ data: { endpoint, p256dh, auth, userId } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
```

### `DELETE /api/push-subscriptions` — eliminar suscripción

```typescript
export async function DELETE(request: Request) {
  // Validar que el endpoint pertenece al usuario autenticado antes de borrar
  await prisma.pushSubscription.delete({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
```

---

## Enviar una notificación desde el servidor

```typescript
import { prisma } from "@/lib/prisma";

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error("[Push] Faltan env vars VAPID");
    return;
  }

  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  const payloadStr = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadStr,
          { TTL: 86400, urgency: "high" }
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 403) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
```

---

## Checklist de deploy en Vercel

- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` → agregar en **All Environments** antes del primer build
- [ ] `VAPID_PRIVATE_KEY` → agregar en **All Environments**
- [ ] `VAPID_SUBJECT` → formato `mailto:tuemail@dominio.com`
- [ ] Si se agregan variables después de un deploy existente → **hacer redeploy**
- [ ] `public/sw.js` → committed en el repo
- [ ] `public/manifest.json` → PWA manifest con `display: "standalone"` para mejor experiencia

---

## PWA Manifest mínimo

```json
{
  "name": "Mi App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Flujo completo resumido

```
1. Generar VAPID keys (una sola vez)
   npx web-push generate-vapid-keys

2. Agregar al .env y a Vercel ANTES del build

3. Crear public/sw.js con listener de "push" y "notificationclick"

4. En el cliente:
   a. Registrar SW: navigator.serviceWorker.register("/sw.js")
   b. Pedir permiso: Notification.requestPermission()
   c. Suscribir: registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: ... })
   d. Guardar subscription en DB via POST /api/push-subscriptions

5. Al desactivar: solo DELETE en DB, NO unsubscribe() en browser

6. Al reactivar: getSubscription() primero, si existe re-registrar en DB sin VAPID key
                 solo subscribe() si no hay suscripción en browser

7. Al enviar: webpush.sendNotification() desde el servidor, limpiar 410/403
```
