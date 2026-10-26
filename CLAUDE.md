# Voley APP

PWA para gestionar equipos de voleibol (plantilla, partidos, disponibilidad, convocatorias y plan de rotaciones por set), usable sin conexión en el pabellón.

**La referencia funcional y técnica es `docs/SPEC.md`.** Ante cualquier duda de alcance, modelo de datos, roles o fases, manda el SPEC. Si una decisión lo contradice o lo amplía, actualiza también su "Registro de decisiones".

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- vite-plugin-pwa (Workbox) para instalación y service worker
- Supabase (Auth + Postgres + RLS), proyecto `voley-app` en la organización Alexxvr8 (ref `djjeodajgsfvcisrrkzk`). Migraciones en `backend/supabase/migrations/`; cada cambio de esquema va en un archivo nuevo (nunca se edita uno aplicado) y se aplica al proyecto. Variables en `frontend/.env.local` (plantilla en `frontend/.env.example`).
- Previsto en fases siguientes (ver SPEC): TanStack Query, Dexie (IndexedDB), hosting en Vercel

Todo debe funcionar en planes gratuitos.

## Estructura

Frontend y backend van separados:

```
frontend/              # PWA (React + Vite). Its own package.json
  src/
    core/              # app shell, module registry, auth/session, supabase client, offline sync, layout
    modules/<module>/  # one folder per feature module (teams, roster, matches, results, lineup)
    shared/            # reusable UI components, domain types/labels and utilities
backend/
  supabase/migrations/ # SQL schema, RLS policies and RPC functions
docs/SPEC.md
```

- Cada módulo vive en `frontend/src/modules/<module>/` y exporta su registro (`index.ts`) con el tipo `ModuleDefinition` de `frontend/src/core/modules/types.ts`: id, nombre visible, rutas, entrada de menú, rol mínimo y si funciona offline.
- Para añadir un módulo: crear su carpeta y añadirlo al array de `frontend/src/core/modules/registry.ts`. El núcleo solo lee ese registro y los ajustes del equipo (`enabled_modules`) para decidir qué mostrar.
- Un módulo no importa nada de otro módulo. Lo compartido va en `shared/` (UI/utilidades) o en `core/` (infraestructura).
- Dentro de un módulo, la página orquesta el estado y delega cada bloque visual en `components/`; tipos y lógica pura van en ficheros sin React.
- Alias de importación: `@/` apunta a `frontend/src/`.
- Login real con Supabase en `core/auth/`. Provisional hasta la fase 1: los datos de equipo siguen siendo de ejemplo (`shared/mock/`) y el rol se simula con el selector de `core/session/session.tsx`.

## Documentación

- Cada sección tiene su README en español: `README.md` (raíz), `frontend/README.md`, `frontend/src/{core,modules,shared}/README.md`, `backend/README.md`. Si cambias una sección, actualiza su README en el mismo cambio.
- Cada fichero de código empieza con un comentario de una o dos líneas que explica su propósito. Las props y funciones exportadas cuyo nombre no lo diga todo llevan `/** … */`.
- Prioriza la legibilidad: nombres descriptivos, funciones y componentes pequeños, nada de trucos ingeniosos.

## Convenciones

- **Idioma del código:** comentarios, docstrings, nombres de identificadores y mensajes de commit en inglés.
- **Idioma de la interfaz:** todo texto visible para el usuario en español.
- Valores de dominio fijos en inglés en código y base de datos (posiciones `setter`, `outside`, `middle`, `opposite`, `libero`; roles `coach`, `assistant`, `player`), con su etiqueta en español solo en la interfaz.
- Diseño móvil primero: los usuarios son jugadores jóvenes con poca soltura tecnológica; las acciones de jugador deben requerir dos toques como máximo.
- Offline: el plan por set y el modo partido deben funcionar sin red (ver "Requisito offline" del SPEC). Ten en cuenta esto al diseñar datos y estado desde el principio.

## Comandos

Desde la raíz o desde `frontend/`:

- `npm run dev`: servidor de desarrollo
- `npm run build`: comprobación de tipos y build de producción (debe pasar antes de cada commit)
- `npm run preview`: sirve el build, útil para probar la PWA y el service worker
