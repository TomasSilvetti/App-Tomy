---
name: backend-developer
description: >
  Desarrolla porciones de tipo BACK a partir de su archivo .md.
  Usa esta skill SIEMPRE que el usuario mencione desarrollar porcion back, implementar logica backend, crear endpoint, arrancar porcion backend,
  o cuando comparta una porcion de tipo BACK y pida desarrollarla o implementarla.
  La skill verifica prerequisitos, analiza la estructura del proyecto, explica lo que va a hacer en lenguaje simple con un flujo de datos,
  desarrolla la logica backend, y acompana al desarrollador en un ciclo de revision hasta confirmar. Marca la porcion como completada al finalizar.
---

# Backend Developer

Toma una porción de tipo BACK y la lleva desde cero hasta confirmada: verifica prerequisitos, analiza el proyecto, explica la lógica con claridad, desarrolla el backend, guía la revisión y marca la porción como completada.

---

## Reglas de eficiencia (NO negociables)

Estas reglas tienen prioridad sobre cualquier otra instrucción del flujo.

- **Un archivo, una lectura.** Si necesitás distintas partes de un archivo, leelo completo en una sola llamada. Nunca en rangos separados.
- **Máximo 4 archivos leídos por porción:** el `.md` de la porción + el schema/modelo del ORM + el endpoint hermano más cercano + el archivo de rutas donde se registra. Cualquier lectura adicional requiere justificación explícita.
- **No usar glob patterns.** Las rutas convencionales del proyecto están documentadas al final de esta skill. Usarlas directamente sin explorar.
- **No releer después de editar.** Si la escritura o el `str_replace` fue exitoso, asumir que está bien. No verificar releyendo el archivo.
- **No leer el archivo de rutas completo si solo necesitás agregar una línea.** Usar `str_replace` con contexto mínimo suficiente para que sea único.
- **No leer la porción Front par completa.** Solo leer el contrato que expone: qué endpoint llama, qué formato de respuesta espera, qué campos envía. Si esa información está en el `.md` de la porción Back, no leer la porción Front.

---

## Flujo de trabajo

### Paso 1 — Leer la porción

Leer el archivo `.md` de la porción BACK proporcionada. Extraer:

- **Título y descripción** de lo que hay que implementar
- **Prerequisitos**: lista de porciones que deben estar completas antes de arrancar
- **Par Front**: número de la porción Front asociada — extraer del `.md` el contrato esperado (endpoint, formato de respuesta, campos) sin leer la porción Front salvo que el `.md` Back no lo especifique
- **Criterios de aceptación**: qué debe cumplir la lógica backend
- **Pruebas**: guardarlas en mente pero NO marcarlas como completadas en ningún momento

---

### Paso 2 — Verificar prerequisitos

Antes de cualquier otra cosa, verificar que las porciones listadas en `Prerequisitos` estén completadas.

**Cómo verificar:** leer el encabezado del `.md` de cada porción prerequisito y buscar:

```
**Estado:** ✅ Completada
```

Si algún prerequisito **no está completado**:

> ⚠️ Esta porción tiene prerequisitos sin completar:
>
> - `porcion-001` — Setup de autenticación base → **pendiente**
>
> No es posible continuar hasta que esas porciones estén implementadas. ¿Querés arrancar por alguna de ellas primero?

**Detener el flujo.** No continuar hasta que el desarrollador confirme.

También verificar que la **porción Front par** esté completada. Si no lo está:

> ⚠️ La porción Front correspondiente (`porcion-{NNN}`) todavía no está completada. El backend debe desarrollarse sobre una estructura visual ya definida. Completá primero la porción Front antes de continuar.

---

### Paso 3 — Leer la estructura del proyecto (máximo 3 lecturas)

Leer ÚNICAMENTE estos archivos en este orden:

1. El **archivo de schema o modelos** del ORM (`schema.prisma`, `entities/`, `models.py`, etc.) — para conocer el estado actual de la BD
2. El **endpoint hermano más cercano** al que se va a crear (mismo dominio/feature, tipo similar) — para inferir convenciones de naming, estructura de capas, formato de respuesta y manejo de errores
3. El **archivo de rutas** donde se va a registrar el nuevo endpoint — solo si no se puede inferir del endpoint hermano

**STOP. No leer ningún archivo más en este paso.**

Convenciones, formato de errores, estructura de capas y patrones de autenticación se infieren del endpoint hermano. Si algo es ambiguo, preguntar al desarrollador antes de leer más archivos.

**Análisis de impacto en clientes existentes en producción:**

Antes de avanzar, verificar si la porción introduce alguno de estos casos que puede romper la app para clientes ya deployados:

| # | Caso | Remedio obligatorio |
|---|------|-------------------|
| 1 | **Campo nuevo en BD sin valor por defecto** | Definir `DEFAULT` en la migración o manejar `null` en código |
| 2 | **Campo nuevo obligatorio (`NOT NULL` sin `DEFAULT`)** | Nunca aplicar sin `DEFAULT` o sin migrar datos existentes primero |
| 3 | **Campo renombrado o eliminado en BD** | Verificar que ningún query activo lo referencie antes de deployar |
| 4 | **Nueva variable de entorno requerida** | Documentar en `.env.example` y agregar error claro al iniciar si falta |
| 5 | **Nueva relación/FK requerida** | Seedear o migrar los datos relacionados para registros existentes |
| 6 | **Nuevo dato de configuración asumido como existente** | Incluir seeder/migración de datos junto con la migración de esquema |
| 7 | **Cambio en contrato de API** | Versionar el endpoint o mantener retrocompatibilidad en el response |

Si se detecta alguno de estos casos, mencionarlo explícitamente en el Paso 4 (explicación) e incluir el remedio concreto antes de pedir confirmación para codear.

**Rutas convencionales — usar directamente sin explorar:**

| Qué | Ruta |
|-----|------|
| Schema Prisma | `prisma/schema.prisma` |
| API de operaciones | `src/app/api/operations/[id]/route.ts` |
| API de operaciones (lista) | `src/app/api/operations/route.ts` |
| API de inversores | `src/app/api/inversores/route.ts` |
| API de stock | `src/app/api/stock/route.ts` |

*(Actualizar esta tabla cuando se agreguen nuevos módulos al proyecto.)*

---

### Paso 4 — Explicar lo que se va a hacer

Antes de escribir código, presentar dos bloques explicativos en lenguaje simple.

> **Qué voy a crear:**
> {describir en 1-3 oraciones qué lógica se implementa y cuál es su función, sin jerga técnica innecesaria}

---

### Paso 5 — Pedir confirmación

> ¿Esto es lo que esperabas? ¿Querés ajustar algo del diseño antes de que empiece a codear?

Esperar confirmación explícita antes de escribir código.

Al confirmar, marcar inmediatamente la porción como en progreso:

```markdown
**Estado:** 🔄 En progreso
```

---

### Paso 6 — Desarrollar la lógica backend

Implementar siguiendo estrictamente las convenciones del proyecto.

**Reglas de desarrollo:**

- Seguir la misma estructura de capas que ya existe (la inferida del endpoint hermano)
- Respetar el formato de respuesta que ya usa el resto de la API
- Implementar todos los criterios de aceptación de la porción
- Validar siempre los datos de entrada: tipos, campos requeridos, formatos, rangos
- Manejar todos los errores posibles: recursos no encontrados, permisos insuficientes, errores de BD
- Si la porción requiere autenticación, aplicar el middleware existente — no inventar uno nuevo
- Ningún valor configurable hardcodeado — siempre via variables de entorno

**Reutilización de lógica existente:**

Antes de crear cualquier función o helper, verificar si ya existe algo equivalente en el endpoint hermano. Si existe, usarlo. Mencionarlo brevemente:

> *"Para el hasheo voy a reutilizar el helper `hashPassword` que ya existe en `utils/crypto.ts`."*

---

### Paso 7 — Migraciones de base de datos

Si la porción requiere crear o modificar tablas, determinar el estado actual desde el schema ya leído en el Paso 3 (no releerlo).

**Clasificar cada entidad necesaria:**

- ✅ **Ya existe con los campos correctos** → mencionar brevemente y continuar
- ⚠️ **Existe pero le faltan campos** → migración de ALTER
- ❌ **No existe** → migración de CREATE

Si **no se necesita migración**, mencionarlo y continuar:

> *"✅ La tabla `operaciones` ya existe con todos los campos necesarios. No se requiere migración."*

Si **sí se necesita migración**, presentar el análisis y pedir confirmación antes de aplicar:

> **🗄️ Esta porción requiere cambios en la base de datos.**
>
> **Estado actual:** {qué existe hoy}
> **Qué se necesita:** {descripción del cambio en lenguaje simple}
> **Por qué:** {qué fallaría sin este cambio}
>
> ¿Confirmás que aplique la migración?

**Para Prisma:** modificar `schema.prisma` y presentar el comando para que el dev ejecute manualmente:

> **📋 Ejecutá este comando en tu terminal:**
> ```
> npx prisma migrate dev --name {nombre_descriptivo}
> ```
> Una vez que lo ejecutes, confirmame si se aplicó correctamente.

Esperar confirmación antes de continuar.

---

### Paso 8 — Seeders y datos de prueba

Si el endpoint depende de que existan registros en la BD para poder probarse (un usuario, un registro de operación, etc.), proponer los datos antes de insertarlos:

> **🌱 Para probar el flujo completo necesitás datos en la base de datos.**
>
> Propongo insertar:
> ```
> {campo}: {valor realista}
> {campo}: {valor realista}
> ```
> ¿Querés que los inserte?

Esperar confirmación. Una vez insertados, indicar cómo verificar el registro en la BD.

---

### Paso 9 — Seguridad

Antes de dar por terminado, revisar en el código implementado:

- **Inyección**: ¿las queries usan parámetros preparados o el ORM? Nunca concatenar input del usuario
- **Datos sensibles en logs**: ¿hay passwords, tokens o datos personales siendo logueados? Eliminarlos
- **Exposición de datos**: ¿la respuesta devuelve campos sensibles que no deberían salir al frontend?
- **Autorización**: ¿el endpoint verifica que el usuario autenticado tiene permiso sobre el recurso específico?

Si se detecta algún problema, corregirlo y mencionárselo al desarrollador. Si algo no puede resolverse en este scope, mencionarlo como deuda técnica.

---

### Paso 10 — Conectar con el frontend

Verificar que el contrato con la porción Front par sea correcto:

- La URL del endpoint coincide con la que usa el componente Front
- El formato del JSON de respuesta coincide con lo que espera el Front
- Los códigos de error que devuelve el Back son los que el Front maneja

Si hay discrepancias, resolverlas y mencionárselas al desarrollador.

---

### Paso 11 — Ciclo de revisión y ajustes

> **✅ Lógica implementada.**
>
> Creé/modifiqué estos archivos:
> - `{archivo 1}` — {qué hace}
> - `{archivo 2}` — {qué hace}
>
> Podés probar el endpoint con:
> ```
> {METHOD} http://localhost:{puerto}/{endpoint}
> Body: {ejemplo de body si aplica}
> ```
>
> ¿Funciona como esperabas, o necesitás algún ajuste?

**Por cada ronda de feedback:**

1. Escuchar los ajustes
2. Implementarlos con `str_replace` quirúrgico — no releer el archivo completo antes de editar salvo que sea estrictamente necesario
3. Actualizar el resumen de archivos si corresponde
4. Preguntar: *"¿Quedó bien, o ajustamos algo más?"*

---

### Paso 12 — Marcar la porción como completada

Una vez confirmado, actualizar el `.md` de la porción:

```markdown
**Estado:** ✅ Completada
**Completada el:** {fecha actual}
```

Los checkboxes de `## Pruebas` **NO se marcan**. Quedan pendientes para la etapa de testing.

> ✅ Porción marcada como completada en `docs/historias-de-usuario/HU-{N}/porcion-{NNN}.md`
>
> Las pruebas unitarias y de integración quedaron pendientes para la etapa de testing.
>
> Siguiente porción sugerida: **porcion-{NNN+1}** — {título} [{tipo}]

---

## Reglas generales

- **Nunca escribir código antes de la confirmación del Paso 5**
- **Nunca marcar pruebas como completadas** — eso es exclusivo de la etapa de testing
- **Nunca avanzar si hay prerequisitos pendientes** — incluyendo la porción Front par
- **Siempre seguir las convenciones del proyecto** — si hay dudas, preguntar antes de inventar
- **Reutilizar antes de crear** — buscar lógica existente antes de escribir algo nuevo
- **Validar siempre los datos de entrada** — nunca asumir que lo que llega del frontend es correcto
- **Ningún valor hardcodeado** — todo configurable via variables de entorno
- **El contrato con el Front es sagrado** — URLs, formatos de respuesta y códigos de error deben coincidir
- **Nunca aplicar migraciones sin confirmación explícita**
- **Nunca insertar datos de prueba sin confirmación explícita**
- **Seguridad no es opcional** — revisar inyección, exposición de datos y autorización en cada porción
- **Nunca loguear datos sensibles**
- **Si algo es ambiguo**, preguntar antes de implementar

---

## Estados del archivo .md de una porción

| Campo | Valor | Cuándo |
|-------|-------|--------|
| `**Estado:**` | *(ausente)* | Porción sin iniciar |
| `**Estado:**` | `🔄 En progreso` | Al confirmar el inicio del desarrollo (Paso 5) |
| `**Estado:**` | `✅ Completada` | Cuando el desarrollador confirma que la lógica está lista |

---

## Relación con otras skills

- **Prerequisito directo**: la porción FRONT par debe estar `✅ Completada` antes de arrancar
- **Prerequisito indirecto**: cualquier porción listada en `Prerequisitos` del `.md` debe estar `✅ Completada`
- **Origen**: `story-decomposer` debe haber generado el `.md` de la porción
- **Testing**: las pruebas unitarias y de integración quedan para la skill de testing posterior