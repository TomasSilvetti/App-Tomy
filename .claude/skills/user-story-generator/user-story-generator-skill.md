---
name: user-story-generator
description: >
  Convierte historias escritas en lenguaje natural por desarrolladores en historias de usuario formales con formato Scrum.
  Usa esta skill SIEMPRE que el usuario mencione convertir historia, historia de usuario, user story, quiero documentar una funcionalidad,
  tengo una historia, o cuando pegue texto descriptivo de una funcionalidad y pida formalizarla.
  La skill guia al desarrollador con preguntas para completar los campos faltantes, valida con ejemplos concretos,
  y guarda el resultado como archivo .md numerado en docs/historias-de-usuario/.
---

# User Story Generator

Convierte texto libre de un desarrollador en una historia de usuario formal con formato Scrum estándar, mediante un proceso conversacional iterativo.

---

## Campos de la historia de usuario final

La historia debe contener SIEMPRE estos campos:

```markdown
# HU-{N}: {Título}

**Como** {rol},
**quiero** {acción},
**para** {beneficio/objetivo}.

## Descripción

{Párrafo en lenguaje natural explicando de qué trata la historia, qué problema resuelve y cuál es el contexto en el que ocurre. Sin tecnicismos innecesarios, redactado para que cualquier miembro del equipo lo entienda.}

## Criterios de aceptación

- [ ] {criterio 1}
- [ ] {criterio 2}
- [ ] {criterio 3}
...

## Flujos

### Flujo principal (escenario de éxito)

1. {paso 1}
2. {paso 2}
3. {paso 3}
...

### Flujo alternativo 1 — {nombre del flujo, ej: "Usuario no autenticado"}

1. {paso 1}
2. {paso 2}
...

### Flujo alternativo 2 — {nombre del flujo, ej: "Error de validación"} *(si aplica)*

1. {paso 1}
2. {paso 2}
...

## Notas técnicas

⚠️ **Base de datos:** {si la historia implica guardar, leer, modificar o eliminar datos persistentes, mencionarlo aquí en lenguaje simple. Ejemplo: "Esta historia probablemente requiere almacenar registros de X en la base de datos. El equipo deberá verificar si la estructura necesaria ya existe o si hay que crearla." Si la historia es puramente visual/navegacional y no implica persistencia, omitir esta sección.}
```

---

## Flujo de trabajo

### Paso 1 — Analizar la historia recibida

Lee cuidadosamente el texto del desarrollador e identifica qué campos ya están cubiertos (aunque sea implícitamente) y cuáles faltan.

**Campos a detectar:**
- **Rol**: ¿quién usa esta funcionalidad? (usuario, admin, cliente, vendedor, etc.)
- **Acción**: ¿qué quiere hacer?
- **Beneficio**: ¿para qué? ¿qué problema resuelve?
- **Criterios de aceptación**: ¿qué condiciones deben cumplirse para considerar la historia completada?
- **Flujo principal**: ¿cuáles son los pasos del escenario exitoso, de principio a fin?
- **Flujos alternativos**: ¿qué pasa cuando algo falla, el usuario no tiene permisos, los datos son inválidos, etc.? ¿Cuántos casos borde hay?
- **Persistencia de datos**: ¿la historia implica guardar, leer, modificar o eliminar datos? ¿Qué entidades o conceptos de negocio están involucrados? (usuarios, productos, pedidos, etc.)

### Paso 2 — Hacer preguntas SOLO para los campos faltantes

**No preguntes lo que ya está respondido.** Si el rol, acción y beneficio son claros, salta directo a los criterios y flujos.

Agrupa las preguntas pendientes en un solo mensaje, numeradas y claras. Ejemplo:

> Entendí la historia. Me faltan algunos detalles:
>
> 1. ¿Quién es el usuario principal de esta funcionalidad? (ej: cliente registrado, administrador, agente de soporte)
> 2. ¿Cuándo debería ocurrir X? ¿Hay condiciones previas?
> 3. ¿Qué pasa si Y falla? ¿Hay un comportamiento alternativo esperado?

**Siempre pregunta por flujos alternativos** si el desarrollador no los mencionó. Como mínimo indaga:
- ¿Qué pasa si el usuario no tiene permisos?
- ¿Qué pasa si los datos de entrada son inválidos o incompletos?
- ¿Hay algún estado de error o excepción relevante?

**Nunca hagas más de 5 preguntas a la vez.** Si hacen falta más, divide en rondas.

### Paso 3 — Proponer flujos para validación

Una vez que tengas suficiente contexto, ANTES de generar la historia final, propón el flujo principal y los flujos alternativos detectados, y pregunta si los entendiste bien:

> Basándome en lo que me contaste, así entiendo los flujos:
>
> **Flujo principal:** 1. El usuario hace X → 2. El sistema responde con Y → 3. El usuario confirma Z.
> **Flujo alternativo — Error de validación:** 1. El usuario ingresa datos inválidos → 2. El sistema muestra mensaje de error → 3. El usuario puede corregir y reintentar.
>
> ¿Esto refleja bien lo que buscás? ¿Falta algún flujo o caso borde?

Espera confirmación o corrección antes de generar la historia final.

### Paso 4 — Generar y guardar la historia de usuario

Una vez que el desarrollador confirma los flujos, generar la historia completa y guardarla directamente como archivo `.md`. **No mostrar la historia en el chat esperando una confirmación extra** — la confirmación de los flujos es suficiente.

Guardar el archivo:

1. Detecta el próximo número disponible en `docs/historias-de-usuario/`
2. El archivo se llama `HU-{N}.md` (ej: `HU-3.md`)
3. Actualiza el título interno `# HU-{N}: {Título}` con el número correcto

**Código para determinar el número:**
```bash
# Listar archivos existentes y obtener el próximo número
ls docs/historias-de-usuario/HU-*.md 2>/dev/null | \
  grep -oP 'HU-\K[0-9]+' | sort -n | tail -1
# Si no hay archivos, empezar desde 1
```

**Ruta final:** `docs/historias-de-usuario/HU-{N}.md`

Confirma al usuario con un mensaje como:
> ✅ Historia guardada como `docs/historias-de-usuario/HU-3.md`

---

## Reglas importantes

- **Idioma**: Responde en el mismo idioma en que el desarrollador escribió la historia. Si está en español, todo en español. Si en inglés, en inglés.
- **Tono**: Profesional pero cercano. Sos un compañero de equipo, no un formulario burocrático.
- **No inventes criterios**: Si no tenés información suficiente para un criterio, pregunta. No rellenes con genéricos vacíos como "el sistema debe funcionar correctamente".
- **Criterios de aceptación deben ser verificables**: Cada criterio debe poder responderse con Sí/No. Evita criterios ambiguos.
- **Mínimo 3 criterios de aceptación**, salvo que la historia sea muy simple.
- **Mínimo 1 flujo alternativo** además del flujo principal, salvo que la historia no tenga casos borde posibles.
- Si el desarrollador aprueba sin cambios, guardá inmediatamente sin pedir más confirmación.

---

## Ejemplo de interacción completa

**Desarrollador escribe:**
> "Necesito que el usuario pueda filtrar productos por categoría en la pantalla de catálogo"

**Claude responde:**
> Entendí la idea. Para completar la historia necesito algunos detalles:
>
> 1. ¿Quién es el usuario? ¿Cualquier visitante o solo usuarios registrados?
> 2. ¿Los filtros son de selección única o múltiple? (¿puede filtrar por "Ropa" y "Electrónica" a la vez?)
> 3. ¿Qué pasa si no hay productos en una categoría? ¿Se muestra un mensaje vacío?

*[Desarrollador responde]*

> Perfecto. Antes de generar la historia, ¿estos flujos representan bien lo que buscás?
>
> **Flujo principal:** El usuario ve el catálogo completo, hace clic en una categoría y la página se actualiza mostrando solo los productos de esa categoría.
> **Flujo alternativo — Sin resultados:** El usuario selecciona una categoría sin productos; se muestra el mensaje "No hay productos disponibles en esta categoría."

*[Desarrollador confirma]*

> [genera historia completa y pregunta si está OK]

*[Desarrollador aprueba]*

> ✅ Historia guardada como `docs/historias-de-usuario/HU-1.md`