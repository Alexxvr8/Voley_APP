# core/

Infraestructura que comparten todas las pantallas: login, equipos del usuario, navegación y el registro de módulos.

| Carpeta / fichero | Qué hace |
| --- | --- |
| `App.tsx` | Raíz de la app. Sin sesión muestra el login; con sesión, el router. Fuera de un equipo: "Mis equipos" (`/`), añadir equipo (`/equipos/nuevo`) y "Mi cuenta" (`/cuenta`). Dentro de `/equipos/:teamId/…`, las pantallas de los módulos activos que permite el rol |
| `supabase/client.ts` | Crea el cliente único de Supabase con las variables de entorno. La sesión se guarda en el móvil y se renueva sola |
| `query/queryClient.ts` | Cliente de TanStack Query: caché de los datos del servidor. Se vacía al cerrar sesión |
| `auth/auth.tsx` | `AuthProvider` y `useAuth()`: usuario, `signIn`, `signUp`, `resetPassword` (con código de recuperación), `signOut` y el aviso con el código que se muestra una vez |
| `auth/LoginPage.tsx` + `auth/components/` | Entrar, crear cuenta (contraseña dos veces y consentimiento) y "He olvidado la contraseña" |
| `auth/RecoveryCodeScreen.tsx` | Pantalla "Guarda tu código de recuperación", tras registrarse o tras recuperar la contraseña |
| `auth/errors.ts` | Mensajes de error comprensibles y validación de contraseña nueva |
| `teams/api.ts` | `useMyTeams()` (RPC `my_teams`: equipos, rol y si estás pendiente), `useTeam()`, crear equipo y unirse con código |
| `teams/currentTeam.tsx` | `CurrentTeamProvider`: el equipo de la URL y tu rol en él. Si estás pendiente, muestra la espera. `useCurrentTeam()`, `useTeamPath()` (enlaces dentro del equipo) y `hasRole()` |
| `teams/TeamsPage.tsx`, `teams/AddTeamPage.tsx` | "Mis equipos" y el "+" (tengo un código / crear equipo) |
| `account/AccountPage.tsx` | "Mi cuenta": código de recuperación nuevo, cambiar contraseña, cerrar sesión |
| `layout/AppShell.tsx` | Marco de todas las pantallas. PC (`lg`, desde 1024 px): barra lateral siempre visible. Móvil: cabecera con botón ☰ que abre el mismo menú, y pestañas abajo mientras hay un equipo abierto |
| `layout/components/TeamsMenu.tsx` | El menú: "Mis equipos" con el "+", la lista de tus equipos y, bajo el equipo abierto, sus secciones (Partidos, Plantilla y, para el entrenador, Ajustes) |
| `layout/teamMenu.ts` | `useOpenTeam()` (equipo de la URL) y `useTeamMenu()` (secciones según módulos activos y rol) |
| `modules/types.ts` | `ModuleDefinition`: el contrato que cumple cada módulo. Las rutas y el menú van **relativos al equipo** (`partidos`, `partidos/:matchId`…) |
| `modules/registry.ts` | Lista de módulos de la app. Añadir un módulo = añadirlo aquí |

## Roles en cada equipo

El rol sale de `team_members` (no se puede cambiar desde la app). Cada pantalla de módulo pasa por `ModuleGuard`: solo se ve si el módulo está activo en el equipo y el rol llega al mínimo. Las páginas de staff comprueban además el rol por su cuenta, y la base de datos lo vuelve a comprobar con RLS.

## Recuperar la contraseña

1. Al crear la cuenta se genera un código (`XXXX-XXXX-XXXX`) que se enseña una sola vez. En la base de datos solo se guarda su hash.
2. "He olvidado la contraseña": usuario + código + contraseña nueva (RPC `reset_password_with_code`). Si es correcto, se entra y se muestra un código nuevo; el usado deja de servir.
3. Tras 5 intentos fallidos, el código se bloquea 15 minutos.
4. Respaldo: el entrenador puede poner una contraseña temporal desde Ajustes → Miembros.
5. Recuperación por email: pendiente (necesita un servicio de envío gratuito).

## Login sin email

Supabase Auth necesita un email, pero los jugadores no tienen por qué tenerlo. El nombre de usuario se convierte en un email interno (`lucia` → `lucia@voley.local`) que nunca recibe correos. Por eso en Supabase está desactivada la confirmación de email.

Al registrarse se envían `username` y `display_name` como metadatos. Un trigger del backend crea con ellos la fila en `profiles` (ver `backend/README.md`).

## Sesión y modo sin conexión

- `supabase-js` guarda la sesión en `localStorage`, así que abrir la app sin red mantiene la sesión.
- `signOut` intenta cerrar la sesión en el servidor. Si no hay red, la cierra al menos en el móvil.
