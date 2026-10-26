# Backend

El backend es un proyecto de **Supabase**: Postgres para los datos, Supabase Auth para el login y **RLS** (Row Level Security, permisos por fila) para decidir quién ve y cambia qué. No hay servidor propio: el frontend habla directamente con Supabase y la base de datos aplica las reglas.

| Dato | Valor |
| --- | --- |
| Proyecto | `voley-app`, organización Alexxvr8 |
| Ref | `djjeodajgsfvcisrrkzk` |
| Región | eu-central-1 (Frankfurt) |
| Dashboard | https://supabase.com/dashboard/project/djjeodajgsfvcisrrkzk |
| Plan | Gratuito. Se pausa tras 7 días sin actividad; en una fase posterior lo evitará una GitHub Action |

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

Se aplican al proyecto con el conector de Supabase (`apply_migration`) o con la CLI (`supabase db push`, desde `backend/`).

## Tablas

La pieza central es `team_members`: une usuario, equipo y rol, y todas las reglas de permisos se apoyan en ella.

| Tabla | Qué guarda | Notas |
| --- | --- | --- |
| `profiles` | Nombre de usuario y nombre visible de cada cuenta | Se crea sola al registrarse (trigger `on_auth_user_created`) |
| `teams` | Equipos: nombre, categoría, temporada, sistema por defecto, módulos activos | Se crean con la RPC `create_team` |
| `team_members` | Quién pertenece a qué equipo y con qué rol (`coach`, `assistant`, `player`) | `player_id` enlaza la cuenta con su ficha. Si está vacío, el jugador está **pendiente** |
| `join_codes` | Código de acceso por equipo y rol | Uno por rol; se regenera con `regenerate_join_code` |
| `players` | Fichas de la plantilla | Una ficha puede existir sin cuenta |
| `matches` | Partidos: rival, fecha, horas, pabellón, estado, resultado por sets | `sets_result` = `[{"us": 25, "them": 20}, …]` |
| `availability` | Respuesta de cada jugador a cada partido (`yes`, `no`, `maybe`) | |
| `callups` | Convocados de cada partido | |
| `set_plans` | Plan de cada set: sistema, rotación, líbero, cambios previstos | `rotation` = `{"1": player_id, …, "6": player_id}`; `planned_subs` = `[{"out", "in", "note"}]` |
| `league_table` | Tabla de liga no oficial, rellenada a mano | Filas en JSON |

Los valores fijos (posiciones, roles, sistemas, estados) se validan con `check` en la propia tabla.

## Permisos (RLS)

Todas las tablas tienen RLS activado. Resumen de quién puede qué:

| Tabla | Ver | Crear / editar / borrar |
| --- | --- | --- |
| `profiles` | Tu perfil y el de quien comparte equipo contigo | Solo el tuyo |
| `teams` | Miembros del equipo | Editar y borrar: entrenador |
| `team_members` | Miembros del equipo | Cambiar rol o enlazar ficha: entrenador. Salir del equipo: uno mismo |
| `join_codes` | Entrenador | Entrenador |
| `players`, `matches`, `callups`, `league_table` | Miembros del equipo | Entrenador y segundo |
| `availability` | Miembros del equipo | El jugador la suya (si su cuenta está enlazada a la ficha); entrenador y segundo, la de cualquiera |
| `set_plans` | Entrenador y segundo | Entrenador y segundo |

Que los jugadores vean los planes por set sigue siendo un tema abierto del SPEC. Por ahora no los ven.

### Funciones auxiliares de las políticas

Son `security definer`: se ejecutan con permisos del propietario para poder consultar `team_members` sin que RLS entre en bucle. Solo devuelven sí/no sobre el propio usuario.

| Función | Devuelve |
| --- | --- |
| `role_rank(role)` | 0 jugador, 1 segundo, 2 entrenador. Permite comparar roles ("al menos segundo") |
| `has_team_role(team, min_role)` | ¿El usuario actual está en el equipo con al menos ese rol? |
| `match_team(match)` | Equipo al que pertenece un partido |
| `is_own_player(match, player)` | ¿Esa ficha es la del usuario actual en el equipo del partido? |
| `player_in_match_team(match, player)` | ¿La ficha es del mismo equipo que el partido? Evita mezclar equipos |

## Funciones RPC (llamables desde el frontend)

Las acciones que tocan varias tablas o necesitan saltarse RLS de forma controlada van por RPC, con `supabase.rpc('<nombre>', { … })`.

| RPC | Quién | Qué hace |
| --- | --- | --- |
| `create_team(name, category, season)` | Cualquier usuario con sesión | Crea el equipo y te añade como entrenador. Devuelve el id |
| `join_team(join_code)` | Cualquier usuario con sesión | Te une al equipo del código con su rol. Si es de jugador, quedas pendiente de enlace. Error `P0002` si el código no vale |
| `regenerate_join_code(team, code_role)` | Entrenador | Crea o renueva el código del rol: 8 caracteres sin letras ni números que se confundan (0/O, 1/I) |

## Registro de usuarios

1. El frontend llama a `auth.signUp` con email `usuario@voley.local` y metadatos `{ username, display_name }`.
2. El trigger `on_auth_user_created` ejecuta `handle_new_user()`, que crea la fila en `profiles`.
3. Si el `username` no cumple `^[a-z0-9._-]{3,30}$` o ya existe, el registro falla entero.

**Requisito de configuración:** en *Authentication → Sign In / Providers → Email* hay que tener **desactivado "Confirm email"**. Si no, ninguna cuenta puede entrar.

## Avisos conocidos del linter de Supabase

El linter avisa de que usuarios con sesión pueden ejecutar funciones `security definer`. Es intencionado:

- Las RPC están pensadas para eso y comprueban permisos por dentro.
- Las funciones auxiliares tienen que poder ejecutarse para que funcionen las políticas, y solo responden sobre el propio usuario.

## Cómo probar los permisos

Se puede simular a un usuario dentro de una transacción en el SQL editor:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<uuid-del-usuario>","role":"authenticated"}', true);
select * from public.players;  -- solo verá los de sus equipos
rollback;
```
