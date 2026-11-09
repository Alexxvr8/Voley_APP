// Starting lineup editor: the six zones drawn as on court, each colored by the role the
// system and rotation expect there, plus two grey boxes below for the liberos. Each box shows the
// number big and the (nick)name below; tapping anywhere on it opens the phone's player list.
import { POSITION_COLORS, POSITION_LABELS, POSITION_SHORT_LABELS } from '@/shared/domain/labels'
import type { GameSystem, Player } from '@/shared/domain/types'
import { PlayerSelect } from '@/shared/ui/PlayerSelect'
import { shortName } from '@/shared/utils/format'
import { canPlay, type LiberoSlots } from '../setPlan'
import { COURT_ROWS, zoneRoles, type Zone } from '../systems'

interface CourtProps {
  system: GameSystem
  startRotation: number
  rotation: Partial<Record<Zone, string>>
  liberos: LiberoSlots
  /** Players that can be placed (the called-up ones). */
  candidates: Player[]
  /** When false, each box only offers players who can play its role. */
  showAll: boolean
  onAssign: (zone: Zone, playerId: string | undefined) => void
  onAssignLibero: (slot: 0 | 1, playerId: string | undefined) => void
}

/** The native list covers the whole box but is invisible: the box itself shows the choice. */
const SELECT_CLASS = 'absolute inset-0 h-full w-full cursor-pointer opacity-0'

/** Number and name of the chosen player, or a hint to choose one. */
function SlotContent({ player }: { player: Player | undefined }) {
  return (
    <span className="flex flex-col items-center rounded-lg bg-white/85 px-1 py-1 text-slate-900">
      <span className="text-xl leading-tight font-black">
        {player ? (player.number ?? '–') : '+'}
      </span>
      <span className="w-full truncate text-center text-xs font-semibold">
        {player ? shortName(player) : 'Elegir'}
      </span>
    </span>
  )
}
const LIBERO_SLOTS = [0, 1] as const

export function Court({
  system,
  startRotation,
  rotation,
  liberos,
  candidates,
  showAll,
  onAssign,
  onAssignLibero,
}: CourtProps) {
  const roles = zoneRoles(system, startRotation)
  const byId = (playerId: string | undefined) =>
    playerId ? candidates.find((player) => player.id === playerId) : undefined

  /** Ids already used anywhere in the lineup (zones and libero boxes). */
  const usedIds = new Set([...Object.values(rotation), ...liberos].filter(Boolean))

  /** Players a box can offer: its current one, anyone not used yet and, unless showAll, fit for the role. */
  function optionsFor(currentId: string | undefined, fits: (player: Player) => boolean): Player[] {
    return candidates.filter(
      (player) => player.id === currentId || (!usedIds.has(player.id) && (showAll || fits(player))),
    )
  }

  // The libero boxes only appear if there is someone who can play libero (or "mostrar todos" is on).
  const hasLiberos = showAll || candidates.some((player) => canPlay(player, 'libero'))

  return (
    <div className="rounded-2xl bg-orange-200 p-2">
      <div className="mb-2 h-1.5 rounded-full bg-slate-800" title="Red" />
      <div className="grid grid-cols-3 gap-2">
        {COURT_ROWS.flat().map((zone) => {
          const role = roles[zone]
          return (
            <label
              key={zone}
              title={POSITION_LABELS[role]}
              className={`relative flex flex-col gap-1 rounded-xl p-1.5 ${POSITION_COLORS[role]}`}
            >
              <span className="text-[11px] font-semibold opacity-90">
                Z{zone} · {POSITION_SHORT_LABELS[role]}
              </span>
              <SlotContent player={byId(rotation[zone])} />
              <PlayerSelect
                players={optionsFor(rotation[zone], (player) => canPlay(player, role))}
                value={rotation[zone]}
                onChange={(playerId) => onAssign(zone, playerId)}
                className={SELECT_CLASS}
                placeholder="— Vacía —"
              />
            </label>
          )
        })}
      </div>

      {hasLiberos && (
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-orange-300 pt-2">
          {LIBERO_SLOTS.map((slot) => (
            <label
              key={slot}
              className="relative flex flex-col gap-1 rounded-xl bg-slate-400 p-1.5 text-white"
            >
              <span className="text-[11px] font-semibold opacity-90">LB {slot + 1}</span>
              <SlotContent player={byId(liberos[slot])} />
              <PlayerSelect
                players={optionsFor(liberos[slot], (player) => canPlay(player, 'libero'))}
                value={liberos[slot]}
                onChange={(playerId) => onAssignLibero(slot, playerId)}
                className={SELECT_CLASS}
                placeholder="— Vacía —"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
