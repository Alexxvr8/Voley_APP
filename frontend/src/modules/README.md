# modules/

Cada carpeta es una funcionalidad independiente que un equipo puede activar o desactivar (`teams.enabled_modules`).

| Módulo | Para qué sirve | Rol mínimo | Sin conexión |
| --- | --- | --- | --- |
| `matches/` | Próximos partidos, detalle, disponibilidad y convocatoria | Jugador | No |
| `roster/` | Plantilla del equipo | Segundo entrenador | No |
| `lineup/` | Rotaciones por set: sistema, R inicial, alineación, líberos y cambios. En la fase 2, modo partido | Segundo entrenador | Sí |

Previstos: `teams/` (equipos y códigos de acceso) y `results/` (resultados y tabla).

## Anatomía de un módulo

```
modules/lineup/
├── index.ts            Registro del módulo (ModuleDefinition): id, nombre, rutas, menú, rol, offline
├── SetPlanPage.tsx     Página: lee los datos, guarda el estado y reparte el trabajo entre componentes
├── components/         Bloques visuales de la página, cada uno en su fichero
├── setPlan.ts          Tipos y funciones puras del módulo (sin React)
└── systems.ts          Constantes del dominio (zonas, sistemas)
```

No hace falta tener todas las piezas: un módulo pequeño puede ser solo `index.ts` y una página.

## Añadir un módulo

1. Crea `modules/<id>/` con su página.
2. Crea `modules/<id>/index.ts` exportando un `ModuleDefinition`. El `id` tiene que coincidir con el valor que se guarda en `teams.enabled_modules`.
3. Añádelo al array de `core/modules/registry.ts`.

## Regla de oro

Un módulo **no importa nada de otro módulo**. Si dos módulos necesitan lo mismo, va a `shared/` (UI, utilidades, tipos) o a `core/` (infraestructura).

## Ficheros del módulo `lineup`

| Fichero | Qué hace |
| --- | --- |
| `SetPlanPage.tsx` | Guarda el plan de cada set y calcula quién está en pista, en el banquillo y quién puede entrar por quién |
| `setPlan.ts` | `SetPlan`, `PlannedSub`, `newSetPlan` (hereda el sistema del set anterior), `canPlay`, `replacementPositions` (misma posición, o colocador ↔ opuesto) |
| `systems.ts` | Plantilla de roles por zona de cada sistema y cómo gira. La R es la zona del colocador que coloca (`availableRotations`: R1–R6 en 5-1, R2–R4 en 4-2, R1/R5/R6 en 6-2, ninguna en 6-0). `zoneRoles` da el rol de cada zona en una R y `rotatePlayers` mueve la alineación al cambiar de R |
| `components/SetTabs.tsx` | Pestañas Set 1–5 |
| `components/SystemPicker.tsx` | Selector de sistema, de rotación inicial (R1, R2…) y "copiar de otro set" |
| `components/Court.tsx` | Pista con las 6 zonas coloreadas según sistema y R, y dos casillas grises para líberos (solo si hay alguien que pueda jugar de líbero). Cada casilla ofrece solo a quien puede jugar ese rol, salvo con "mostrar todos" |
| `components/PlannedSubsCard.tsx` | Cambios previstos. Primero se elige quién sale; después solo se ofrecen jugadores de su posición (colocador y opuesto se pueden cruzar para cambiar de R) |

## Ficheros del módulo `matches`

| Fichero | Qué hace |
| --- | --- |
| `MatchesPage.tsx` | Lista de próximos partidos. El jugador responde ahí mismo; el staff ve los recuentos |
| `MatchDetailPage.tsx` | Detalle del partido; muestra una vista u otra según el rol |
| `components/MatchInfoCard.tsx` | Horarios, pabellón (enlace a Maps), local o visitante, notas |
| `components/MyAvailabilityCard.tsx` | "¿Puedes venir?" para el jugador |
| `components/CallupList.tsx` | Lista de jugadores con su respuesta y la casilla para convocar |
