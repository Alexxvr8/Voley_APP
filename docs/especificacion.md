# App Voley — Especificación

Actualizada: 2026-11-07 · @Brian

## Visión y alcance

App web instalable (PWA) para gestionar equipos de voleibol: plantilla, calendario, disponibilidad, convocatorias y planificación de rotaciones por set, usable en pabellones sin cobertura.

- **Para quién:** pensada para los equipos de Brian, pero abierta a que cualquier entrenador cree los suyos.
- **Usuarios:** jugadores menores o con poca soltura con la tecnología. Login con usuario y contraseña, sin email obligatorio, y sesión que no caduca mientras se use.
- **Coste:** cero. Servidor y hosting en planes gratuitos; acceso por enlace, sin dominio propio.

**Principios de diseño**

1. **Modular:** cada funcionalidad es un módulo independiente que cada equipo puede activar o desactivar.
2. **Offline solo para las rotaciones:** ver la plantilla y trabajar con las rotaciones funciona sin conexión; todo lo demás requiere conexión.
3. **Simple para el jugador:** ver partidos y marcar disponibilidad en dos toques; la complejidad queda en el perfil de entrenador.
4. **Android vía PWA:** se instala desde Chrome; una APK con Capacitor queda como opción futura, sin reescribir.

## Usuarios, roles y acceso

Cada usuario se registra por su cuenta y entra en un equipo con un código; el rol se asigna por equipo, de modo que una misma persona puede ser entrenador en uno y jugador en otro.

**Registro y sesión**

- Registro con usuario y contraseña. Por debajo se guarda como `usuario@<dominio-interno>` para usar Supabase Auth sin pedir email real.
- La sesión se renueva automáticamente: el usuario solo vuelve a loguearse si cierra sesión o pasa mucho tiempo sin abrir la app.
- Casilla de consentimiento al registrarse (menores de 14 años necesitan autorización de sus padres en España). No se guardan DNI ni teléfonos de jugadores.
- Recuperar contraseña: sin email, la resetea el entrenador desde la gestión del equipo.

**Unirse a un equipo**

- El entrenador genera un código por rol (jugador / segundo entrenador). Se puede regenerar o desactivar.
- Quien entra con código de jugador queda pendiente hasta que el entrenador lo vincula a una ficha de la plantilla (o crea una nueva).

**Permisos por rol**

| Acción | Entrenador | Segundo / coordinador | Jugador |
| --- | --- | --- | --- |
| Ver partidos, resultados y tabla | Sí | Sí | Sí |
| Marcar su disponibilidad | Sí | Sí | Sí |
| Editar plantilla | Sí | Sí | No |
| Crear y editar partidos | Sí | Sí | No |
| Convocar | Sí | Sí | No |
| Planificar rotaciones y modo partido | Sí | Sí | Ver (si el entrenador lo publica) |
| Votar MVP del partido | Sí | No | Sí (si está convocada) |
| Resolver empate de MVP y ver recuento | Sí | No | No |
| Ajustes del equipo, códigos, módulos | Sí | No | No |
| Borrar equipo o transferirlo | Sí | No | No |

## Módulos

Siete módulos forman el núcleo; el plan de partido por set es el que más trabajo lleva y el que tiene que funcionar sin cobertura.

### 1. Resultados

- Lista de partidos jugados: fecha, rival, resultado por sets.
- **Tabla de liga no oficial** (opcional, la activa el entrenador): la rellena a mano y muestra siempre "Actualizada el dd/mm" bien visible.

### 2. Próximos partidos

- Lista por proximidad y vista de calendario.
- Detalle: rival, fecha, hora de calentamiento, hora de partido, pabellón (con enlace a Maps), local/visitante, notas.
- Botón de disponibilidad: Sí / No / Duda, con comentario opcional.
- Los jugadores ven si están convocados.

### 3. Plantilla (entrenador)

- Ficha: nombre, apellidos, año de nacimiento, dorsal, posición principal y secundarias, días de entrenamiento.
- Vinculación ficha ↔ cuenta de usuario (una ficha puede existir sin cuenta).
- **Sistema de juego predeterminado** del equipo: cada set nuevo arranca con él.

### 4. Gestión de partido (entrenador)

- Editar los datos del partido.
- Ver disponibilidad de todos y convocar a cualquiera, haya respondido o no.
- Botón **Preparar partido** → plan por set. Botón **Ir al partido** → modo partido.

### 5. Plan de partido por set (entrenador, funciona offline)

Para cada set se guarda un plan independiente:

- **Sistema:** 5-1, 6-0, 4-2, 6-2 o 4-2 con posiciones delanteras. Por defecto el sistema predeterminado del equipo o el del set anterior.
- **Rotación inicial:** campo con zonas 1–6 coloreadas por rol (colocador, receptor, central, opuesto, líbero). Cada zona solo ofrece convocados con esa posición, con opción de "mostrar todos".
- **Líbero:** quién entra y por quién.
- **Cambios previstos:** pares sale → entra, con nota opcional ("si falla recepción", "en rotación 3").
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
src/
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
| `teams` | id, name, category, season, default\_system, enabled\_modules, settings, created\_by | `enabled_modules` = lista de módulos activos; `settings` incluye `mvp_ranking_visible` |
| `team_members` | team\_id, user\_id, role, player\_id | role: coach / assistant / player; player\_id enlaza con la ficha |
| `join_codes` | team\_id, code, role, active, expires\_at | Un código por rol, regenerable |
| `players` | id, team\_id, first\_name, last\_name, birth\_year, number, main\_position, other\_positions, training\_days | Ficha de plantilla, puede no tener cuenta |
| `matches` | id, team\_id, opponent, date, warmup\_time, match\_time, venue, maps\_url, home\_away, status, sets\_result, notes, mvp\_status, mvp\_closes\_at, mvp\_winners | status: scheduled / played / cancelled; mvp\_status: closed / open / tie\_pending / finished |
| `availability` | match\_id, player\_id, status, comment, updated\_at | status: yes / no / maybe |
| `callups` | match\_id, player\_id | Convocados |
| `set_plans` | id, match\_id, set\_number, system, rotation, libero\_id, libero\_replaces, planned\_subs, updated\_at, updated\_by | rotation = zona 1–6 → player\_id |
| `mvp_votes` | match\_id, voter\_user\_id, voted\_player\_id, created\_at | Única por votante y votada; máx. 2 por votante. Sin acceso directo: solo vía RPC |
| `league_table` | team\_id, rows, updated\_at | Tabla no oficial, filas en JSON |

Posiciones como valores fijos: `setter` (colocador), `outside` (receptor), `middle` (central), `opposite` (opuesto), `libero`. Los nombres en pantalla van en español.

**RPC del MVP:** `cast_mvp_vote(match, ids)` (comprueba que vota el entrenador o una convocada con cuenta, que las votadas están convocadas, que no se vota a sí misma, máx. 2 y votación abierta), `close_mvp_vote(match)`, `resolve_mvp_tie(match, ids)` y `mvp_results(match)` (recuento, solo entrenador).

## Fases y roadmap

Cuatro fases sin fechas fijas; no se pasa a la siguiente hasta superar la prueba con uso real.

[Hoja de ruta: ver el documento original del proyecto]

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
| 2026-11-07 | Nuevo módulo opcional MVP del partido: 1 o 2 votos por votante, voto secreto |
| 2026-11-07 | Votan MVP las convocadas y el entrenador (mismo peso); el segundo entrenador no vota |
| 2026-11-07 | Empate en el MVP: lo resuelve el entrenador eligiendo una o manteniendo co-MVP |
| 2026-11-07 | Ranking de MVP de temporada: sin ceros para las jugadoras, el entrenador puede ocultarlo |
| 2026-11-07 | Offline solo plantilla (lectura) y rotaciones; resultados y lo demás requieren conexión |
| 2026-11-07 | Cada equipo tiene un sistema de juego predeterminado con el que arranca cada set |

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
