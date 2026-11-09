# Backend

El backend es un proyecto de **Supabase**: Postgres para los datos, Supabase Auth para el login y **RLS** (Row Level Security, permisos por fila) para decidir quién ve y cambia qué. No hay servidor propio: el frontend habla directamente con Supabase y la base de datos aplica las reglas.

| Dato | Valor |
| --- | --- |
| Proyecto | `voley-app`, organización Alexxvr8 |
| Ref | `djjeodajgsfvcisrrkzk` |
| Región | eu-central-1 (Frankfurt) |
| Dashboard | https://supabase.com/dashboard/project/djjeodajgsfvcisrrkzk |
| Plan | Gratuito. Se pausa tras 7 días sin actividad; lo evita la GitHub Action `.github/workflows/keep-supabase-awake.yml` (ver abajo) |

## Que no se pause

El plan gratuito pausa el proyecto tras 7 días sin actividad y entonces el login deja de funcionar. La GitHub Action `keep-supabase-awake.yml` hace una consulta a la base de datos cada 3 días. Lee la URL y la clave publicable de las variables del repositorio (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, en GitHub → Settings → Secrets and variables → Actions → Variables). Se puede lanzar a mano desde la pestaña Actions.

GitHub desactiva las tareas programadas de un repositorio público tras 60 días sin commits; si pasa, se reactiva desde la pestaña Actions. Si el proyecto ya está pausado, se restaura desde el dashboard de Supabase.

## Estructura

```
backend/
└── supabase/
    └── migrations/      Cambios de esquema en orden, uno por fichero
```

## Migraciones

Cada cambio en la base de datos es un fichero SQL nuevo en `supabase/migrations/` con el nombre `AAAAMMDDhhmmss_descripcion.sql`. **Nunca se edita una migración ya aplicada**: si hay que corregir algo, se crea otra.

| Migración | Qué hace |
| --- | --- |
| `20261026000000_initial_schema.sql` | Todas las tablas, funciones auxiliares, RPC y políticas RLS |
| `20261026000100_restrict_function_grants.sql` | Impide que usuarios sin sesión llamen a funciones internas |
| `20261027000000_set_plan_rotation_and_liberos.sql` | Añade la R inicial y un segundo líbero a `set_plans`; quita "líbero entra por" |
| `20261107000000_teams_accounts_trainings.sql` | Jugadores pendientes sin acceso hasta que los acepta el entrenador, `my_teams`, `team_members_overview`, `accept_member`, `players.competes`, horario de entrenamientos y recuperación de contraseña |
| `20261107000100_remove_4_2_front_system.sql` | Quita el sistema `4-2-front`: quedan 5-1, 6-0, 4-2 y 6-2 |
| `20261107000200_callup_match_overrides.sql` | Dorsal y posición por partido en `callups` (`number`, `position`) y permiso para cambiarlos |
| `20261107000300_callup_positions_and_training_maps.sql` | `callups.position` pasa a `positions` (varias posiciones por partido) y `training_slots.maps_url` |
| `20261107000400_team_ownership_and_email_recovery.sql` | Un equipo nunca se queda sin entrenador (trigger `keep_a_coach`), `transfer_team` y recuperación por correo (`account_recovery_email` y sus funciones) |
| `20261107000500_warmup_venues_team_color.sql` | Calentamiento como duración (`matches.warmup_minutes` sustituye a `warmup_time`), pabellones del equipo (`team_venues`), color del equipo (`teams.color`) y `my_teams` devuelve el color |
| `20261107000600_team_opponents.sql` | Lista de rivales del equipo (`team_opponents`) |
| `20261108000000_save_set_plan.sql` | RPC `save_set_plan` para guardar el plan de un set (también los cambios hechos sin conexión) avisando si otra persona lo había cambiado |
| `20261108000100_fix_save_set_plan_ambiguity.sql` | Corrige `save_set_plan`: el parámetro `set_number` chocaba con la columna y ningún guardado funcionaba |
| `20261108000200_results_module.sql` | Módulo Resultados activo en todos los equipos y permiso para quitar la tabla de liga |
| `20261108000300_training_attendance_and_final_score.sql` | Asistencia a entrenamientos (`training_attendance`), formato del partido (`matches.sets_format`) y marcador final sin puntos por set (`matches.final_score`) |
| `20261108000400_merge_players.sql` | RPC `merge_players` (solo entrenador): junta dos fichas de la misma persona pasando cuenta, disponibilidad, convocatorias, asistencia y planes por set a la que se queda |
| `20261109000000_mvp_module.sql` | Módulo MVP: `matches.mvp_status` / `mvp_closes_at` / `mvp_winners`, `teams.mvp_ranking_visible`, tabla `mvp_votes` (sin acceso directo), trigger `matches_mvp_guard`, las RPC del MVP y `merge_players` también pasa votos y MVP ganados |
| `20261109000100_seasons.sql` | Temporadas dentro del equipo: tabla `seasons`, `teams.current_season_id`, `matches.season_id` y `league_table.season_id` (una tabla por temporada), bajas (`players.active`), RPC `start_season` y triggers que ponen la temporada actual |
| `20261109000200_player_membership.sql` | Fichas que no son del equipo: `players.membership` (`member` / `regular` / `one_off`), `visit_weekdays` y `visit_date`; quita `training_days`, que no se usaba |
| `20261109000300_private_policy_helpers.sql` | Seguridad: las funciones auxiliares de las políticas pasan al esquema `private` (la API no lo expone), así que ya no se pueden llamar como `/rest/v1/rpc/...`. Quedan en `public` dos envoltorios (`has_team_role`, `match_team`) que solo usan las RPC |
| `20261109000400_player_nickname.sql` | `players.nickname`: apodo que pone el staff (hasta 20 caracteres); la app lo muestra en vez del nombre completo |

Se aplican al proyecto con el conector de Supabase (`apply_migration`) o con la CLI (`supabase db push`, desde `backend/`).

## Tablas

La pieza central es `team_members`: une usuario, equipo y rol, y todas las reglas de permisos se apoyan en ella.

| Tabla | Qué guarda | Notas |
| --- | --- | --- |
| `profiles` | Nombre de usuario y nombre visible de cada cuenta | Se crea sola al registrarse (trigger `on_auth_user_created`) |
| `teams` | Equipos: nombre, categoría, temporada, color (`#rrggbb`), sistema por defecto, módulos activos y si las jugadoras ven el ranking de MVP (`mvp_ranking_visible`) | Se crean con la RPC `create_team` |
| `team_members` | Quién pertenece a qué equipo y con qué rol (`coach`, `assistant`, `player`) | `player_id` enlaza la cuenta con su ficha. Si está vacío, el jugador está **pendiente** |
| `join_codes` | Código de acceso por equipo y rol | Uno por rol; se regenera con `regenerate_join_code` |
| `players` | Fichas de la plantilla | Una ficha puede existir sin cuenta. `competes = false`: solo entrena, no puede tener disponibilidad ni ser convocado. `active = false`: baja de una temporada anterior, solo para el historial (tampoco responde ni se convoca). `membership`: `member` (del equipo), `regular` (viene los días de `visit_weekdays`, 1 = lunes) o `one_off` (viene el día `visit_date`); la app decide a quién se pregunta y convoca |
| `matches` | Partidos (cada uno en su temporada, `season_id`; al crearlo, la actual): rival, fecha, hora, calentamiento en minutos (`warmup_minutes`, de 15 en 15), pabellón y enlace de Maps, estado, formato y resultado | `sets_format` = `best_of_5` / `best_of_3` / `fixed_3` / `fixed_1`; `sets_result` = `[{"us": 25, "them": 20}, …]` o, si solo se apunta el marcador, `final_score` = `{"us": 2, "them": 1}`; con resultado, `status = played`. MVP: `mvp_status` = `closed` / `open` / `tie_pending` / `finished`, `mvp_closes_at` y `mvp_winners` (fichas; varias = co-MVP), que solo cambian por las RPC del MVP |
| `availability` | Respuesta de cada jugador a cada partido (`yes`, `no`, `maybe`) | |
| `callups` | Convocados de cada partido | `number` y `positions`: dorsal y posiciones solo para ese partido (vacío = los de la ficha; la primera posición es la principal) |
| `set_plans` | Plan de cada set: sistema, rotación inicial, alineación, líberos, cambios previstos | `start_rotation` = 1–6 (R1…R6); `rotation` = `{"1": player_id, …, "6": player_id}`; `libero_id` y `second_libero_id`; `planned_subs` = `[{"kind": "normal" | "serve" | "double", "swaps": [{"out", "in"}], "note"}]` (las filas antiguas `{"out", "in", "note"}` se leen como cambio normal) |
| `league_table` | Tabla de liga no oficial, rellenada a mano, una por temporada | Clave `season_id`; filas en JSON |
| `seasons` | Temporadas del equipo: nombre y fecha de inicio | Solo lectura para el equipo; se crean al crear el equipo (trigger) y con `start_season`. `teams.current_season_id` es la actual y `teams.season` su nombre (renombrarlo renombra la temporada) |
| `training_slots` | Horario semanal de entrenamientos: día (1 = lunes … 7 = domingo), hora de inicio y fin, lugar y enlace de Google Maps | Se repite cada semana en el calendario |
| `training_cancellations` | Fechas en que un entrenamiento del horario no se hace | |
| `training_attendance` | Si cada jugador va a un entrenamiento en una fecha (`yes`, `no`, `maybe`) | Clave: entrenamiento + fecha + jugador |
| `account_recovery` | Hash del código de recuperación de cada cuenta, intentos fallidos y bloqueo | Sin políticas: solo se usa desde las funciones de recuperación |
| `account_recovery_email` | Correo de recuperación (opcional) y el hash del enlace de un solo uso, con caducidad | Sin políticas: solo vía funciones. Nadie del equipo lo ve |
| `team_venues` | Pabellones habituales del equipo con su enlace de Google Maps | Partidos y entrenamientos copian nombre y enlace |
| `team_opponents` | Rivales habituales del equipo | Nombre único dentro del equipo; los partidos guardan su propia copia del nombre |
| `mvp_votes` | Votos del MVP: partido, cuenta que vota y ficha votada (1 o 2 filas por votante) | Sin políticas: solo vía RPC, para que nadie vea quién votó a quién |

Los valores fijos (posiciones, roles, sistemas, estados) se validan con `check` en la propia tabla.

## Permisos (RLS)

Todas las tablas tienen RLS activado. Resumen de quién puede qué:

| Tabla | Ver | Crear / editar / borrar |
| --- | --- | --- |
| `profiles` | Tu perfil y el de quien comparte equipo contigo | Solo el tuyo |
| `teams` | Miembros del equipo | Editar y borrar: entrenador |
| `team_members` | Miembros del equipo | Cambiar rol o enlazar ficha: entrenador. Salir del equipo: uno mismo |
| `join_codes` | Entrenador | Entrenador |
| `players`, `matches`, `callups`, `league_table`, `training_slots`, `training_cancellations`, `team_venues`, `team_opponents` | Miembros del equipo | Entrenador y segundo |
| `availability` | Miembros del equipo | El jugador la suya (si su cuenta está enlazada a la ficha); entrenador y segundo, la de cualquiera |
| `training_attendance` | Miembros del equipo | El jugador la suya; entrenador y segundo, la de cualquiera (siempre de un jugador del mismo equipo) |
| `set_plans` | Entrenador y segundo | Entrenador y segundo |

Los jugadores no ven los planes por set: rotaciones y modo partido son solo del staff (decisión del 2026-11-08).

### Funciones auxiliares de las políticas

Viven en el esquema `private`, que la API no expone: las políticas las usan, pero nadie las puede llamar como RPC. Son `security definer`: se ejecutan con permisos del propietario para poder consultar `team_members` sin que RLS entre en bucle. Solo devuelven sí/no sobre el propio usuario. Las RPC llaman a `public.has_team_role` y `public.match_team`, envoltorios que solo puede ejecutar el propietario.

| Función | Devuelve |
| --- | --- |
| `private.role_rank(role)` | 0 jugador, 1 segundo, 2 entrenador. Permite comparar roles ("al menos segundo") |
| `private.has_team_role(team, min_role)` | ¿El usuario actual está en el equipo con al menos ese rol? Un jugador pendiente (sin ficha enlazada) no cuenta |
| `private.match_team(match)` | Equipo al que pertenece un partido |
| `private.is_own_player(match, player)` | ¿Esa ficha es la del usuario actual en el equipo del partido? |
| `private.player_in_match_team(match, player)` | ¿La ficha es del mismo equipo que el partido, compite y sigue en el equipo? Evita mezclar equipos y deja fuera a quien solo entrena |
| `private.slot_team(slot)` | Equipo al que pertenece un entrenamiento del horario |

## Funciones RPC (llamables desde el frontend)

Las acciones que tocan varias tablas o necesitan saltarse RLS de forma controlada van por RPC, con `supabase.rpc('<nombre>', { … })`.

| RPC | Quién | Qué hace |
| --- | --- | --- |
| `create_team(name, category, season)` | Cualquier usuario con sesión | Crea el equipo y te añade como entrenador. Devuelve el id |
| `join_team(join_code)` | Cualquier usuario con sesión | Te une al equipo del código con su rol. Si es de jugador, quedas pendiente de enlace. Error `P0002` si el código no vale |
| `regenerate_join_code(team, code_role)` | Entrenador | Crea o renueva el código del rol: 8 caracteres sin letras ni números que se confundan (0/O, 1/I) |
| `my_teams()` | Cualquier usuario con sesión | Tus equipos con tu rol, tu ficha y si estás pendiente |
| `team_members_overview(team)` | Entrenador y segundo | Miembros con usuario y nombre visible |
| `accept_member(team, member, player)` | Entrenador | Acepta a un jugador pendiente vinculándolo a una ficha del equipo que no tenga cuenta. Si la ficha era una baja, vuelve a la plantilla |
| `create_recovery_code()` | Cualquier usuario con sesión | Crea o sustituye tu código de recuperación y lo devuelve (solo esa vez) |
| `reset_password_with_code(username, code, new_password)` | **Sin sesión** | Pone una contraseña nueva si el código es correcto y devuelve `{ok, code}` con el código nuevo. 5 fallos bloquean 15 minutos. Devuelve en vez de lanzar error para que los fallos queden contados |
| `coach_reset_password(team, member)` | Entrenador | Pone una contraseña temporal a un miembro que no sea entrenador y la devuelve |
| `transfer_team(team, new_coach)` | Entrenador | Hace entrenador a otro miembro; el actual pasa a segundo entrenador |
| `save_set_plan(match, set_number, …, base_updated_at)` | Entrenador y segundo (RLS de `set_plans`) | Guarda el plan de un set. Si otra persona lo había guardado después de la versión de la que partía el cambio (`base_updated_at`), lo guarda igual (gana el último) y devuelve `overwritten` y quién era, para avisar |
| `set_recovery_email(email)` / `my_recovery_email()` | Cualquier usuario con sesión | Guarda (vacío = quita) o lee tu correo de recuperación |
| `reset_password_with_email_token(username, token, new_password)` | **Sin sesión** | Contraseña nueva con el enlace del correo: un solo uso y 1 hora. Devuelve `{ok, code}` con un código de recuperación nuevo |
| `issue_email_reset_token(username)` | Solo `service_role` (la Edge Function) | Crea el enlace de 1 hora y devuelve a qué correo mandarlo; como mucho uno por minuto |
| `cast_mvp_vote(match, ids)` | Entrenador y convocadas con cuenta | Guarda (o sustituye) tu voto: 1 o 2 convocadas distintas, nunca tú misma, con la votación abierta |
| `my_mvp_vote(match)` | Miembros del equipo | A quién has votado tú (vacío si no has votado) |
| `settle_mvp(match)` | Miembros del equipo | Cierra la votación si ya pasaron sus 48 h. El cierre es perezoso: lo hace la primera pantalla o voto que llega después del plazo, sin tareas programadas |
| `open_mvp_vote(match)` | Entrenador | Abre 48 h la votación de un partido jugado que nunca la tuvo (p. ej. si el módulo se activó después) |
| `close_mvp_vote(match)` | Entrenador | Cierra antes de tiempo. Sin votos: sin MVP; una líder: MVP; empate: `tie_pending` |
| `resolve_mvp_tie(match, ids)` | Entrenador | Elige entre las empatadas; varias = co-MVP |
| `start_season(team, season_name, leaving)` | Entrenador | Empieza una temporada nueva (pasa a ser la actual) y da de baja las fichas de `leaving`: pierden convocatorias y respuestas pendientes, y si son jugadores con cuenta, el acceso al equipo. Su historial se queda |
| `mvp_results(match)` | Entrenador | Recuento: votos por jugadora, cuántas han votado y cuántas pueden (nunca quién votó a quién) |

**Trigger `keep_a_coach`:** impide quitar o degradar al último entrenador de un equipo (para irse, antes hay que transferirlo). Borrar el equipo entero sí se permite.

**Triggers de temporada:** `teams_create_first_season` crea la primera temporada de cada equipo nuevo; `matches_default_season` y `league_table_default_season` ponen la temporada actual si no se indica; `teams_sync_current_season` impide cambiar la temporada actual a mano (solo `start_season`) y pasa los cambios de `teams.season` a su nombre.

**Trigger `matches_mvp_guard`:** las columnas `mvp_*` de `matches` ignoran los cambios directos (solo las cambian las RPC del MVP, que activan `app.mvp_rpc`). Al pasar un partido a jugado, si el equipo tiene el módulo `mvp`, abre su votación 48 h.

## Edge Functions

El código vive en `supabase/functions/` y se despliega con el conector de Supabase o con `supabase functions deploy <nombre>`.

| Función | Qué hace |
| --- | --- |
| `send-reset-email` | "He olvidado la contraseña → Por correo". Recibe `{ username }`, pide un token a `issue_email_reset_token` y manda el enlace `https://voley-app-gold.vercel.app/?recuperar=<token>&usuario=<usuario>` con Brevo. Responde igual exista o no el usuario. Se despliega sin verificar JWT porque la usa quien no puede entrar |

Secretos de la función (*Edge Functions → Secrets*): `BREVO_API_KEY` y `MAIL_SENDER_EMAIL` (remitente verificado en Brevo); opcionales `MAIL_SENDER_NAME` y `APP_URL`. Sin los dos primeros, la función responde `not_configured` y la app avisa de que el correo aún no está activado.

## Registro de usuarios

1. El frontend llama a `auth.signUp` con email `usuario@voley.local` y metadatos `{ username, display_name }`.
2. El trigger `on_auth_user_created` ejecuta `handle_new_user()`, que crea la fila en `profiles`.
3. Si el `username` no cumple `^[a-z0-9._-]{3,30}$` o ya existe, el registro falla entero.

**Requisito de configuración:** en *Authentication → Sign In / Providers → Email* hay que tener **desactivado "Confirm email"**. Si no, ninguna cuenta puede entrar.

## Avisos conocidos del linter de Supabase

El linter avisa de que usuarios con sesión (y, en `reset_password_with_code`, también sin sesión) pueden ejecutar funciones `security definer`, y de que `account_recovery` no tiene políticas. Es intencionado:

- Las RPC están pensadas para eso y comprueban permisos por dentro.
- Las funciones auxiliares tienen que poder ejecutarse para que funcionen las políticas, y solo responden sobre el propio usuario.
- `reset_password_with_code` es para quien no puede entrar; se protege con el código (60 bits aleatorios, guardado con bcrypt) y el bloqueo por intentos.
- `account_recovery` no debe leerse nunca desde la API.

## Cómo probar los permisos

Se puede simular a un usuario dentro de una transacción en el SQL editor:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<uuid-del-usuario>","role":"authenticated"}', true);
select * from public.players;  -- solo verá los de sus equipos
rollback;
```
