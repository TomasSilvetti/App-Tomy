# HU-1: Módulo de Preguntas con Recordatorios Push

**Como** usuario de la app,
**quiero** crear preguntas con recordatorios push configurables y responderlas desde la notificación o desde la app,
**para** registrar reflexiones o respuestas periódicas de forma organizada y recibir recordatorios automáticos para no olvidarlas.

## Descripción

El módulo "Preguntas" es el núcleo inicial de la app. Permite crear preguntas personales que el usuario quiere responder de forma periódica (por ejemplo: "¿Cómo me sentí hoy?", "¿Qué aprendí esta semana?"). Cada pregunta puede tener configurados recordatorios push con día, horario, período y cantidad de repeticiones. Las respuestas se acumulan en el tiempo y se pueden consultar en orden cronológico inverso. La app es mobile-first y de uso personal (un solo usuario, sin autenticación).

## Criterios de aceptación

- [ ] El módulo muestra una lista de preguntas con: título, cantidad de respuestas registradas, respuestas pendientes (si hay recordatorios configurados), fecha de inicio y fecha de la última respuesta.
- [ ] El botón "Agregar" abre un modal con los campos necesarios para crear una pregunta.
- [ ] Al activar el toggle de recordatorios, se despliegan los campos: día y hora de inicio, período de repetición (configurable: cada N días / semanas / meses), y cantidad de repeticiones.
- [ ] El mini-calendario dentro del modal muestra una preview de las fechas en que se enviará la notificación según la configuración ingresada.
- [ ] Al guardar, la pregunta aparece en la lista y, si tiene recordatorios, se programan las notificaciones push.
- [ ] Al hacer clic en una notificación push, la app se abre en el módulo "Preguntas" y emerge automáticamente un bottom sheet con el título de la pregunta y un textarea para responder.
- [ ] La respuesta ingresada en el bottom sheet se guarda y el contador de respuestas del ítem se actualiza inmediatamente.
- [ ] Al tocar un ítem de la lista se navega a una página de detalle que muestra todas las respuestas, ordenadas de más reciente a más antigua.
- [ ] Cada ítem de la lista tiene un botón de tres puntitos que despliega las opciones "Editar" y "Eliminar".
- [ ] "Editar" abre el mismo modal precargado con los datos actuales de la pregunta.
- [ ] "Eliminar" solicita confirmación antes de borrar la pregunta y sus respuestas.
- [ ] La app incluye un sidebar de navegación entre módulos (por ahora solo visible el módulo "Preguntas").
- [ ] El diseño es responsive y está optimizado para uso en celular.

## Flujos

### Flujo principal — Crear pregunta con recordatorio

1. El usuario entra al módulo "Preguntas" y ve la lista de preguntas existentes.
2. Toca el botón "Agregar" en la parte superior.
3. Se abre un modal con un input de título (placeholder: "Pregunta") y un toggle de recordatorios desactivado por defecto.
4. El usuario ingresa el título y activa el toggle de recordatorios push.
5. Se despliegan los campos: día y hora de inicio, período de repetición (ej: cada 1 semana), y cantidad de repeticiones (ej: 4 veces).
6. El mini-calendario se actualiza en tiempo real mostrando las fechas proyectadas.
7. El usuario guarda → la pregunta aparece en la lista con 0 respuestas y las fechas programadas.

### Flujo principal — Responder desde notificación push

1. El usuario recibe una notificación push en el horario configurado.
2. Toca la notificación → la app se abre en el módulo "Preguntas".
3. Emerge automáticamente un bottom sheet (estilo iOS) con el título de la pregunta y un textarea vacío.
4. El usuario escribe su respuesta y confirma.
5. La respuesta se guarda, el bottom sheet se cierra y el contador de respuestas del ítem se actualiza.

### Flujo alternativo — Ver historial de respuestas

1. El usuario toca un ítem de la lista de preguntas.
2. Navega a una página de detalle de esa pregunta.
3. Ve todas las respuestas ordenadas de más reciente (arriba) a más antigua (abajo).

### Flujo alternativo — Editar o eliminar pregunta

1. El usuario toca el botón de tres puntitos en un ítem de la lista.
2. Se despliegan las opciones "Editar" y "Eliminar".
3. **Editar:** se abre el modal precargado con los datos actuales; el usuario modifica y guarda.
4. **Eliminar:** aparece un diálogo de confirmación; si confirma, se borra la pregunta y todas sus respuestas.

### Flujo alternativo — Crear pregunta sin recordatorio

1. El usuario crea una pregunta con el toggle de recordatorios desactivado.
2. Se guarda sin configurar notificaciones.
3. El ítem en la lista no muestra fechas programadas ni respuestas pendientes.

### Flujo alternativo — Responder desde la app directamente

1. El usuario entra al módulo "Preguntas" sin haber recibido una notificación.
2. Toca un ítem de la lista → navega a la página de detalle con el historial de respuestas.
3. Desde esa página puede agregar una nueva respuesta manualmente.

## Notas técnicas

⚠️ **Base de datos:** Esta historia requiere al menos dos entidades persistentes: `Pregunta` (título, configuración de recordatorio: día/hora, período, cantidad de repeticiones, fecha de creación) y `Respuesta` (texto, fecha, referencia a la pregunta). Las notificaciones push requieren almacenar las suscripciones del browser en una tabla `PushSubscription` (endpoint, p256dh, auth) según la guía `docs/push-notifications-guide.md`. El equipo deberá verificar si la programación de notificaciones recurrentes se maneja con un scheduler (ej: cron job en Vercel) o con lógica basada en fechas calculadas al momento del envío.
