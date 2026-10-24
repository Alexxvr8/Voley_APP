# App Voley — Especificación

Actualizada: 2026-10-24

## Visión y alcance

App web instalable (PWA) para gestionar equipos de voleibol: plantilla, calendario, disponibilidad, convocatorias y planificación de rotaciones por set, usable en pabellones sin cobertura.

- **Para quién:** pensada para los equipos de Brian, pero abierta a que cualquier entrenador cree los suyos.
- **Usuarios:** jugadores menores o con poca soltura con la tecnología. Login con usuario y contraseña, sin email obligatorio, y sesión que no caduca mientras se use.
- **Coste:** cero. Servidor y hosting en planes gratuitos; acceso por enlace, sin dominio propio.

**Principios de diseño**

1. **Modular:** cada funcionalidad es un módulo independiente que cada equipo puede activar o desactivar.
2. **Offline primero en el partido:** todo lo necesario para dirigir un partido funciona sin conexión.
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
| Ajustes del equipo, códigos, módulos | Sí | No | No |
| Borrar equipo o transferirlo | Sí | No | No |

## Módulos

Seis módulos forman el núcleo; el plan de partido por set es el que más trabajo lleva y el que tiene que funcionar sin cobertura.

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
- Sistema de juego por defecto del equipo.

### 4. Gestión de partido (entrenador)

- Editar los datos del partido.
- Ver disponibilidad de todos y convocar a cualquiera, haya respondido o no.
- Botón **Preparar partido** → plan por set. Botón **Ir al partido** → modo partido.

### 5. Plan de partido por set (entrenador)

Para cada set se guarda un plan independiente:

- **Sistema:** 5-1, 6-0, 4-2, 6-2 o 4-2 con posiciones delanteras. Por defecto el del equipo o el del set anterior.
- **Rotación inicial:** campo con zonas 1–6 coloreadas por rol (colocador, receptor, central, opuesto, líbero). Cada zona solo ofrece convocados con esa posición, con opción de "mostrar todos".
- **Líbero:** quién entra y por quién.
- **Cambios previstos:** pares sale → entra, con nota opcional ("si falla recepción", "en rotación 3").
- **Copiar plan de otro set** para no empezar de cero.

### 6. Modo partido (entrenador, funciona offline)

- Vista grande y clara del plan del set actual: rotación, líbero y cambios previstos.
- Botón para avanzar rotación (R1 → R6) y ver quién está en cada zona.
- Entre sets: cambiar rotación o sistema del siguiente set sobre la marcha.
- Registrar cambios realizados y resultado del set (opcional en MVP).

### Módulos futuros

Asistencia a entrenamientos, notificaciones push, estadísticas por jugador, tablón de avisos, importación desde Google Sheets.

## Requisito offline

El modo partido y el plan por set tienen que funcionar completos sin conexión, incluidas las ediciones entre sets; el resto de la app puede pedir conexión.

**Cómo funciona**

1. **App instalable con service worker:** la interfaz entera queda guardada en el móvil y abre sin red.
2. **Descarga automática:** al abrir la app con conexión, se guardan en el móvil (IndexedDB) los partidos próximos de los equipos donde eres entrenador, con su convocatoria, plantilla y planes por set.
3. **Indicador visible:** cada partido muestra "Disponible sin conexión" y la hora de la última sincronización. Botón manual "Preparar para sin conexión" por si acaso.
4. **Ediciones offline:** los cambios en rotaciones, sistema, cambios y resultado se guardan en local y en una cola de sincronización.
5. **Sincronización al volver la red:** la cola se envía sola. Si dos personas editaron el mismo set, gana el último cambio y se avisa.

**Qué necesita conexión:** registrarse, entrar con código en un equipo, marcar disponibilidad y ver la tabla actualizada. La disponibilidad marcada sin red se puede encolar igual que lo demás (fase 3).

**Prueba de aceptación:** activar modo avión en casa, abrir la app y dirigir un partido completo de 5 sets, cambiando sistema entre sets; al quitar el modo avión, todo aparece en el servidor.

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
| Repositorio | GitHub (Alexxvr8/Voley_APP) | Control de versiones y GitHub Actions |
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
  shared/        # componentes UI, utilidades
```

Cada módulo exporta su propio registro (rutas, entrada de menú, rol mínimo, si funciona offline). El núcleo solo lee esos registros y los ajustes del equipo para decidir qué mostrar. Añadir un módulo = crear su carpeta y registrarlo.

## Modelo de datos inicial

La pieza clave es `team_members`: une usuario, equipo y rol, y todas las reglas de seguridad (RLS) se apoyan en ella.

| Tabla | Campos principales | Notas |
| --- | --- | --- |
| `profiles` | id (= auth user), username, display_name | Uno por cuenta |
| `teams` | id, name, category, season, default_system, enabled_modules, created_by | `enabled_modules` = lista de módulos activos |
| `team_members` | team_id, user_id, role, player_id | role: coach / assistant / player; player_id enlaza con la ficha |
| `join_codes` | team_id, code, role, active, expires_at | Un código por rol, regenerable |
| `players` | id, team_id, first_name, last_name, birth_year, number, main_position, other_positions, training_days | Ficha de plantilla, puede no tener cuenta |
| `matches` | id, team_id, opponent, date, warmup_time, match_time, venue, maps_url, home_away, status, sets_result, notes | status: scheduled / played / cancelled |
| `availability` | match_id, player_id, status, comment, updated_at | status: yes / no / maybe |
| `callups` | match_id, player_id | Convocados |
| `set_plans` | id, match_id, set_number, system, rotation, libero_id, libero_replaces, planned_subs, updated_at, updated_by | rotation = zona 1–6 → player_id |
| `league_table` | team_id, rows, updated_at | Tabla no oficial, filas en JSON |

Posiciones como valores fijos: `setter` (colocador), `outside` (receptor), `middle` (central), `opposite` (opuesto), `libero`. Los nombres en pantalla van en español.

## Fases y roadmap

Cuatro fases sin fechas fijas; no se pasa a la siguiente hasta superar la prueba con uso real.

| Fase | Contenido | Prueba para pasar |
| --- | --- | --- |
| 0 · Base | Repo en GitHub, Supabase + Vercel, PWA instalable, login y sesión larga, estructura modular | Login funciona en el móvil |
| 1 · MVP | Equipos y roles, códigos de acceso, plantilla, partidos y calendario, disponibilidad, convocatoria | Tu equipo lo usa dos semanas |
| 2 · Partido | Plan por set, sistemas y rotaciones, cambios previstos, modo partido, offline y sincronización, resultados y tabla | Partido real en modo avión |
| 3 · Extras | Entrenamientos, notificaciones, estadísticas, importar Sheets, APK (opcional) | — |

La fase 2 es la crítica: el offline se diseña desde la fase 0 (estructura de datos local), pero se completa y prueba aquí.

## Registro de decisiones y temas abiertos

| Fecha | Decisión |
| --- | --- |
| 2026-10-24 | Sin rol de padre/tutor |
| 2026-10-24 | Los usuarios se registran solos y entran en el equipo con un código |
| 2026-10-24 | Pensada para los equipos de Brian, abierta a cualquier entrenador |
| 2026-10-24 | Stack: React + Vite (PWA), Supabase, Vercel |
| 2026-10-24 | Plan por set con sistema, rotación, líbero y cambios previstos, editable entre sets |
| 2026-10-24 | Modo partido y plan por set funcionan sin conexión |

**Temas abiertos**

- [ ] ¿Temporadas dentro del equipo o un equipo nuevo cada año?
- [ ] ¿Los jugadores ven la rotación planificada o solo el entrenador?
- [ ] Nombre de la app
- [ ] ¿Registrar en el modo partido el resultado punto a punto o solo por set?