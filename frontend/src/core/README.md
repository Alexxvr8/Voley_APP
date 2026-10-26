# core/

Infraestructura que comparten todas las pantallas. Aquí no hay pantallas de funcionalidad, solo lo que las hace funcionar.

| Carpeta / fichero | Qué hace |
| --- | --- |
| `App.tsx` | Raíz de la app. Muestra el login si no hay sesión y, si la hay, monta el router con las rutas de todos los módulos |
| `supabase/client.ts` | Crea el cliente único de Supabase con las variables de entorno. La sesión se guarda en el móvil y se renueva sola |
| `auth/auth.tsx` | `AuthProvider` y `useAuth()`: usuario actual, `signIn`, `signUp`, `signOut` |
| `auth/LoginPage.tsx` | Pantalla de entrar / crear cuenta, con mensajes de error comprensibles |
| `session/session.tsx` | Rol del usuario en el equipo actual. **Provisional:** de momento es un selector simulado; en la fase 1 se leerá de `team_members` |
| `layout/AppLayout.tsx` | Cabecera, contenido y menú inferior. El menú se construye con los módulos visibles para el rol |
| `modules/types.ts` | `ModuleDefinition`: el contrato que cumple cada módulo |
| `modules/registry.ts` | Lista de módulos de la app. Añadir un módulo = añadirlo aquí |

## Login sin email

Supabase Auth necesita un email, pero los jugadores no tienen por qué tenerlo. El nombre de usuario se convierte en un email interno (`lucia` → `lucia@voley.local`) que nunca recibe correos. Por eso en Supabase está desactivada la confirmación de email.

Al registrarse se envían `username` y `display_name` como metadatos. Un trigger del backend crea con ellos la fila en `profiles` (ver `backend/README.md`).

## Sesión y modo sin conexión

- `supabase-js` guarda la sesión en `localStorage`, así que abrir la app sin red mantiene la sesión.
- `signOut` intenta cerrar la sesión en el servidor. Si no hay red, la cierra al menos en el móvil.
