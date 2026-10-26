# modules/

Cada carpeta es una funcionalidad independiente que un equipo puede activar o desactivar (`teams.enabled_modules`).

| Módulo | Para qué sirve | Rol mínimo | Sin conexión |
| --- | --- | --- | --- |
| `matches/` | Próximos partidos, detalle, disponibilidad y convocatoria | Jugador | No |
| `roster/` | Plantilla del equipo | Segundo entrenador | No |
| `lineup/` | Plan por set: sistema, rotación, líbero y cambios. En la fase 2, modo partido | Segundo entrenador | Sí |

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
| `SetPlanPage.tsx` | Guarda el plan de cada set y calcula quién está en pista, en el banquillo y quién puede ser líbero |
| `setPlan.ts` | `SetPlan`, `PlannedSub`, `newSetPlan` (hereda el sistema del set anterior), `canPlay` |
| `systems.ts` | Orden de zonas en la pista y rol esperado por zona en cada sistema |
| `components/SetTabs.tsx` | Pestañas Set 1–5 |
| `components/SystemPicker.tsx` | Selector de sistema y "copiar de otro set" |
| `components/Court.tsx` | Pista con las 6 zonas; cada zona ofrece solo a quien puede jugar ese rol, salvo con "mostrar todos" |
| `components/LiberoCard.tsx` | Quién entra de líbero y por quién |
| `components/PlannedSubsCard.tsx` | Lista de cambios previstos y formulario para añadir |

## Ficheros del módulo `matches`

| Fichero | Qué hace |
| --- | --- |
| `MatchesPage.tsx` | Lista de próximos partidos. El jugador responde ahí mismo; el staff ve los recuentos |
| `MatchDetailPage.tsx` | Detalle del partido; muestra una vista u otra según el rol |
| `components/MatchInfoCard.tsx` | Horarios, pabellón (enlace a Maps), local o visitante, notas |
| `components/MyAvailabilityCard.tsx` | "¿Puedes venir?" para el jugador |
| `components/CallupList.tsx` | Lista de jugadores con su respuesta y la casilla para convocar |
