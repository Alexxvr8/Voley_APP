# Voley APP

PWA para gestionar equipos de voleibol (plantilla, partidos, disponibilidad, convocatorias y plan de rotaciones por set), usable sin conexión en el pabellón.

**La referencia funcional y técnica es `docs/SPEC.md`.** Ante cualquier duda de alcance, modelo de datos, roles o fases, manda el SPEC. Si una decisión lo contradice o lo amplía, actualiza también su "Registro de decisiones".

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- vite-plugin-pwa (Workbox) para instalación y service worker
- Previsto en fases siguientes (ver SPEC): Supabase (Auth + Postgres + RLS), TanStack Query, Dexie (IndexedDB), hosting en Vercel

Todo debe funcionar en planes gratuitos.

## Estructura

```
src/
  core/              # app shell, module registry, auth/session, supabase client, offline sync, layout
  modules/<module>/  # one folder per feature module (teams, roster, matches, results, lineup)
  shared/            # reusable UI components and utilities
```

- Cada módulo vive en `src/modules/<module>/` y exporta su registro (`index.ts`) con el tipo `ModuleDefinition` de `src/core/modules/types.ts`: id, nombre visible, rutas, entrada de menú, rol mínimo y si funciona offline.
- Para añadir un módulo: crear su carpeta y añadirlo al array de `src/core/modules/registry.ts`. El núcleo solo lee ese registro y los ajustes del equipo (`enabled_modules`) para decidir qué mostrar.
- Un módulo no importa nada de otro módulo. Lo compartido va en `src/shared/` (UI/utilidades) o en `src/core/` (infraestructura).
- Alias de importación: `@/` apunta a `src/`.

## Convenciones

- **Idioma del código:** comentarios, docstrings, nombres de identificadores y mensajes de commit en inglés.
- **Idioma de la interfaz:** todo texto visible para el usuario en español.
- Valores de dominio fijos en inglés en código y base de datos (posiciones `setter`, `outside`, `middle`, `opposite`, `libero`; roles `coach`, `assistant`, `player`), con su etiqueta en español solo en la interfaz.
- Diseño móvil primero: los usuarios son jugadores jóvenes con poca soltura tecnológica; las acciones de jugador deben requerir dos toques como máximo.
- Offline: el plan por set y el modo partido deben funcionar sin red (ver "Requisito offline" del SPEC). Ten en cuenta esto al diseñar datos y estado desde el principio.

## Comandos

- `npm run dev`: servidor de desarrollo
- `npm run build`: comprobación de tipos y build de producción (debe pasar antes de cada commit)
- `npm run preview`: sirve el build, útil para probar la PWA y el service worker
