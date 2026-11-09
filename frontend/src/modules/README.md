# modules/

Cada carpeta es una funcionalidad independiente que un equipo puede activar o desactivar (`teams.enabled_modules`). Las rutas son relativas al equipo: `partidos` se abre en `/equipos/<id>/partidos`.

| Módulo | Para qué sirve | En el menú | Rol mínimo | Sin conexión |
| --- | --- | --- | --- | --- |
| `matches/` | Calendario mensual (partidos y entrenamientos, con asistencia Sí / No / Duda a cada entrenamiento), crear, editar y borrar partidos, info con mapa y resultado (solo marcador o puntos por set), disponibilidad y la pestaña Gestión (convocatoria con dorsal y posiciones del partido) | Partidos | Jugador | No |
| `roster/` | Plantilla. El staff edita jugadores (dorsal y posiciones) y marca quién compite o solo entrena; los jugadores la ven sin poder cambiarla. Se descarga para verla sin conexión | Plantilla | Jugador | Solo lectura |
| `lineup/` | Pestaña Rotación del partido (plan por set guardado en el servidor) y modo partido. Funciona sin conexión | — (pestaña y botón "Ir al partido") | Segundo entrenador | Sí |
| `results/` | Partidos jugados con su resultado y tabla de liga no oficial (rellena a mano, con "Actualizada el dd/mm") | Resultados | Jugador | No |
| `mvp/` | Votación secreta de la MVP de cada partido jugado (1 o 2 convocadas, 48 h), empates que resuelve el entrenador y ranking de la temporada. Opcional: se activa en Ajustes | MVP | Jugador | No |
| `teams/` | Ajustes del equipo: datos y sistema predeterminado, color, secciones activas, códigos, solicitudes, jugadores sin cuenta, miembros (quitar, transferir), horario, pabellones, rivales y borrar el equipo | Ajustes | Entrenador | No |

Un módulo que funciona sin conexión pone `offline: true` y un `prepareOffline(teamId)` que descarga lo que necesita a la caché y devuelve los partidos que deja disponibles. Sus cambios van por la bandeja de salida de `core/offline/outbox.ts`.

## Anatomía de un módulo

```
modules/matches/
├── index.ts            Registro del módulo (ModuleDefinition): id, nombre, rutas, menú, rol, offline
├── api.ts              Consultas y cambios en Supabase con TanStack Query (useQuery / useMutation)
├── CalendarPage.tsx    Página: lee los datos, guarda el estado y reparte el trabajo entre componentes
├── components/         Bloques visuales de la página, cada uno en su fichero
└── calendarEvents.ts   Tipos y funciones puras del módulo (sin React), con su *.test.ts
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
| `CalendarPage.tsx` | Calendario del mes, lo que pasa el día elegido, los próximos partidos y los próximos entrenamientos. El jugador que compite responde a los partidos ahí mismo y todo jugador dice si va a cada entrenamiento; el staff crea partidos, ve cuántos van a entrenar y cancela un entrenamiento suelto |
| `MatchDetailPage.tsx` | Pestaña Info: datos, mapa y resultado; si se ha jugado y el equipo tiene MVP, enlace a su votación (`components/MvpLinkCard.tsx`: abierta, empate, ganadora o "Abrir votación" para el entrenador). Jugador: "¿Puedes venir?" mientras no se haya jugado (o aviso si solo entrena). Staff: recuento de respuestas, resultado por sets y "Editar o borrar partido" |
| `EditMatchPage.tsx` | Editar los datos del partido o borrarlo (con confirmación) |
| `components/MatchForm.tsx` | Formulario común de crear y editar: rival sugerido de la lista o escrito (con "guardar en la lista"), hora en 24 h, calentamiento en pasos de 15 min, formato del partido y pabellón de la lista u otro con su enlace de Maps |
| `components/ResultEditor.tsx`, `ResultSummary.tsx` | Formato del partido y resultado: solo el marcador con un toque (3-0, 3-1…) o los puntos de cada set (tantos como permite el formato); y "Ganado 3-1" con el detalle si lo hay |
| `resultDraft.ts` | Conversión entre los puntos guardados y las casillas del editor |
| `ManagementPage.tsx` | Pestaña Gestión (staff): convocatoria entre los que compiten, con dorsal y posiciones solo para ese partido. Cada cambio envía solo el campo tocado, para que dos cambios seguidos no se pisen |
| `NewMatchPage.tsx` | Formulario de partido nuevo (staff) |
| `api.ts` | Partidos, entrenamientos y cancelaciones, asistencia a entrenamientos, disponibilidad y convocatoria. Disponibilidad, asistencia y convocatoria se actualizan al momento en pantalla y se deshacen si el servidor falla |
| `calendarEvents.ts` | Qué hay cada día y próximos partidos |
| `trainingAnswers.ts` | Próximos entrenamientos (sin los cancelados), la respuesta de un jugador y quién ha dicho Sí / No / Duda o no ha respondido |
| `components/MonthCalendar.tsx` | Mes de lunes a domingo; burbuja azul = partido, verde = entrenamiento. Las burbujas crecen con el ancho del propio calendario (container queries): punto, hora, u hora y texto |
| `components/MatchEventCard.tsx`, `TrainingEventCard.tsx` | Tarjetas de partido y de entrenamiento; la de entrenamiento lleva "¿Vienes?" para el jugador y, para el staff, el recuento con "Ver quién" |
| `components/MatchInfoCard.tsx` | Horarios, pabellón (enlace a Maps), local o visitante, notas |
| `components/MyAvailabilityCard.tsx` | "¿Puedes venir?" para el jugador, con comentario opcional |
| `components/CallupList.tsx` + `CallupDetailsEditor.tsx` | Jugadores con su respuesta y la casilla para convocar; bajo cada convocado, dorsal y las posiciones (varias a la vez) que cubre en este partido |

## Ficheros del módulo `lineup`

| Fichero | Qué hace |
| --- | --- |
| `SetPlanPage.tsx` | Pestaña Rotación. Carga partido y convocados (con el dorsal y las posiciones del partido) y edita el plan de cada set; cada cambio se guarda solo. Cada set es independiente: un jugador con varias posiciones puede ir en una zona distinta en cada set. `?set=3` abre ese set |
| `MatchModePage.tsx` | Modo partido: set y R actuales en grande, pista con dorsales y nombres, Rotar / Atrás, líberos, hacer o deshacer los cambios previstos, sistema y R inicial antes de empezar cada set y "Terminar set". Recuerda por dónde iba (en el móvil) |
| `matchMode.ts` | Estado del modo partido y quién está en pista: alineación rotada con los cambios hechos |
| `api.ts` | Jugadores, partidos, convocatoria y planes. `savePlan` mete el cambio en la bandeja de salida; `useSetPlans` muestra el servidor con los cambios pendientes encima; `prepareLineupOffline` descarga los 5 próximos partidos con convocatoria y planes |
| `setPlanRows.ts` | Conversión entre el plan del editor y la tabla `set_plans` / la RPC `save_set_plan` |
| `components/LiveCourt.tsx`, `LiveSubsCard.tsx` | Pista grande y cambios previstos del modo partido |
| `setPlan.ts` | `SetPlan`, `PlannedSub`, `newSetPlan` (hereda el sistema del set anterior), `canPlay`, `replacementPositions` (misma posición, o colocador ↔ opuesto) |
| `systems.ts` | Plantilla de roles por zona de cada sistema (5-1, 6-0, 4-2, 6-2) y cómo gira. La R es la zona del colocador que coloca (`availableRotations`: R1–R6 en 5-1, R2–R4 en 4-2, R1/R5/R6 en 6-2, ninguna en 6-0). Al rotar, la R va R1 → R6 → R5 → R4 → R3 → R2 (`advanceLineup`, `rotationAfter`, `zoneRolesAfter`) |
| `components/SetTabs.tsx` | Pestañas de los sets que permite el formato del partido (5, 3 o ninguna con 1 set) |
| `components/SystemPicker.tsx` | Selector de sistema, de rotación inicial (R1, R2…) y "copiar de otro set" |
| `components/Court.tsx` | Pista con las 6 zonas coloreadas según sistema y R, y dos casillas grises para líberos |
| `components/PlannedSubsCard.tsx` | Cambios previstos, solo entre jugadores de la misma posición (colocador y opuesto se pueden cruzar) |

## Ficheros del módulo `roster`

| Fichero | Qué hace |
| --- | --- |
| `RosterPage.tsx` | Plantilla por dorsal. Las fichas nuevas llegan al aceptar cuentas o desde Ajustes → Jugadores sin cuenta |
| `components/PlayerRow.tsx` | Fila de jugador; para el staff, con el interruptor "Compite / Solo entrena", "Editar" y "Borrar ficha" |
| `components/CompetesSwitch.tsx` | El interruptor, con confirmación antes de cambiar (doble comprobación) |

## Ficheros del módulo `teams`

| Fichero | Qué hace |
| --- | --- |
| `TeamSettingsPage.tsx` | Ajustes del equipo (entrenador) |
| `members.ts` | Miembros del equipo y cómo separar pendientes, activos y fichas ya enlazadas |
| `components/PendingRequestsCard.tsx` + `AcceptMemberDialog.tsx` | Solicitudes de jugadores: aceptar (vincular a una ficha sin cuenta, propuesta por el nombre, o crear una nueva) o rechazar |
| `playerMatch.ts` | Qué ficha sin cuenta es probablemente la de quien acaba de entrar (nombre sin tildes ni mayúsculas) |
| `components/MergePlayersCard.tsx` | Juntar fichas repetidas de la misma persona (RPC `merge_players`) |
| `components/ManualPlayerCard.tsx` | Jugadores sin cuenta: crear a mano la ficha de quien no usa la app |
| `components/JoinCodesCard.tsx` | Códigos de jugador y de segundo entrenador: crear, renovar, activar o desactivar |
| `components/TeamDetailsCard.tsx` | Nombre, categoría y temporada |
| `components/TrainingScheduleCard.tsx` | Horario semanal de entrenamientos (24 h, de 15 en 15 min) con pabellón de la lista u otro |
| `components/TeamColorCard.tsx` | 20 colores para el equipo (rellenan su tarjeta en la lista y el menú) |
| `components/ModulesCard.tsx` | Activar o desactivar secciones (Ajustes siempre activo) |
| `components/VenuesCard.tsx`, `OpponentsCard.tsx` | Pabellones (con enlace de Maps) y rivales habituales |
| `components/DeleteTeamCard.tsx` | Borrar el equipo escribiendo su nombre |
| `components/MembersCard.tsx` | Miembros: contraseña temporal, quitar del equipo y hacer entrenador (transferir), todo con confirmación |

## Ficheros del módulo `results`

| Fichero | Qué hace |
| --- | --- |
| `ResultsPage.tsx` | Partidos jugados y tabla de liga |
| `components/PlayedMatchesCard.tsx` | Jugados, del más reciente al más antiguo, con "3-1", los puntos de cada set y el balance ganados/perdidos |
| `components/LeagueTableCard.tsx` | Tabla no oficial (PJ, PG, PP, Pts) con "Actualizada el dd/mm". El staff la añade, edita o quita |
| `leagueTable.ts` | Orden de la tabla: puntos, partidos ganados y nombre |

## Ficheros del módulo `mvp`

| Fichero | Qué hace |
| --- | --- |
| `MvpPage.tsx` | Votaciones abiertas (con "Votar" si puedes votar), empates por resolver, partidos sin votación (entrenador, para abrirla), la MVP de cada partido y el ranking. Cierra las votaciones que ya pasaron sus 48 h |
| `MvpMatchPage.tsx` | Votación de un partido: votar o cambiar el voto; el entrenador ve el recuento, cierra antes de tiempo (con confirmación), abre la votación si no la hubo y resuelve el empate. Las jugadoras ven "Resultado pendiente" mientras tanto |
| `api.ts` | Partidos, fichas y convocatoria (mismas claves de caché que los demás módulos), tu voto, las RPC del entrenador y mostrar u ocultar el ranking. `useSettleExpiredVotes` llama a `settle_mvp` para las votaciones caducadas |
| `mvp.ts` | Estado de la votación (`votePhase`, incluida la abierta con el plazo pasado), elegir 1 o 2 (`togglePick`: con dos elegidas, tocar otra quita la primera), "Cierra en 23 h", las más votadas (`topVoted`) y el ranking (`seasonRanking`: co-MVP suma uno a cada una; sin ceros para las jugadoras) |
| `components/PlayerPickList.tsx` | Lista de jugadoras para tocar y marcar con ★ |
| `components/VoteCard.tsx`, `TieCard.tsx` | Votar / cambiar voto; elegir entre las empatadas (varias = co-MVP) |
| `components/TallyCard.tsx`, `WinnerCard.tsx` | Recuento del entrenador ("Han votado 5 de 9"); MVP o co-MVP del partido, o "Sin MVP" |
| `components/MatchVotesCard.tsx`, `RankingCard.tsx` | Lista de partidos con el estado de su votación; ranking con el interruptor "Visible para las jugadoras" (entrenador) |
