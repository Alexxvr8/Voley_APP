# shared/

Piezas reutilizables que cualquier módulo puede usar. No dependen de `core/` ni de ningún módulo.

| Fichero / carpeta | Qué contiene |
| --- | --- |
| `domain/types.ts` | Tipos del dominio: `Team`, `MyTeam`, `Player` (con `competes`), `Match`, `Callup`, `TrainingSlot`, `Position`, `GameSystem`, `TeamRole`… Los valores coinciden con los de la base de datos |
| `domain/rows.ts` | Convierte las filas de Supabase (`snake_case`) en esos tipos |
| `domain/callups.ts` | `asCalledUp()`: aplica el dorsal y las posiciones del partido a un jugador |
| `domain/results.ts` | Sets ganados y textos del resultado ("Ganado 3-1", "25-20 · 23-25…") |
| `domain/labels.ts` | Traducción al español y colores de cada valor de dominio (`setter` → "Colocador", roles, días de la semana) |
| `ui/` | Componentes genéricos: `Card`, `PositionBadge`, `AvailabilityButtons`, `PlayerSelect`, `ConfirmDialog` (doble comprobación), `MapEmbed` (mapa de Google incrustado, sin clave de API), `MatchHeader` (cabecera y pestañas del partido), `PageMessage`, y `form.ts` (clases de formularios) |
| `utils/format.ts` | Fechas en español, fecha de hoy, nombres y dorsales |
| `utils/calendar.ts` | Rejilla del mes (lunes primero) y entrenamientos de cada día, marcando los cancelados |
| `utils/maps.ts` | Enlaces de Google Maps: abrir, qué mostrar en el mapa incrustado (coordenadas, `q=` o nombre del sitio; con enlaces cortos, el nombre del pabellón) y validar que es de Maps |

## Cuándo algo va en `shared/`

- Lo usan, o lo van a usar, dos o más módulos.
- No sabe nada de rutas, sesión ni Supabase. Si lo necesita, va en `core/`.
