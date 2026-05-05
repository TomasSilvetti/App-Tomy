---
name: frontend-developer
description: >
  Desarrolla porciones de tipo FRONT a partir de su archivo .md.
  Usa esta skill SIEMPRE que el usuario mencione desarrollar porcion front, implementar componente frontend, arrancar porcion frontend,
  o cuando comparta una porcion de tipo FRONT y pida desarrollarla o implementarla.
  La skill verifica prerequisitos, analiza la estructura del proyecto, desarrolla el componente siguiendo los lineamientos existentes,
  y acompana al desarrollador en un ciclo de revision hasta que el componente quede confirmado. Marca la porcion como completada al finalizar.
---

# Frontend Developer

Toma una porción de tipo FRONT y la lleva desde cero hasta confirmada: verifica prerequisitos, analiza el proyecto, desarrolla el componente, guía la revisión visual y marca la porción como completada.

---

## Reglas de eficiencia (NO negociables)

Estas reglas tienen prioridad sobre cualquier otra instrucción del flujo.

- **Un archivo, una lectura.** Si necesitás distintas partes de un archivo, leelo completo en una sola llamada. Nunca en rangos separados.
- **Máximo 4 archivos leídos por porción:** el `.md` de la porción + `package.json` + el componente hermano más cercano + el archivo donde se integra. Cualquier lectura adicional requiere justificación explícita.
- **No usar glob patterns.** Las rutas convencionales del proyecto están documentadas al final de esta skill. Usarlas directamente sin explorar.
- **No releer después de editar.** Si el `str_replace` o la escritura fue exitosa, asumir que está bien. No verificar releyendo el archivo.
- **No leer para confirmar que algo existe.** Si la porción menciona un componente, usarlo directamente. El error de compilación indicará si no existe.
- **No leer archivos de UI genéricos** (Button, Input, Badge, etc.) salvo que el componente hermano los importe y su interfaz sea ambigua para el uso concreto que se necesita.

---

## Flujo de trabajo

### Paso 1 — Leer la porción

Leer el archivo `.md` de la porción FRONT proporcionada. Extraer:

- **Título y descripción** de lo que hay que implementar
- **Prerequisitos**: lista de porciones que deben estar completas antes de arrancar
- **Par Back**: número de la porción Back asociada (para tenerla en cuenta como referencia de contratos)
- **Criterios de aceptación**: qué debe cumplir el componente
- **Pruebas**: guardarlas en mente pero NO marcarlas como completadas en ningún momento

---

### Paso 2 — Verificar prerequisitos

Antes de cualquier otra cosa, verificar que las porciones listadas en `Prerequisitos` estén completadas.

**Cómo verificar:** leer el encabezado del `.md` de cada porción prerequisito y buscar la línea:

```
**Estado:** ✅ Completada
```

Si algún prerequisito **no está completado**:

> ⚠️ Esta porción tiene prerequisitos sin completar:
>
> - `porcion-001` — Setup de autenticación base → **pendiente**
>
> No es posible continuar hasta que esas porciones estén implementadas. ¿Querés arrancar por alguna de ellas primero?

**Detener el flujo.** No continuar hasta que el desarrollador confirme que los prerequisitos están resueltos.

Si todos los prerequisitos están completos, continuar al Paso 3.

---

### Paso 3 — Leer la estructura del proyecto (máximo 3 lecturas)

Leer ÚNICAMENTE estos archivos en este orden:

1. `package.json` → detectar framework, versión y comando dev
2. El **componente hermano más cercano** al que se va a crear (mismo directorio destino, tipo similar)
3. El **archivo donde se va a integrar** el nuevo componente (la página o layout que lo va a contener)

**STOP. No leer ningún archivo más en este paso.**

La estructura de carpetas, convenciones de naming, sistema de estilos y patrones se infieren de esos 3 archivos. Si algo es ambiguo, preguntar al desarrollador antes de leer más archivos.

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

Si se detecta alguno de estos casos, mencionarlo en el resumen del Paso 4 con el remedio concreto antes de arrancar el desarrollo.

**Rutas convencionales — usar directamente sin explorar:**

| Qué | Ruta |
|-----|------|
| Componentes de operaciones | `src/components/operations/` |
| Componentes UI reutilizables | `src/components/ui/` |
| Página de detalle de operación | `src/app/operaciones/[id]/page.tsx` |
| Página de edición de operación | `src/app/operaciones/[id]/edit/page.tsx` |
| API de operaciones | `src/app/api/operations/[id]/route.ts` |

*(Actualizar esta tabla cuando se agreguen nuevas secciones del proyecto.)*

---

### Paso 4 — Presentar resumen y pedir referencia visual

Con toda la información recolectada, presentar un resumen y pedir la referencia visual en una sola pausa:

> **📋 Listo para arrancar. Esto es lo que voy a hacer:**
>
> **Qué:** {descripción de la porción en lenguaje simple, 1-2 oraciones}
>
> **Dónde:** `src/components/operations/NombreComponente.tsx` *(ruta exacta según las convenciones del proyecto)*
>
> **Ruta en la app:** `/operaciones/[id]` *(la URL donde se podrá ver una vez levantado el servidor)*
>
> **Framework/estilos:** Next.js + Tailwind *(o lo que corresponda)*
>
> **🎨 ¿Cómo debe verse?** Antes de arrancar, compartí una referencia visual:
> - Una **imagen o screenshot** (mockup, Figma, boceto, referencia de otro producto)
> - Una **descripción** de cómo debe verse (disposición, colores, estilo general)
>
> Si no tenés referencia, decime "a tu criterio" y lo diseño siguiendo el sistema de estilos del proyecto.

**Comportamiento según la respuesta:**

- **Imagen**: analizarla y confirmar brevemente cómo se va a traducir al código.
- **Descripción textual**: parafrasear el entendimiento para confirmar antes de arrancar.
- **"A tu criterio"**: diseñar siguiendo las convenciones del proyecto, mencionando brevemente las decisiones tomadas.

Una vez recibida la referencia, marcar la porción como en progreso en el `.md`:

```markdown
**Estado:** 🔄 En progreso
```

---

### Paso 5 — Desarrollar el componente

Una vez confirmado, implementar el componente siguiendo estrictamente las convenciones del proyecto.

**Reglas de desarrollo:**

- Seguir el mismo naming, estructura de carpetas y sistema de estilos que ya existe en el proyecto
- Implementar todos los criterios de aceptación de la porción
- Contemplar los estados relevantes: cargando, error, vacío, éxito
- No conectar con el backend todavía; usar datos mock o props si hace falta mostrar contenido dinámico
- Si la porción necesita una nueva ruta, declararla siguiendo el sistema de routing existente
- Mantener el componente lo más simple posible: solo lo que describe la porción, nada más

**Reutilización de componentes existentes:**

Antes de crear cualquier elemento UI, verificar si ya existe un componente que cumpla esa función. Si existe, usarlo. No duplicar. Mencionarlo brevemente:

> *"Para el campo de monto voy a reutilizar el componente `NumericInput` que ya existe en `src/components/ui/NumericInput.tsx`."*

**Ruta de la app — verificar que exista:**

Antes de indicar la URL de revisión, verificar que la página o layout donde va el componente ya existe. Si no existe, preguntar antes de crear la página contenedora.

**Accesibilidad mínima obligatoria:**

- Imágenes con atributo `alt` descriptivo
- Inputs con `label` asociado (`htmlFor` o wrapping)
- Botones con texto descriptivo o `aria-label` si son solo íconos
- Elementos interactivos accesibles por teclado

**Variables de entorno:**

Si el componente referencia una URL de API u otro valor configurable, usar variables de entorno siguiendo el sistema del proyecto. Nunca hardcodear.

**Responsividad:**

Todo componente debe ser responsive por defecto, salvo que la porción `.md` indique explícitamente lo contrario.

---

### Paso 6 — Indicar cómo revisar

Una vez creado el componente, dar las instrucciones de revisión:

> **✅ Componente implementado.**
>
> Para verlo, levantá el servidor con:
> ```
> {comando detectado del package.json, ej: npm run dev}
> ```
>
> Luego abrí: `{URL completa, ej: http://localhost:3000/operaciones/[id]}`
>
> *Si ya tenés el servidor corriendo, recargá la página.*
>
> ¿Se ve como esperabas, o necesitás algún ajuste?

---

### Paso 7 — Ciclo de revisión y ajustes

Entrar en un loop de revisión hasta que el desarrollador confirme que el componente está perfecto.

**Por cada ronda de feedback:**

1. Escuchar los ajustes solicitados
2. Implementarlos con `str_replace` quirúrgico — no releer el archivo completo antes de editar salvo que sea estrictamente necesario
3. Volver a indicar la URL para revisión
4. Preguntar: *"¿Quedó bien, o ajustamos algo más?"*

Si el desarrollador pide algo que contradice los criterios de aceptación:

> Ese cambio entraría en conflicto con el criterio *"..."* de la porción. ¿Querés igualmente hacerlo y actualizar el criterio, o lo dejamos como estaba?

---

### Paso 8 — Marcar la porción como completada

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

- **Nunca escribir código antes de la confirmación del Paso 4**
- **Nunca marcar pruebas como completadas** — eso es exclusivo de la etapa de testing
- **Nunca avanzar si hay prerequisitos pendientes** — el orden importa
- **Siempre seguir las convenciones del proyecto** — si hay dudas, preguntar antes de inventar
- **Un componente por porción** — no adelantar lógica que corresponde a la porción Back
- **Si algo es ambiguo**, preguntar antes de implementar; mejor una pregunta que rehacer todo
- **Reutilizar antes de crear** — verificar componentes existentes antes de crear uno nuevo
- **Verificar que la ruta exista** — si la página contenedora no existe, crearla con confirmación
- **Accesibilidad siempre** — labels, alt, aria-label y navegación por teclado son obligatorios
- **Variables de entorno** — ningún valor configurable hardcodeado
- **Responsive por defecto** — todo componente se adapta a distintos tamaños salvo indicación contraria

---

## Estados del archivo .md de una porción

| Campo | Valor | Cuándo |
|-------|-------|--------|
| `**Estado:**` | *(ausente)* | Porción sin iniciar |
| `**Estado:**` | `🔄 En progreso` | Al confirmar el inicio del desarrollo (Paso 4) |
| `**Estado:**` | `✅ Completada` | Cuando el desarrollador confirma que el componente está listo |

---

## Relación con otras skills

- **Prerequisito**: `story-decomposer` debe haber generado el `.md` de la porción antes de usar esta skill
- **Siguiente paso**: una vez completada la porción FRONT, la porción BACK par puede desarrollarse con `backend-developer`
- **Testing**: las pruebas unitarias y de integración quedan para la skill de testing posterior