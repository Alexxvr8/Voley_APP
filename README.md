# Voley APP

PWA para gestionar equipos de voleibol: plantilla, partidos, disponibilidad, convocatorias y plan de rotaciones por set. Funciona sin conexión en el pabellón.

La especificación funcional completa está en [`docs/especificacion.md`](docs/especificacion.md).

## Estructura del repositorio

```
Voley_APP/
├── frontend/        La app que se ve en el móvil (React + Vite, PWA)
├── backend/         Base de datos, permisos y lógica de servidor (Supabase)
├── docs/especificacion.md  Qué hace la app y por qué (fuente de verdad)
├── .github/workflows/  CI (lint, formato, tests, build) y la tarea que evita que Supabase se pause
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
| `npm test` | Tests unitarios (Vitest) |
| `npm run lint` | Revisa el código con ESLint |
| `npm run format` | Da formato al código con Prettier (`format:check` solo comprueba) |

## Estado

Fase 1 en curso. Ya funciona con datos reales:
- Registro con código de recuperación, recuperar la contraseña uno mismo y la lista de tus equipos.
- Crear equipo o unirse con código; los jugadores quedan pendientes hasta que el entrenador los acepta.
- Calendario mensual con partidos y entrenamientos, disponibilidad y convocatoria con dorsal y posición por partido.
- Plantilla con "compite / solo entrena".

El plan de rotación aún no se guarda en el servidor (fase 2).
