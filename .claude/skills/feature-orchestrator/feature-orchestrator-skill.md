1---
name: feature-orchestrator
description: >
  Orquesta el ciclo completo de desarrollo de una feature en App ConstruIA: descompone la HU en porciones,
  desarrolla cada par FRONT+BACK, ejecuta migraciones, hace commits automáticos y pushea a staging.
  Usa esta skill SIEMPRE que el usuario mencione desarrollar una feature, arrancar una HU, implementar
  una historia de usuario, o quiera ejecutar el flujo completo de desarrollo de una funcionalidad.
  Este proyecto tiene dos backends: Next.js proxy (TypeScript) y FastAPI (Python).
---

# Feature Orchestrator — App ConstruIA

Toma una historia de usuario y la lleva desde cero hasta staging: descompone → crea branch → desarrolla cada porción (FRONT luego BACK) → commit → push a staging. Solo pausa cuando WORKFLOW_RULES.md lo indica.

---

## Reglas de eficiencia (NO negociables)

- **Contexto por fase.** Nunca cargar DESIGN_SYSTEM durante la fase Back. Nunca cargar modelos Python durante la fase Front.
- **Un archivo, una lectura.**
- **No glob patterns.** Usar las rutas convencionales documentadas abajo.
- **No releer después de editar.**
- **No releer WORKFLOW_RULES.md.** Se lee una sola vez al inicio.
- **No releer los design systems.** Se leen una vez por porción FRONT.

---

## Fase 0 — Setup inicial

### 0.1 Leer reglas de workflow

Leer `~/.claude/workflow/WORKFLOW_RULES.md` completo. Extraer y guardar en memoria:
- Paradas S activas, paradas C activas, acciones AUTO

**Esta es la única lectura de este archivo en todo el flujo.**

### 0.2 Leer la HU

Leer el archivo `.md` de la HU. Extraer título, descripción, criterios y si involucra cambios de BD.

### 0.3 Crear feature branch

```bash
git checkout main && git pull origin main
git checkout -b feature/{nombre-descriptivo-en-español}
```

**AUTO — no requiere confirmación.**

---

## Fase 1 — Descomposición

### 1.1 Analizar la BD (si aplica)

Si la HU involucra persistencia: leer `backend/models/` para determinar qué tablas existen.
**Esta es la única lectura de modelos en esta fase.**

### 1.2 Proponer el plan

> Analicé la HU. Propongo **{N} porciones**:
>
> | # | Porción | Tipo | Par | Backend | Prerequisitos | Criterios clave |
> |---|---------|------|-----|---------|---------------|-----------------|
> | porcion-001 | {título} | FRONT | porcion-002 | Next.js | Ninguno | {criterios} |
> | porcion-002 | {título} | BACK | porcion-001 | FastAPI | Ninguno | {criterios} |
> | porcion-003 | {título} | BACK | — | Next.js proxy | porcion-002 | {criterios} |
>
> **Columna Backend:** indica si el BACK es lógica FastAPI o proxy liviano Next.js.
>
> ¿Este desglose tiene sentido? ¿Ajustamos algo?

**PARADA — el plan aprobado queda en el contexto. No se generan archivos .md de porciones.**

> ✅ Plan confirmado. Arranco con **porcion-001 — {título} [FRONT]** ¿Continuamos?

**PARADA — esperar confirmación para comenzar.**

---

## Fase 2 — Desarrollo por par (loop)

---

### Fase 2A — FRONT (Next.js 14)

#### Contexto a cargar (máximo 3 lecturas)

Los datos de la porción vienen del plan en contexto — no leer archivo .md.

1. Componente hermano más cercano (mismo directorio destino)
2. Archivo donde se integra (página o layout)
3. `~/.claude/design/DESIGN_SYSTEM_BASE.md` → solo sección relevante
4. `docs/DESIGN_SYSTEM.md` → misma sección (override)

**STOP.**

#### Resumen y referencia visual

> **Listo para arrancar.**
> **Qué:** {descripción} | **Dónde:** `frontend/{ruta}/{Componente}.tsx` | **Ruta:** `/{ruta}`
>
> **¿Cómo debe verse?** Imagen, descripción, o "a tu criterio".

**PARADA.**

#### Desarrollo

- Naming y estructura del proyecto inferidos del componente hermano
- No llamar FastAPI directo — siempre vía proxy `/api/`
- Estados: skeleton, error, vacío, éxito
- Responsive + accesibilidad siempre
- Para Konva.js: siempre dentro de `<Stage><Layer>`, no DOM directo

#### Actualizar glosario si aplica

Agregar componente nuevo a `docs/DESIGN_SYSTEM.md` sección glosario.

#### Ciclo de revisión

> **✅ Componente implementado.**
> `cd frontend && npm run dev` → `http://localhost:3000/{ruta}`
> ¿Se ve como esperabas?

#### Commit automático

```bash
git add frontend/{archivos}
git commit -m "feat: {descripción en español}"
```
**AUTO.**

> Siguiente: **porcion-{NNN+1} — {título} [BACK — {FastAPI|Next.js proxy}]** ¿Continúo?

**PARADA.**

---

### Fase 2B — BACK

El tipo de porción Back determina qué se implementa:

#### Tipo A — FastAPI (lógica de negocio, IA, parser, cómputo)

**Contexto a cargar (máximo 2 lecturas):**

Los datos vienen del plan — no leer archivo .md.

1. Router hermano más cercano (mismo dominio en `backend/routers/`)
2. Modelo SQLAlchemy/Pydantic relacionado (si aplica)

**STOP.**

**Estructura estándar:**
```python
# backend/routers/{nombre}.py
router = APIRouter(prefix="/{nombre}", tags=["{nombre}"])

@router.post("/", response_model=NombreResponse)
async def endpoint(request: NombreRequest):
    ...
```

**Migraciones Alembic — clasificar según WORKFLOW_RULES.md:**

| Operación | Clasificación |
|---|---|
| CREATE TABLE, ADD COLUMN nullable | SEGURA — pedir confirmación |
| ADD COLUMN NOT NULL / DROP / ALTER tipo | PELIGROSA — Parada S-02 |

Si SEGURA:
> 🗄️ Migración requerida. Operación: {desc}. ✅ SEGURA. ¿Confirmás?

```bash
cd backend && alembic revision --autogenerate -m "{nombre_en_español}"
alembic upgrade head
```

**PARADA — esperar confirmación de migración.**

**Explicación y confirmación:**
> **Qué voy a crear:** {endpoint/servicio, validaciones, lógica, respuesta}. ¿Arrancamos?

**PARADA.**

**Reglas de desarrollo Python:**
- Pydantic para todo contrato de entrada/salida — nunca dicts crudos
- `logger = logging.getLogger(__name__)` — nunca `print()`
- Type hints en todas las funciones
- Ningún valor hardcodeado — siempre `os.getenv()`
- Registrar router en `backend/main.py`

#### Tipo B — Next.js proxy (proxy liviano hacia FastAPI)

**Contexto a cargar (1 lectura):**
1. Proxy hermano más cercano en `frontend/app/api/`

**Estructura estándar:**
```typescript
// frontend/app/api/{nombre}/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  const res = await fetch(`${process.env.FASTAPI_URL}/{endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return Response.json(await res.json(), { status: res.status })
}
```

**Reglas:**
- Solo proxy — sin lógica de negocio aquí
- Manejar errores de red (FastAPI caído, timeout)
- `FASTAPI_URL` siempre via variable de entorno

**Explicación y confirmación:**
> **Qué voy a crear:** {proxy endpoint}. ¿Arrancamos?

**PARADA.**

#### Commit automático (ambos tipos)

```bash
git add backend/{archivos} # o frontend/app/api/{archivos}
git commit -m "feat: {descripción en español}"
```
**AUTO.**

> Siguiente: **porcion-{NNN+1} — {título} [{tipo}]** ¿Continúo?

**PARADA.**

---

## Fase 3 — Finalización

### 3.1 Push a staging

```bash
git push origin feature/{nombre}
```

Verificar build Vercel. Si falla (C-02): analizar, fix automático, reportar si no puede.

**AUTO si sin errores.**

### 3.2 Notificación (PARADA OBLIGATORIA S-01)

> **🚀 Feature lista en staging.**
> Branch: `feature/{nombre}` | Preview: {URL Vercel}
>
> Verificá la feature. Cuando confirmes, autorizá el merge con "merge" o "aprobado".

**PARADA OBLIGATORIA.**

### 3.3 Merge a main (solo con autorización)

```bash
git checkout main && git merge feature/{nombre}
git push origin main && git branch -d feature/{nombre}
```

> ✅ Feature mergeada a main. Deploy en curso.

---

## Rutas convencionales — App ConstruIA

| Qué | Ruta |
|-----|------|
| Frontend root | `frontend/` |
| Pages | `frontend/app/` |
| Componentes canvas | `frontend/components/canvas/` |
| Componentes cómputo | `frontend/components/computo/` |
| Componentes UI | `frontend/components/ui/` |
| API proxy routes | `frontend/app/api/` |
| API client | `frontend/lib/api-client.ts` |
| Backend root | `backend/` |
| Routers FastAPI | `backend/routers/` |
| Servicios | `backend/services/` |
| Modelos | `backend/models/` |
| Migraciones | `backend/db/migrations/` |
| Main FastAPI | `backend/main.py` |
| Design system base | `~/.claude/design/DESIGN_SYSTEM_BASE.md` |
| Design system proyecto | `docs/DESIGN_SYSTEM.md` |
| Workflow rules | `~/.claude/workflow/WORKFLOW_RULES.md` |

---

## Resumen de paradas

| Momento | Tipo |
|---|---|
| Aprobar plan de porciones | OBLIGATORIA |
| Confirmar inicio de desarrollo | OBLIGATORIA |
| Referencia visual (FRONT) | OBLIGATORIA |
| Confirmar inicio Back (explicación lógica) | OBLIGATORIA |
| Confirmar migración (cualquier tipo) | OBLIGATORIA |
| Migración destructiva (S-02) | OBLIGATORIA |
| Confirmar porción completada → avanzar | OBLIGATORIA |
| Merge a main (S-01) | OBLIGATORIA |
| Tests fallan (C-01) | CONDICIONAL |
| Build falla (C-02) | CONDICIONAL |

---

## Relación con otras skills

- **fix-developer**: bugs y ajustes puntuales
- **frontend-developer**: usar en forma aislada si se necesita solo una porción FRONT
- **fastapi-developer**: usar en forma aislada si se necesita solo una porción BACK FastAPI
- **fix-decomposer**: si durante el desarrollo se detecta un bug complejo
