---
name: story-decomposer
description: >
  Descompone una historia de usuario en porciones atomicas y testeables, cada una con su descripcion, ejemplo de uso, criterios de aceptacion y pruebas unitarias/de integracion.
  Usa esta skill SIEMPRE que el usuario mencione descomponer historia, dividir historia, partir historia en tareas, crear porciones, atomizar historia de usuario,
  o cuando comparta un archivo .md de una HU y pida dividirla, descomponerla o crear las porciones de desarrollo.
  Cada componente de la historia genera un par de porciones: una Front (visual) y una Back (funcional), salvo que sea exclusivamente de un solo lado.
  Las porciones se guardan como archivos .md individuales dentro de la carpeta de la HU correspondiente.
---

# Story Decomposer

Toma el archivo `.md` de una historia de usuario generada por la skill `user-story-generator` y la descompone en porciones atómicas de desarrollo, organizadas en pares Front + Back, listas para ser implementadas y testeadas de forma independiente.

---

## Conceptos clave

- **Porción**: Unidad mínima de desarrollo que puede implementarse y testearse de forma independiente. Se nombra `porcion-001`, `porcion-002`, etc.
- **Par Front + Back**: Cada componente funcional genera dos porciones. La porción Front desarrolla lo visual/interactivo; la porción Back lo hace completamente funcional conectando con la lógica de negocio y datos. La porción Back **siempre va después** de su par Front.
- **Porción sin par**: Cuando algo es exclusivamente frontend (ej: un componente puramente estático) o exclusivamente backend (ej: un job en background sin UI), se crea una sola porción sin par.


### Criterio de clasificación FRONT vs BACK

Usar esta regla para no confundir infraestructura frontend con backend:

| Es FRONT si... | Es BACK si... |
|----------------|---------------|
| Vive en el cliente (React, Vue, etc.) | Vive en el servidor |
| Son componentes, hooks, contextos, layouts, stores, estilos | Son endpoints, controladores, servicios, modelos, migraciones |
| Maneja estado de UI, navegación, renderizado | Maneja lógica de negocio, base de datos, autenticación server-side |
| Ejemplos: `AppLayout`, `SidebarContext`, `useSidebar()`, `ThemeProvider`, Redux store | Ejemplos: `auth.controller.ts`, `UserService`, `POST /api/login`, migraciones SQL |

**Regla clave**: contextos React, hooks, providers, layouts y stores de estado (Zustand, Redux, etc.) son siempre **FRONT**, aunque sean "infraestructura base" que otros componentes consumen. El criterio es dónde se ejecuta el código, no si es visual o no.

---

## Formato de cada porción

Cada porción se guarda como un archivo `.md` individual:

**Ruta:** `docs/historias-de-usuario/HU-{N}/porcion-{NNN}.md`

```markdown
# porcion-{NNN} — {Título descriptivo} [{FRONT|BACK|FRONT+BACK}]

**Historia de usuario:** HU-{N}: {Título de la HU}
**Par:** porcion-{NNN} *(solo si tiene par, indicar el número del par)*
**Tipo:** FRONT | BACK | FRONT+BACK *(FRONT+BACK solo para porciones sin par tecnológico)*
**Prerequisitos:** porcion-{NNN}, porcion-{NNN} *(porciones que deben estar completas antes de arrancar esta; si no hay, escribir "Ninguno")*

## Descripción

{Qué se implementa en esta porción, en el lenguaje más sencillo posible. Sin jerga técnica innecesaria. Una o dos oraciones máximo.}

## Ejemplo de uso

{Un ejemplo concreto y simple de cómo se usaría o vería esta porción una vez implementada. En lenguaje natural.}

## Criterios de aceptación

- [ ] {criterio 1}
- [ ] {criterio 2}
- [ ] {criterio 3}
- [ ] El componente es responsive y se visualiza correctamente en mobile, tablet y desktop *(solo para porciones FRONT)*


---

## Flujo de trabajo

### Paso 1 — Leer y analizar la HU

Lee el archivo `.md` de la historia de usuario. Identifica:

- Los **componentes funcionales** presentes (formularios, listados, modales, endpoints, validaciones, integraciones con servicios externos, etc.)
- Qué componentes requieren **par Front + Back** y cuáles son de un solo lado
- El **orden lógico de implementación**: generalmente primero Front (estructura visual), luego Back (lógica funcional), pero puede variar si hay dependencias
- Las **dependencias entre porciones**: detectar si alguna porción requiere infraestructura base que todavía no existe (ej: sistema de autenticación, configuración de base de datos, servicios compartidos). Estas porciones de infraestructura deben ir primero, antes de los pares Front + Back regulares, y todas las porciones que dependen de ellas deben declararlas explícitamente en su campo `Prerequisitos`
- Las **necesidades de base de datos**: si la HU implica persistencia de datos, analizar el proyecto para determinar el estado actual del esquema

**Análisis de base de datos — cómo hacerlo:**

1. Detectar qué ORM o sistema de migraciones usa el proyecto (Prisma → `schema.prisma`, TypeORM → `entities/`, Django → `models.py`, Eloquent → `migrations/`, etc.)
2. Leer los modelos/migraciones existentes para conocer qué tablas y campos ya existen
3. Determinar para cada entidad que necesita la HU:
   - ✅ **Ya existe** con todos los campos necesarios → no requiere porción de migración
   - ⚠️ **Existe parcialmente** → requiere porción de migración para agregar campos
   - ❌ **No existe** → requiere porción de migración para crear la tabla completa

Si se detecta trabajo de BD, crear una porción BACK específica para la migración **antes** de cualquier otra porción BACK que dependa de esos datos, y marcarla como prerequisito de las que la necesiten.

Si el proyecto no tiene estructura de BD todavía, crear una porción BACK de "setup inicial de base de datos" como primera porción.

### Paso 2 — Proponer el plan de porciones al usuario

Antes de generar los archivos, presenta al usuario un resumen del plan de descomposición para que lo valide:

> Analicé la HU. Propongo descomponerla en **{N} porciones**:
>
> | # | Porción | Tipo | Par | Prerequisitos |
> |---|---------|------|-----|---------------|
> | porcion-001 | Setup de autenticación base | BACK | — | Ninguno |
> | porcion-002 | Formulario de registro — vista | FRONT | porcion-003 | Ninguno |
> | porcion-003 | Formulario de registro — lógica y API | BACK | porcion-002 | porcion-001 |
> | porcion-004 | Validación de campos en tiempo real | FRONT | porcion-005 | Ninguno |
> | porcion-005 | Endpoint de validación | BACK | porcion-004 | porcion-001 |
>
> ¿Este desglose tiene sentido? ¿Querés agregar, quitar o ajustar alguna porción antes de generarlas?

Espera confirmación antes de continuar.

### Paso 3 — Preguntar solo lo necesario

Si hay ambigüedades en la HU que impidan definir bien una porción (por ej: no queda claro si la validación es solo client-side o también server-side), pregunta puntualmente. **Máximo 3 preguntas a la vez.**

### Paso 4 — Generar las porciones

Una vez aprobado el plan, genera cada porción siguiendo el formato definido arriba.

**Reglas al generar:**

- La descripción debe ser comprensible por cualquier miembro del equipo, incluso sin contexto técnico profundo
- Los criterios de aceptación deben ser verificables con Sí/No
- Mínimo 2 pruebas unitarias y 1 de integración por porción (salvo casos muy simples)
- Los edge cases van en las pruebas: entradas vacías, valores límite, permisos insuficientes, errores de red, timeouts, datos duplicados, etc.
- La porción Back debe referenciar explícitamente qué datos o contratos expone/consume de su par Front

### Paso 5 — Guardar los archivos

Crea la carpeta de la HU si no existe y guarda cada porción como archivo individual:

```bash
# 1. Crear carpeta si no existe
mkdir -p docs/historias-de-usuario/HU-{N}

# 2. Mover la HU madre dentro de la carpeta
mv docs/historias-de-usuario/HU-{N}.md docs/historias-de-usuario/HU-{N}/HU-{N}.md

# 3. Guardar cada porción
# docs/historias-de-usuario/HU-{N}/porcion-001.md
# docs/historias-de-usuario/HU-{N}/porcion-002.md
# ...
```

**Estructura resultante:**
```
docs/historias-de-usuario/
└── HU-{N}/
    ├── HU-{N}.md        ← historia madre
    ├── porcion-001.md
    ├── porcion-002.md
    └── ...
```

**Numeración:** Las porciones se numeran globalmente dentro de la HU, en orden de implementación sugerido (primero Front, luego su par Back, después el siguiente componente).

Confirma al usuario al finalizar:

> ✅ Generadas {N} porciones en `docs/historias-de-usuario/HU-{N}/`:
> - HU-{N}.md — historia madre (movida)
> - porcion-001.md — {título}
> - porcion-002.md — {título}
> ...

---

## Reglas importantes

- **Atomicidad**: cada porción debe poder desarrollarse en una sesión de trabajo sin depender de que otra porción esté terminada, excepto su par directo
- **Orden**: siempre Front antes que Back dentro de un par; el Back no puede implementarse sin la estructura visual definida en el Front
- **Sin E2E**: no incluir pruebas de flujo completo de usuario; esas se realizan manualmente como validación
- **Lenguaje simple**: las descripciones y ejemplos deben ser entendibles por alguien que no escribió el código
- **Edge cases obligatorios**: cada porción debe contemplar al menos 2 casos borde en sus pruebas
- **Consistencia con la HU**: los criterios de aceptación de las porciones deben trazarse con los criterios de la HU madre; nada que contradiga la HU
- **Responsive obligatorio en porciones FRONT**: toda porción de tipo FRONT debe incluir siempre el criterio de aceptación de responsividad (mobile, tablet y desktop). No es negociable ni opcional

---

## Ejemplo de porción generada

```markdown
# porcion-001 — Formulario de login — vista [FRONT]

**Historia de usuario:** HU-3: Autenticación de usuarios
**Par:** porcion-002
**Prerequisitos:** Ninguno

## Descripción

Crear la pantalla de login con los campos de email y contraseña, el botón de ingreso y el mensaje de error visible cuando las credenciales son incorrectas.

## Ejemplo de uso

El usuario abre la aplicación, ve el formulario con dos campos (email y contraseña) y un botón "Ingresar". Si ingresa datos inválidos, aparece un mensaje de error debajo del formulario.

## Criterios de aceptación

- [ ] El formulario muestra los campos email y contraseña
- [ ] El botón "Ingresar" está deshabilitado si algún campo está vacío
- [ ] Se muestra un mensaje de error cuando las credenciales son incorrectas
- [ ] El campo contraseña oculta el texto por defecto con opción de mostrarlo

## Pruebas

### Pruebas unitarias

- [ ] El botón "Ingresar" se deshabilita cuando email está vacío
- [ ] El botón "Ingresar" se deshabilita cuando contraseña está vacía
- [ ] El mensaje de error se muestra cuando el componente recibe el estado "credenciales inválidas"
- [ ] El toggle de visibilidad de contraseña cambia el tipo del input entre "password" y "text"

### Pruebas de integración

- [ ] Al hacer clic en "Ingresar" con campos completos, se dispara la llamada al servicio de autenticación
- [ ] Si el servicio devuelve error 401, el componente muestra el mensaje de error correspondiente
```

---

## Relación con user-story-generator

Esta skill es la continuación natural de `user-story-generator`. El archivo `.md` generado por esa skill es el input esperado aquí. Si el usuario provee texto libre en lugar de un archivo estructurado, procesarlo igual pero advertir que los resultados serán más precisos trabajando desde una HU formal.