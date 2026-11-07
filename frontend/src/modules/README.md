# modules/

Cada carpeta es una funcionalidad independiente que un equipo puede activar o desactivar (`teams.enabled_modules`). Las rutas son relativas al equipo: `partidos` se abre en `/equipos/<id>/partidos`.

| Módulo | Para qué sirve | En el menú | Rol mínimo | Sin conexión |
| --- | --- | --- | --- | --- |
| `matches/` | Calendario mensual (partidos y entrenamientos), crear, editar y borrar partidos, info con mapa y resultado por sets, disponibilidad y la pestaña Gestión (convocatoria con dorsal y posiciones del partido) | Partidos | Jugador | No |
| `roster/` | Plantilla. El staff añade y edita jugadores (dorsal, posición principal y otras) y marca quién compite o solo entrena; los jugadores la ven sin poder cambiarla | Plantilla | Jugador | No |
| `lineup/` | Pestaña Rotación del partido: sistema, R inicial, alineación, líberos y cambios. En la fase 2, modo partido | — (pestaña del partido) | Segundo entrenador | Sí |
| `teams/` | Ajustes del equipo: datos y sistema predeterminado, color, secciones activas, códigos, solicitudes, miembros (quitar, transferir), horario, pabellones, rivales y borrar el equipo | Ajustes | Entrenador | No |

Previsto: `results/` (resultados y tabla) y `mvp/`.

## Anatomía de un módulo

```
modules/matches/
├── index.ts            Registro del módulo (ModuleDefinition): id, nombre, rutas, menú, rol, offline
├── api.ts              Consultas y cambios en Supabase con TanStack Query (useQuery / useMutation)
├── CalendarPage.tsx    Página: lee los datos, guarda el estado y reparte el trabajo entre componentes
├── components/         Bloques visuales de la página, cada uno en su fichero
└── calendarEvents.ts   Tipos y funciones puras del módulo (sin React)
```

No hace falta tener todas las piezas: un módulo pequeño puede ser solo `index.ts` y una página.

## Añadir un módulo

1. Crea `modules/<id>/` con su página.
2. Crea `modules/<id>/index.ts` exportando un `ModuleDefinition`, con rutas y menú relativos al equipo. El `id` tiene que coincidir con el valor que se guarda en `teams.enabled_modules`.
3. Añádelo al array de `core/modules/registry.ts`.

## Regla de oro

Un módulo **no importa nada de otro módulo**. Si dos módulos necesitan lo mismo, va a `shared/` (UI, utilidades, tipos) o a `core/` (infraestructura). Entre módulos solo se enlaza por URL (por ejemplo, las pestañas del partido apuntan a `partidos/<id>/gestion`, de `matches`, y a `partidos/<id>/rotacion`, de `lineup`). Varios módulos piden los mismos datos (`players`, `matches`) con la misma clave de caché, así que se comparten sin importarse.

## Ficheros del módulo `matches`

| Fichero | Qué hace |
| --- | --- |
| `CalendarPage.tsx` | Calendario del mes, lo que pasa el día elegido y los próximos partidos. El jugador que compite responde ahí mismo; el staff crea partidos y cancela un entrenamiento suelto |
| `MatchDetailPage.tsx` | Pestaña Info: datos, mapa y resultado. Jugador: "¿Puedes venir?" mientras no se haya jugado (o aviso si solo entrena). Staff: recuento de respuestas, resultado por sets y "Editar o borrar partido" |
| `EditMatchPage.tsx` | Editar los datos del partido o borrarlo (con confirmación) |
| `components/MatchForm.tsx` | Formulario común de crear y editar: rival sugerido de la lista o escrito (con "guardar en la lista"), hora en 24 h, calentamiento en pasos de 15 min y pabellón de la lista u otro con su enlace de Maps |
| `components/ResultEditor.tsx`, `ResultSummary.tsx` | Puntos de cada set (hasta 5) y "Ganado 3-1" con el detalle |
| `ManagementPage.tsx` | Pestaña Gestión (staff): convocatoria entre los que compiten, con dorsal y posiciones solo para ese partido. Cada cambio envía solo el campo tocado, para que dos cambios seguidos no se pisen |
| `NewMatchPage.tsx` | Formulario de partido nuevo (staff) |
| `api.ts` | Partidos, entrenamientos y cancelaciones, disponibilidad y convocatoria. Disponibilidad y convocatoria se actualizan al momento en pantalla y se deshacen si el servidor falla |
| `calendarEvents.ts` | Qué hay cada día y próximos partidos |
| `components/MonthCalendar.tsx` | Mes de lunes a domingo; burbuja azul = partido, verde = entrenamiento. Las burbujas crecen con el ancho del propio calendario (container queries): punto, hora, u hora y texto |
| `components/MatchEventCard.tsx`, `TrainingEventCard.tsx` | Tarjetas de partido y de entrenamiento del día |
| `components/MatchInfoCard.tsx` | Horarios, pabellón (enlace a Maps), local o visitante, notas |
| `components/MyAvailabilityCard.tsx` | "¿Puedes venir?" para el jugador, con comentario opcional |
| `components/CallupList.tsx` + `CallupDetailsEditor.tsx` | Jugadores con su respuesta y la casilla para convocar; bajo cada convocado, dorsal y las posiciones (varias a la vez) que cubre en este partido |

## Ficheros del módulo `lineup`

| Fichero | Qué hace |
| --- | --- |
| `SetPlanPage.tsx` | Pestaña Rotación. Carga partido y convocados (con el dorsal y las posiciones del partido) y guarda en el móvil el plan de cada set. Cada set es independiente: un jugador con varias posiciones puede ir en una zona distinta en cada set. Aún no se guarda en el servidor (fase 2) |
| `setPlan.ts` | `SetPlan`, `PlannedSub`, `newSetPlan` (hereda el sistema del set anterior), `canPlay`, `replacementPositions` (misma posición, o colocador ↔ opuesto) |
| `systems.ts` | Plantilla de roles por zona de cada sistema (5-1, 6-0, 4-2, 6-2) y cómo gira. La R es la zona del colocador que coloca (`availableRotations`: R1–R6 en 5-1, R2–R4 en 4-2, R1/R5/R6 en 6-2, ninguna en 6-0) |
| `components/SetTabs.tsx` | Pestañas Set 1–5 |
| `components/SystemPicker.tsx` | Selector de sistema, de rotación inicial (R1, R2…) y "copiar de otro set" |
| `components/Court.tsx` | Pista con las 6 zonas coloreadas según sistema y R, y dos casillas grises para líberos |
| `components/PlannedSubsCard.tsx` | Cambios previstos, solo entre jugadores de la misma posición (colocador y opuesto se pueden cruzar) |

## Ficheros del módulo `roster`

| Fichero | Qué hace |
| --- | --- |
| `RosterPage.tsx` | Plantilla por dorsal. El staff añade jugadores |
| `components/PlayerForm.tsx` | Formulario de ficha para añadir y para editar |
| `components/PlayerRow.tsx` | Fila de jugador; para el staff, con el interruptor "Compite / Solo entrena", "Editar" y "Borrar ficha" |
| `components/CompetesSwitch.tsx` | El interruptor, con confirmación antes de cambiar (doble comprobación) |

## Ficheros del módulo `teams`

| Fichero | Qué hace |
| --- | --- |
| `TeamSettingsPage.tsx` | Ajustes del equipo (entrenador) |
| `members.ts` | Miembros del equipo y cómo separar pendientes, activos y fichas ya enlazadas |
| `components/PendingRequestsCard.tsx` + `AcceptMemberDialog.tsx` | Solicitudes de jugadores: aceptar (vincular a una ficha sin cuenta o crear una nueva) o rechazar |
| `components/JoinCodesCard.tsx` | Códigos de jugador y de segundo entrenador: crear, renovar, activar o desactivar |
| `components/TeamDetailsCard.tsx` | Nombre, categoría y temporada |
| `components/TrainingScheduleCard.tsx` | Horario semanal de entrenamientos (24 h, de 15 en 15 min) con pabellón de la lista u otro |
| `components/TeamColorCard.tsx` | 20 colores para el equipo |
| `components/ModulesCard.tsx` | Activar o desactivar secciones (Ajustes siempre activo) |
| `components/VenuesCard.tsx`, `OpponentsCard.tsx` | Pabellones (con enlace de Maps) y rivales habituales |
| `components/DeleteTeamCard.tsx` | Borrar el equipo escribiendo su nombre |
| `components/MembersCard.tsx` | Miembros: contraseña temporal, quitar del equipo y hacer entrenador (transferir), todo con confirmación |
