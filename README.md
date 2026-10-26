# Voley APP

PWA para gestionar equipos de voleibol: plantilla, partidos, disponibilidad, convocatorias y plan de rotaciones por set. Funciona sin conexión en el pabellón.

La especificación funcional completa está en [`docs/SPEC.md`](docs/SPEC.md).

## Estructura del repositorio

```
Voley_APP/
├── frontend/        La app que se ve en el móvil (React + Vite, PWA)
├── backend/         Base de datos, permisos y lógica de servidor (Supabase)
├── docs/SPEC.md     Qué hace la app y por qué (fuente de verdad)
├── CLAUDE.md        Reglas del proyecto para el asistente de código
└── package.json     Atajos para lanzar el frontend desde la raíz
```

| Parte | Qué contiene | Documentación |
| --- | --- | --- |
| Frontend | Pantallas, navegación, login, módulos | [`frontend/README.md`](frontend/README.md) |
| Backend | Tablas, permisos por fila (RLS), funciones RPC, migraciones | [`backend/README.md`](backend/README.md) |

**Cómo se hablan:** el frontend usa la librería `@supabase/supabase-js` para llamar directamente a Supabase. No hay servidor propio en medio. La seguridad la garantiza la base de datos con RLS: cada consulta se filtra según quién ha iniciado sesión y qué rol tiene en cada equipo.

## Empezar

Requisitos: Node 20 o superior.

```bash
npm install          # instala también las dependencias de frontend/
cp frontend/.env.example frontend/.env.local   # y rellena las claves de Supabase
npm run dev          # http://localhost:5173
```

| Comando (desde la raíz) | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Comprueba los tipos y genera el build de producción en `frontend/dist` |
| `npm run preview` | Sirve el build para probar la PWA y el modo sin conexión |

## Estado

Fase 0 (base): backend creado y login funcionando. Las pantallas aún usan datos de ejemplo; en la fase 1 pasarán a leer de Supabase.
