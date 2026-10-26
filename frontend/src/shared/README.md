# shared/

Piezas reutilizables que cualquier módulo puede usar. No dependen de `core/` ni de ningún módulo.

| Carpeta | Qué contiene |
| --- | --- |
| `domain/types.ts` | Tipos del dominio: `Player`, `Match`, `Position`, `GameSystem`… Los valores coinciden con los de la base de datos |
| `domain/labels.ts` | Traducción al español y colores de cada valor de dominio (`setter` → "Colocador") |
| `ui/` | Componentes visuales genéricos: `Card`, `PositionBadge`, `AvailabilityButtons`, `PlayerSelect` |
| `utils/format.ts` | Formato de fechas en español y nombres de jugador |
| `mock/` | **Provisional.** Datos de ejemplo y un almacén en memoria. Se borrará cuando las pantallas lean de Supabase (fase 1) |

## Cuándo algo va en `shared/`

- Lo usan, o lo van a usar, dos o más módulos.
- No sabe nada de rutas, sesión ni Supabase. Si lo necesita, va en `core/`.
