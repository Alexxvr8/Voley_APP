# core/

Infraestructura que comparten todas las pantallas: login, equipos del usuario, navegación y el registro de módulos.

| Carpeta / fichero | Qué hace |
| --- | --- |
| `App.tsx` | Raíz de la app. Sin sesión muestra el login; con sesión, el router. Fuera de un equipo: "Mis equipos" (`/`), añadir equipo (`/equipos/nuevo`) y "Mi cuenta" (`/cuenta`). Dentro de `/equipos/:teamId/…`, las pantallas de los módulos activos que permite el rol |
| `supabase/client.ts` | Crea el cliente único de Supabase con las variables de entorno. La sesión se guarda en el móvil y se renueva sola |
| `query/queryClient.ts` | Cliente de TanStack Query: caché de los datos del servidor (se guarda una semana en el móvil). Arranca con el estado real de la red. Se vacía al cerrar sesión |
| `offline/` | Todo lo de "sin conexión" (ver abajo) |
| `auth/auth.tsx` | `AuthProvider` y `useAuth()`: usuario, `signIn`, `signUp` (con correo opcional), `resetPassword` (código), `resetPasswordWithEmail` (enlace del correo), `signOut` y el aviso con el código que se muestra una vez |
| `auth/accounts.ts` | Sin React: reglas del nombre de usuario, email interno y llamadas de recuperación (crear código, guardar/leer correo, pedir el enlace por correo) |
| `auth/EmailResetScreen.tsx` | Pantalla que abre el enlace del correo (`/?recuperar=…&usuario=…`): contraseña nueva |
| `auth/LoginPage.tsx` + `auth/components/` | Entrar, crear cuenta (contraseña dos veces, correo opcional y consentimiento) y "He olvidado la contraseña" (con mi código / por correo) |
| `auth/RecoveryCodeScreen.tsx` | Pantalla "Guarda tu código de recuperación", tras registrarse o tras recuperar la contraseña |
| `auth/errors.ts` | Mensajes de error comprensibles y validación de contraseña nueva |
| `teams/api.ts` | `useMyTeams()` (RPC `my_teams`: equipos, rol y si estás pendiente), `useTeam()`, crear equipo y unirse con código |
| `teams/currentTeam.tsx` | `CurrentTeamProvider`: el equipo de la URL y tu rol en él. Si estás pendiente, muestra la espera. `useCurrentTeam()`, `useTeamPath()` (enlaces dentro del equipo) y `hasRole()` |
| `teams/TeamsPage.tsx`, `teams/AddTeamPage.tsx` | "Mis equipos" (cada tarjeta rellena con el color del equipo, y "Salir del equipo" para quien no es entrenador) y el "+" (tengo un código / crear equipo) |
| `teams/TeamHome.tsx` | `/equipos/:id` abre la primera sección que puedes ver |
| `account/AccountPage.tsx` | "Mi cuenta": código de recuperación nuevo, correo de recuperación, cambiar contraseña, cerrar sesión |
| `layout/AppShell.tsx` | Marco de todas las pantallas. PC (`lg`, desde 1024 px): barra lateral siempre visible. Móvil: cabecera con botón ☰ que abre el mismo menú, y pestañas abajo mientras hay un equipo abierto |
| `layout/components/TeamsMenu.tsx` | El menú: "Mis equipos" con el "+" y tus equipos, cada uno sobre su color. En PC, bajo el equipo abierto, sus secciones; en el móvil (`MobileDrawer`) no, porque ya están en las pestañas de abajo |
| `layout/components/MobileHeader.tsx` | Cabecera del móvil: ☰ y el nombre del equipo sobre su color; los dos abren el menú para cambiar de equipo |
| `layout/teamMenu.ts` | `useOpenTeam()` (equipo de la URL) y `useTeamMenu()` (secciones según módulos activos y rol) |
| `modules/types.ts` | `ModuleDefinition`: el contrato que cumple cada módulo. Las rutas y el menú van **relativos al equipo** (`partidos`, `partidos/:matchId`…) |
| `modules/registry.ts` | Lista de módulos de la app. Añadir un módulo = añadirlo aquí |
| `modules/catalog.tsx` | `useModuleCatalog()`: la lista de módulos para pantallas que la necesitan (activar secciones) sin importar el registro, que crearía una importación circular |

## Sin conexión (fase 2)

| Fichero | Qué hace |
| --- | --- |
| `offline/db.ts` | Base de datos del móvil (IndexedDB con Dexie): caché guardada, partidos descargados, estado local (p. ej. por dónde va el modo partido) y la bandeja de salida. Se borra al cerrar sesión |
| `offline/persister.ts` | Guarda la caché de TanStack Query en esa base de datos: la app abre con lo último descargado aunque no haya red |
| `offline/outbox.ts` | **Bandeja de salida.** Cada cambio hecho en el móvil se escribe aquí al momento (una fila por cosa cambiada; un cambio nuevo sustituye al anterior) y se envía en orden cuando hay red: al arrancar y al volver la conexión. Si no hay red se reintenta después; si el servidor lo rechaza, se avisa y se descarta. Los módulos registran cómo se envía cada tipo (`registerOutboxHandler`) |
| `offline/prepare.ts` | Descarga automática al abrir la app con red (como mucho cada 10 min) y bajo demanda: ejecuta el `prepareOffline` de cada módulo que funciona sin red y apunta qué partidos quedan disponibles |
| `offline/online.ts`, `notices.ts` | Estado de la red y avisos flotantes (`notify`) |
| `offline/components/` | Franja "Sin conexión / N cambios pendientes", avisos y "Disponible sin conexión · hh:mm" con "Preparar para sin conexión" |

La app entera (HTML, JS, CSS) la guarda el service worker de la PWA, así que se abre en modo avión. La sesión de Supabase queda en `localStorage` y no se pierde sin red aunque el token haya caducado: se renueva al volver la conexión.

## Roles en cada equipo

El rol sale de `team_members` (no se puede cambiar desde la app). Cada pantalla de módulo pasa por `ModuleGuard`: solo se ve si el módulo está activo en el equipo y el rol llega al mínimo. Las páginas de staff comprueban además el rol por su cuenta, y la base de datos lo vuelve a comprobar con RLS.

## Recuperar la contraseña

1. Al crear la cuenta se genera un código (`XXXX-XXXX-XXXX`) que se enseña una sola vez. En la base de datos solo se guarda su hash.
2. "He olvidado la contraseña": usuario + código + contraseña nueva (RPC `reset_password_with_code`). Si es correcto, se entra y se muestra un código nuevo; el usado deja de servir.
3. Tras 5 intentos fallidos, el código se bloquea 15 minutos.
4. Sin código: "Por correo". Si la cuenta tiene correo de recuperación, la Edge Function `send-reset-email` manda un enlace de un solo uso válido 1 hora. La respuesta es la misma tenga o no correo, para que no se pueda averiguar quién lo tiene.
5. Último respaldo: el entrenador pone una contraseña temporal desde Ajustes → Miembros.

## Login sin email

Supabase Auth necesita un email, pero los jugadores no tienen por qué tenerlo. El nombre de usuario se convierte en un email interno (`lucia` → `lucia@voley.local`) que nunca recibe correos. Por eso en Supabase está desactivada la confirmación de email.

Al registrarse se envían `username` y `display_name` como metadatos. Un trigger del backend crea con ellos la fila en `profiles` (ver `backend/README.md`).

## Sesión y modo sin conexión

- `supabase-js` guarda la sesión en `localStorage`, así que abrir la app sin red mantiene la sesión.
- `signOut` intenta cerrar la sesión en el servidor. Si no hay red, la cierra al menos en el móvil.
