# App Voley — Especificación

Actualizada: 2026-11-07 · @Brian

## Visión y alcance

App web instalable (PWA) para gestionar equipos de voleibol: plantilla, calendario, disponibilidad, convocatorias y planificación de rotaciones por set, usable en pabellones sin cobertura.

- **Para quién:** cualquier entrenador crea sus equipos; cada usuario es independiente y ve la lista de los equipos a los que pertenece.
- **Usuarios:** jugadores menores o con poca soltura con la tecnología. Login con usuario y contraseña, sin email obligatorio, y sesión que no caduca mientras se use.
- **Coste:** cero. Servidor y hosting en planes gratuitos; acceso por enlace, sin dominio propio.

**Principios de diseño**

1. **Modular:** cada funcionalidad es un módulo independiente que cada equipo puede activar o desactivar.
2. **Offline solo para las rotaciones:** ver la plantilla y trabajar con las rotaciones funciona sin conexión; todo lo demás requiere conexión.
3. **Simple para el jugador:** ver partidos y marcar disponibilidad en dos toques; la complejidad queda en el perfil de entrenador.
4. **Android vía PWA:** se instala desde Chrome; una APK con Capacitor queda como opción futura, sin reescribir.
5. **También en PC:** la misma app se usa cómodamente en el ordenador (sobre todo el entrenador para planificar), con menú lateral y contenido en columnas; en el móvil no cambia nada.

## Usuarios, roles y acceso

Cada usuario se registra por su cuenta y entra en un equipo con un código; el rol se asigna por equipo, de modo que una misma persona puede ser entrenador en uno y jugador en otro.

**Registro y sesión**

- Registro con usuario y contraseña. Por debajo se guarda como `usuario@<dominio-interno>` para usar Supabase Auth sin pedir email real.
- La sesión se renueva automáticamente: el usuario solo vuelve a loguearse si cierra sesión o pasa mucho tiempo sin abrir la app.
- Casilla de consentimiento al registrarse (menores de 14 años necesitan autorización de sus padres en España). No se guardan DNI ni teléfonos de jugadores.
- Recuperar contraseña: con el **código de recuperación** que se muestra al crear la cuenta (usuario + código + contraseña nueva), sin ayuda de nadie. Si no tienes el código, **por correo**: con un correo opcional guardado al registrarte o en "Mi cuenta" (nadie del equipo lo ve), llega un enlace de un solo uso que caduca en 1 hora, sin molestar al entrenador. Último respaldo: el entrenador pone una contraseña temporal.
- Al crear la cuenta se pide la contraseña dos veces.

**Unirse a un equipo**

- El entrenador genera un código por rol (jugador / segundo entrenador). Se puede regenerar o desactivar.
- Quien entra con código de jugador queda pendiente (no ve nada del equipo) hasta que el entrenador lo acepta vinculándolo a una ficha de la plantilla (o creando una nueva).
- Al entrar se ve la lista de tus equipos y un botón **+** para crear uno o unirse con código. Siempre hay un menú (barra lateral en PC, botón ☰ en móvil) con tus equipos y el **+**; bajo el equipo abierto aparecen sus secciones: Partidos, Plantilla y, para el entrenador, Ajustes.
- En cada equipo solo se ve la vista del rol que tienes; no se puede cambiar de rol desde la app.

**Permisos por rol**

| Acción | Entrenador | Segundo / coordinador | Jugador |
| --- | --- | --- | --- |
| Ver partidos, resultados y tabla | Sí | Sí | Sí |
| Marcar su disponibilidad | Sí | Sí | Sí |
| Ver plantilla | Sí | Sí | Sí (solo lectura) |
| Editar plantilla y marcar quién compite | Sí | Sí | No |
| Crear y editar partidos | Sí | Sí | No |
| Convocar | Sí | Sí | No |
| Planificar rotaciones y modo partido | Sí | Sí | Ver (si el entrenador lo publica) |
| Votar MVP del partido | Sí | No | Sí (si está convocada) |
| Resolver empate de MVP y ver recuento | Sí | No | No |
| Ajustes del equipo (nombre, códigos, horario), aceptar jugadores, módulos | Sí | No | No |
| Borrar equipo o transferirlo | Sí | No | No |

## Módulos

Siete módulos forman el núcleo; el plan de partido por set es el que más trabajo lleva y el que tiene que funcionar sin cobertura.

### 1. Resultados

- Lista de partidos jugados: fecha, rival, resultado por sets.
- **Tabla de liga no oficial** (opcional, la activa el entrenador): la rellena a mano y muestra siempre "Actualizada el dd/mm" bien visible.

### 2. Próximos partidos

- **Calendario mensual** con una burbuja en cada día con evento: azul para partido, verde para entrenamiento. Al tocar un día se ve lo que hay; debajo, los próximos partidos.
- Los entrenamientos salen del horario semanal del equipo; el staff puede cancelar un día suelto.
- Detalle: rival, fecha, hora de partido (24 h), calentamiento como duración antes del partido (de 15 en 15 minutos, p. ej. "45 min (desde 17:15)"), pabellón (con enlace de Google Maps pegado por el entrenador y el mapa visible en la app), local/visitante, notas y, una vez jugado, el resultado por sets.
- Botón de disponibilidad: Sí / No / Duda, con comentario opcional.
- Los jugadores ven si están convocados.

### 3. Plantilla (entrenador)

- Ficha: nombre, apellidos, año de nacimiento, dorsal, posición principal y secundarias, días de entrenamiento.
- Vinculación ficha ↔ cuenta de usuario (una ficha puede existir sin cuenta).
- **Compite / solo entrena:** el entrenador lo marca o desmarca con doble comprobación. Quien solo entrena no aparece en la disponibilidad ni en la convocatoria de los partidos, pero ve el calendario.
- **Sistema de juego predeterminado** del equipo: cada set nuevo arranca con él.

### 4. Gestión de partido (entrenador)

- Crear, editar y borrar partidos (borrar pide confirmación).
- Marcar el resultado: puntos de cada set (hasta 5); el partido pasa a jugado y se ve "Ganado 3-1" en el calendario y en el detalle.
- El partido tiene tres pestañas: **Info** (datos y disponibilidad), **Gestión** y **Rotación** (plan por set). Gestión y Rotación son del staff.
- **Gestión:** ver disponibilidad de los que compiten y convocar a cualquiera, haya respondido o no; para cada convocado, cambiar dorsal y las posiciones (varias a la vez) solo en ese partido. En la rotación, cada set es independiente: un jugador puede ir en una posición distinta en cada set.
- Botón **Ir al partido** → modo partido (fase 2).

### 5. Plan de partido por set (entrenador, funciona offline)

Para cada set se guarda un plan independiente:

- **Sistema:** 5-1, 6-0, 4-2 o 6-2. Por defecto el sistema predeterminado del equipo o el del set anterior.
- **Rotación inicial:** campo con zonas 1–6 coloreadas por rol (colocador, receptor, central, opuesto, líbero). Cada zona solo ofrece convocados con esa posición, con opción de "mostrar todos".
- **R inicial:** junto al sistema se elige en qué R empieza el set. La R es la zona donde está el colocador que coloca: R1–R6 en 5-1, R2–R4 en 4-2 (coloca el delantero), R1/R5/R6 en 6-2 (coloca el zaguero). En 6-0 todos son receptores y no hay R.
- **Líberos:** hasta dos casillas grises bajo la pista, solo si hay jugadores que puedan jugar de líbero. No se indica por quién entran.
- **Cambios previstos:** pares sale → entra, solo entre jugadores de la misma posición (colocador y opuesto se pueden cruzar para pasar de una R a otra), con nota opcional ("si falla recepción", "en rotación 3").
- **Copiar plan de otro set** para no empezar de cero.

### 6. Modo partido (entrenador, funciona offline)

- Vista grande y clara del plan del set actual: rotación, líbero y cambios previstos.
- Botón para avanzar rotación (R1 → R6) y ver quién está en cada zona.
- Entre sets: cambiar rotación o sistema del siguiente set sobre la marcha.
- Registrar el resultado del set (requiere conexión; opcional en MVP).

### 7. MVP del partido (opcional, requiere conexión)

- **Quién vota:** las convocadas con cuenta vinculada y el entrenador (mismo peso). El segundo entrenador no vota.
- **A quién:** solo a convocadas (tengan cuenta o no), nunca a una misma. Cada votante elige 1 o 2 compañeras.
- **Cuándo:** se abre al marcar el partido como jugado y se cierra a las 48 h o antes si lo decide el entrenador. Mientras está abierta, cada votante puede cambiar su voto.
- **Voto secreto:** nadie ve a quién votó cada una, tampoco el entrenador. El entrenador ve el recuento y cuántas han votado; las jugadoras solo ven a la ganadora.
- **Empate:** al cerrar, si hay empate en cabeza (de dos o más), el entrenador elige a una de las empatadas o mantiene el empate y salen todas como co-MVP. Mientras decide, las jugadoras ven "Resultado pendiente". Si nadie vota, no hay MVP.
- **Ranking de temporada:** MVP ganados por jugadora (un co-MVP suma uno a cada una). Las jugadoras ven solo a quienes tienen al menos uno; el entrenador ve el ranking completo y puede ocultarlo.

### Módulos futuros

Asistencia a entrenamientos, notificaciones push, estadísticas por jugador, tablón de avisos, importación desde Google Sheets.

## Funciones online y offline

**Sin conexión:** ver la plantilla y los convocados de los partidos descargados, y crear y editar las rotaciones (plan por set, sistema, líbero, cambios previstos y modo partido). Cada equipo tiene un sistema predeterminado con el que arranca cada set.

**Con conexión:** todo lo demás: registro, unirse a equipos, disponibilidad, convocatorias, resultados, tabla, MVP y ajustes.

**Cómo funciona**

1. **App instalable con service worker:** la interfaz entera queda guardada en el móvil y abre sin red.
2. **Descarga automática:** al abrir la app con conexión, se guardan en el móvil (IndexedDB) los partidos próximos de los equipos donde eres entrenador o segundo, con su convocatoria, plantilla y planes por set.
3. **Indicador visible:** cada partido muestra "Disponible sin conexión" y la hora de la última sincronización. Botón manual "Preparar para sin conexión" por si acaso.
4. **Ediciones offline:** los cambios en rotaciones, sistema, líbero y cambios previstos se guardan en local y en una cola de sincronización.
5. **Sincronización al volver la red:** la cola se envía sola. Si dos personas editaron el mismo set, gana el último cambio y se avisa.

**Prueba de aceptación:** activar modo avión en casa, abrir la app, ver la plantilla y dirigir un partido completo de 5 sets, cambiando rotación y sistema entre sets; al quitar el modo avión, todo aparece en el servidor.

## Stack técnico y arquitectura

React + Vite como PWA, Supabase como backend y Vercel como hosting, todo en planes gratuitos.

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | Conocido, rápido, buen ecosistema PWA |
| PWA y offline | vite-plugin-pwa (Workbox) + Dexie (IndexedDB) | Instalable en Android y datos locales para el partido |
| Estado y datos | TanStack Query | Caché, reintentos y sincronización sencilla |
| Estilos | Tailwind CSS | Rápido para interfaces móviles |
| Backend | Supabase: Auth + Postgres + RLS | Login, base de datos y permisos por fila sin servidor propio |
| Hosting | Vercel | Despliegue automático desde GitHub |
| Repositorio | GitHub (@Alexxvr8/Voley_APP) | Control de versiones y GitHub Actions |
| Anti-pausa | GitHub Actions cada 3 días | El plan gratuito de Supabase pausa el proyecto tras 7 días sin actividad |

**Estructura modular del código**

```
frontend/src/
  core/          # auth, sesión, supabase client, sync offline, layout
  modules/
    teams/       # equipos, roles, códigos de acceso
    roster/      # plantilla
    matches/     # próximos, detalle, disponibilidad, convocatoria
    results/     # resultados y tabla no oficial
    lineup/      # plan por set y modo partido
    mvp/         # votación MVP y ranking
  shared/        # componentes UI, utilidades
```

Cada módulo exporta su propio registro (rutas, entrada de menú, rol mínimo, si funciona offline). El núcleo solo lee esos registros y los ajustes del equipo para decidir qué mostrar. Añadir un módulo = crear su carpeta y registrarlo.

## Modelo de datos inicial

La pieza clave es `team_members`: une usuario, equipo y rol, y todas las reglas de seguridad (RLS) se apoyan en ella.

| Tabla | Campos principales | Notas |
| --- | --- | --- |
| `profiles` | id (= auth user), username, display\_name | Uno por cuenta |
| `teams` | id, name, category, season, color, default\_system, enabled\_modules, settings, created\_by | `enabled_modules` = lista de módulos activos; `settings` incluye `mvp_ranking_visible` |
| `team_members` | team\_id, user\_id, role, player\_id | role: coach / assistant / player; player\_id enlaza con la ficha |
| `join_codes` | team\_id, code, role, active, expires\_at | Un código por rol, regenerable |
| `players` | id, team\_id, first\_name, last\_name, birth\_year, number, main\_position, other\_positions, training\_days, competes | Ficha de plantilla, puede no tener cuenta. `competes = false`: solo entrena |
| `matches` | id, team\_id, opponent, date, match\_time, warmup\_minutes, venue, maps\_url, home\_away, status, sets\_result, notes, mvp\_status, mvp\_closes\_at, mvp\_winners | status: scheduled / played / cancelled; mvp\_status: closed / open / tie\_pending / finished |
| `availability` | match\_id, player\_id, status, comment, updated\_at | status: yes / no / maybe |
| `callups` | match\_id, player\_id, number, positions | Convocados; dorsal y posiciones del partido (vacío = los de la ficha) |
| `training_slots` | id, team\_id, weekday, start\_time, end\_time, venue, maps\_url | Horario semanal de entrenamientos |
| `training_cancellations` | slot\_id, date | Entrenamiento que no se hace un día concreto |
| `account_recovery` | user\_id, code\_hash, failed\_attempts, locked\_until | Código de recuperación (solo el hash). Sin acceso directo: solo vía RPC |
| `account_recovery_email` | user\_id, email, token\_hash, token\_expires\_at | Correo de recuperación opcional y enlace de un solo uso. Sin acceso directo |
| `team_venues` | id, team\_id, name, maps\_url | Pabellones habituales |
| `team_opponents` | id, team\_id, name | Rivales habituales |
| `set_plans` | id, match\_id, set\_number, system, start\_rotation, rotation, libero\_id, second\_libero\_id, planned\_subs, updated\_at, updated\_by | rotation = zona 1–6 → player\_id |
| `mvp_votes` | match\_id, voter\_user\_id, voted\_player\_id, created\_at | Única por votante y votada; máx. 2 por votante. Sin acceso directo: solo vía RPC |
| `league_table` | team\_id, rows, updated\_at | Tabla no oficial, filas en JSON |

Posiciones como valores fijos: `setter` (colocador), `outside` (receptor), `middle` (central), `opposite` (opuesto), `libero`. Los nombres en pantalla van en español.

**RPC del MVP:** `cast_mvp_vote(match, ids)` (comprueba que vota el entrenador o una convocada con cuenta, que las votadas están convocadas, que no se vota a sí misma, máx. 2 y votación abierta), `close_mvp_vote(match)`, `resolve_mvp_tie(match, ids)` y `mvp_results(match)` (recuento, solo entrenador).

## Fases y roadmap

Cuatro fases sin fechas fijas; no se pasa a la siguiente hasta superar la prueba con uso real.

| Fase | Contenido | Prueba para pasar |
| --- | --- | --- |
| 0 · Base | Repo en GitHub, Supabase + Vercel, PWA instalable, login y sesión larga, estructura modular | Login funciona en el móvil |
| 1 · MVP | Equipos y roles, códigos de acceso, plantilla, partidos y calendario, disponibilidad, convocatoria | Tu equipo lo usa dos semanas |
| 2 · Partido | Plan por set, sistemas y rotaciones, cambios previstos, modo partido, offline y sincronización, resultados y tabla | Partido real en modo avión |
| 3 · Extras | Entrenamientos, notificaciones, estadísticas, importar Sheets, APK (opcional) | — |

La fase 2 es la crítica: el offline se diseña desde la fase 0 (estructura de datos local), pero se completa y prueba aquí. El módulo MVP entra después de la fase 1, porque depende de la convocatoria.

## Registro de decisiones y temas abiertos

Cada decisión cerrada se añade aquí con su fecha; este documento es la referencia para cualquier chat nuevo del proyecto.

| Fecha | Decisión |
| --- | --- |
| 2026-10-24 | Sin rol de padre/tutor |
| 2026-10-24 | Los usuarios se registran solos y entran en el equipo con un código |
| 2026-10-24 | Pensada para los equipos de Brian, abierta a cualquier entrenador |
| 2026-10-24 | Stack: React + Vite (PWA), Supabase, Vercel |
| 2026-10-24 | Plan por set con sistema, rotación, líbero y cambios previstos, editable entre sets |
| 2026-10-24 | Modo partido y plan por set funcionan sin conexión |
| 2026-10-26 | Proyecto Supabase propio `voley-app` (eu-central-1) en la organización Alexxvr8 |
| 2026-10-26 | Repositorio separado en `frontend/` (PWA) y `backend/` (Supabase: migraciones, RLS, RPC), cada uno con su README |
| 2026-10-26 | Email interno de Auth: `usuario@voley.local`; confirmación de email desactivada |
| 2026-10-26 | Crear equipo, unirse con código y regenerar códigos van por funciones RPC (`create_team`, `join_team`, `regenerate_join_code`), no por inserts directos |
| 2026-10-26 | Hasta resolver el tema abierto, los planes por set solo los ven entrenador y segundo (RLS) |
| 2026-10-27 | Plan por set: R inicial junto al sistema, hasta dos líberos sin "entra por", cambios previstos limitados a la misma posición (colocador ↔ opuesto permitido). En 6-0 todas las zonas son receptores |
| 2026-10-27 | La pestaña del plan se llama "Rotaciones" en el menú |
| 2026-11-07 | Nuevo módulo opcional MVP del partido: 1 o 2 votos por votante, voto secreto |
| 2026-11-07 | Votan MVP las convocadas y el entrenador (mismo peso); el segundo entrenador no vota |
| 2026-11-07 | Empate en el MVP: lo resuelve el entrenador eligiendo una o manteniendo co-MVP |
| 2026-11-07 | Ranking de MVP de temporada: sin ceros para las jugadoras, el entrenador puede ocultarlo |
| 2026-11-07 | Offline solo plantilla (lectura) y rotaciones; resultados y lo demás requieren conexión |
| 2026-11-07 | Cada equipo tiene un sistema de juego predeterminado con el que arranca cada set |
| 2026-11-07 | `docs/especificacion.md` sustituye a `docs/SPEC.md` como única referencia (fusionadas) |
| 2026-11-07 | Anti-pausa: GitHub Action `keep-supabase-awake.yml` consulta la base de datos cada 3 días; URL y clave publicable como variables del repositorio |
| 2026-11-07 | Uso en PC: desde 1024 px barra lateral y pantallas a dos columnas; la app instalada no se bloquea en vertical |
| 2026-11-07 | Se elimina el sistema "4-2 con posiciones delanteras" (`4-2-front`): quedan 5-1, 6-0, 4-2 y 6-2 |
| 2026-11-07 | Cada usuario es independiente: se registra solo, ve sus equipos y recupera la contraseña con su código. App abierta a cualquier entrenador |
| 2026-11-07 | Recuperar contraseña: código de recuperación (hash bcrypt, 5 intentos y 15 min de bloqueo) + contraseña temporal del entrenador; email opcional pendiente de servicio de envío |
| 2026-11-07 | Jugadores que entran con código quedan pendientes, sin acceso, hasta que el entrenador los acepta |
| 2026-11-07 | Rol fijo por equipo, sin selector; los jugadores ven la plantilla en solo lectura |
| 2026-11-07 | Menú con tus equipos y "+"; secciones del equipo: Partidos, Plantilla y Ajustes (solo entrenador) |
| 2026-11-07 | Partido con pestañas Info, Gestión (convocatoria + dorsal/posición del partido) y Rotación; "Rotaciones" sale del menú |
| 2026-11-07 | Calendario mensual con burbujas de partido y entrenamiento; horario semanal de entrenamientos con cancelación de días sueltos |
| 2026-11-07 | Jugador "solo entrena" (`competes = false`): fuera de disponibilidad y convocatoria; se cambia con doble comprobación |
| 2026-11-07 | Los jugadores tienen varias posiciones (ficha editable) y en cada partido pueden cubrir varias; en la rotación pueden cambiar de posición entre sets |
| 2026-11-07 | Pabellones con enlace de Google Maps y mapa incrustado (sin clave de API); también en el horario de entrenamientos |
| 2026-11-07 | Crear, editar y borrar partidos y marcar el resultado por sets desde el propio partido; la lista de resultados y la tabla siguen en el módulo Resultados |
| 2026-11-07 | Recuperación por correo (Brevo, Edge Function `send-reset-email`) para quien pierda el código, sin pasar por el entrenador |
| 2026-11-07 | Un equipo nunca se queda sin entrenador; el entrenador puede transferirlo, borrarlo (escribiendo su nombre) y activar o desactivar secciones. Los demás pueden salir del equipo |
| 2026-11-07 | Ajustes: sistema predeterminado, color del equipo (20 colores, visible en el menú), pabellones con enlace de Maps y rivales habituales; en el partido se eligen de la lista o se escriben a mano |
| 2026-11-07 | Horas siempre en 24 h (selectores propios); calentamiento como duración en pasos de 15 min |
| 2026-11-07 | Comentario opcional en la disponibilidad; borrar fichas de la plantilla |
| 2026-11-07 | Puede haber varios partidos contra el mismo rival |
| 2026-11-07 | Tests unitarios (Vitest) y CI en GitHub Actions: lint, formato, tests y build en cada subida |
| 2026-11-07 | Calidad de código: ESLint (flat config, typescript-eslint, reglas de hooks) y Prettier en `frontend/` |

**Temas abiertos**

- [ ] ¿Temporadas dentro del equipo o un equipo nuevo cada año? (el ranking de MVP "de temporada" depende de esto)
- [ ] ¿Los jugadores ven la rotación planificada o solo el entrenador?
- [ ] Nombre de la app
- [ ] ¿Registrar en el modo partido el resultado punto a punto o solo por set?

**Forma de trabajo**

- Proyecto en Claude con este documento como conocimiento del proyecto.
- Un chat por tarea ("Fase 0: setup", "Modelo de datos y RLS", "Módulo partidos"...) y un chat de planificación sin código.
- Código en GitHub; desarrollo con Claude Code sobre el repo y un `CLAUDE.md` con las convenciones.
- Al cerrar cada chat, se actualiza este registro.
