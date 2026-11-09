# Voley APP

PWA para gestionar equipos de voleibol (plantilla, partidos, disponibilidad, convocatorias y plan de rotaciones por set), usable sin conexión en el pabellón.

**La referencia funcional y técnica es `docs/especificacion.md`.** Ante cualquier duda de alcance, modelo de datos, roles o fases, manda la especificación. Si una petición la contradice, avisa antes de hacerla; si una decisión la amplía o la cambia, actualiza también su "Registro de decisiones" con la fecha.

## Stack

- React + TypeScript 6 + Vite (TS 7 no es compatible aún con typescript-eslint)
- Tailwind CSS
- ESLint (flat config en `frontend/eslint.config.js`) y Prettier (`frontend/.prettierrc.json`: sin punto y coma, comillas simples, 100 columnas). Los Markdown no pasan por Prettier
- vite-plugin-pwa (Workbox) para instalación y service worker
- Supabase (Auth + Postgres + RLS), proyecto `voley-app` en la organización Alexxvr8 (ref `djjeodajgsfvcisrrkzk`). Migraciones en `backend/supabase/migrations/`; cada cambio de esquema va en un archivo nuevo (nunca se edita uno aplicado) y se aplica al proyecto. Variables en `frontend/.env.local` (plantilla en `frontend/.env.example`).
- TanStack Query para leer y cambiar datos de Supabase (un `api.ts` por módulo)
- Hosting en Vercel (`voley-app-gold.vercel.app`), despliegue automático al subir a `main`
- Dexie (IndexedDB) para lo que funciona sin conexión: caché guardada, partidos descargados y bandeja de salida (`frontend/src/core/offline/`)

Todo debe funcionar en planes gratuitos.

## Estructura

Frontend y backend van separados:

```
frontend/              # PWA (React + Vite). Its own package.json
  src/
    core/              # app shell and menu, module registry, auth, teams/current team, supabase and query clients
    modules/<module>/  # one folder per feature module (matches, roster, lineup, teams; later results, mvp)
    shared/            # reusable UI components, domain types/labels and utilities
backend/
  supabase/migrations/ # SQL schema, RLS policies and RPC functions
  supabase/functions/  # Edge Functions (send-reset-email, send-push)
docs/especificacion.md
```

- Cada módulo vive en `frontend/src/modules/<module>/` y exporta su registro (`index.ts`) con el tipo `ModuleDefinition` de `frontend/src/core/modules/types.ts`: id, nombre visible, rutas, entrada de menú, rol mínimo y si funciona offline. Rutas y menú son relativos al equipo (`partidos` → `/equipos/<id>/partidos`); para enlazar dentro del equipo usa `useTeamPath()`.
- Para añadir un módulo: crear su carpeta y añadirlo al array de `frontend/src/core/modules/registry.ts`. El núcleo solo lee ese registro y los ajustes del equipo (`enabled_modules`) para decidir qué mostrar.
- Un módulo no importa nada de otro módulo. Lo compartido va en `shared/` (UI/utilidades) o en `core/` (infraestructura).
- Dentro de un módulo, la página orquesta el estado y delega cada bloque visual en `components/`; tipos y lógica pura van en ficheros sin React.
- Alias de importación: `@/` apunta a `frontend/src/`.
- Cada usuario es independiente: se registra solo, ve la lista de sus equipos y en cada uno tiene el rol de `team_members` (sin selector). El equipo abierto y el rol salen de `useCurrentTeam()`. Las páginas de staff comprueban el rol con `hasRole()` y la base de datos lo vuelve a comprobar con RLS.
- Datos del servidor siempre con TanStack Query en el `api.ts` del módulo; las filas se convierten con `shared/domain/rows.ts`. Los cambios que el usuario espera ver al instante (disponibilidad, convocatoria) usan actualización optimista con vuelta atrás si falla.

## Documentación

- Cada sección tiene su README en español: `README.md` (raíz), `frontend/README.md`, `frontend/src/{core,modules,shared}/README.md`, `backend/README.md`. Si cambias una sección, actualiza su README en el mismo cambio.
- Cada fichero de código empieza con un comentario de una o dos líneas que explica su propósito. Las props y funciones exportadas cuyo nombre no lo diga todo llevan `/** … */`.
- Prioriza la legibilidad: nombres descriptivos, funciones y componentes pequeños, nada de trucos ingeniosos.

## Convenciones

- **Idioma del código:** comentarios, docstrings, nombres de identificadores y mensajes de commit en inglés.
- **Idioma de la interfaz:** todo texto visible para el usuario en español.
- Valores de dominio fijos en inglés en código y base de datos (posiciones `setter`, `outside`, `middle`, `opposite`, `libero`; roles `coach`, `assistant`, `player`), con su etiqueta en español solo en la interfaz.
- Horas siempre en 24 h con `shared/ui/TimeSelect` y fechas con `shared/ui/DatePicker` (nunca `<input type="time">` ni `<input type="date">`, que dependen del idioma y del móvil).
- Lógica pura nueva (cálculos, conversiones) con su test en `*.test.ts`.
- Diseño móvil primero: los usuarios son jugadores jóvenes con poca soltura tecnológica; las acciones de jugador deben requerir dos toques como máximo.
- También cómodo en PC (sobre todo para el entrenador): desde `lg` (1024 px) el marco usa barra lateral y las pantallas reparten el contenido en columnas con clases `lg:`. El móvil no cambia.
- Offline: solo la plantilla (lectura) y las rotaciones (plan por set y modo partido) funcionan sin red; todo lo demás requiere conexión (ver "Funciones online y offline" en la especificación). Un cambio que deba funcionar sin red va por la bandeja de salida (`enqueue` + `registerOutboxHandler` en `core/offline/outbox.ts`), nunca por mutaciones de TanStack Query; el módulo declara `prepareOffline` para descargar lo que necesita.

## Comandos

Desde la raíz o desde `frontend/`:

- `npm run dev`: servidor de desarrollo
- `npm run build`: comprobación de tipos y build de producción (debe pasar antes de cada commit)
- `npm test`: tests unitarios con Vitest (`*.test.ts` junto al código; deben pasar antes de cada commit)
- `npm run lint`: ESLint (sin errores antes de cada commit)
- `npm run format`: aplica Prettier; `npm run format:check` solo comprueba
- `npm run preview`: sirve el build, útil para probar la PWA y el service worker
