// "Preparar partido" screen: the coach plans each set (system, starting rotation, lineup,
// liberos, planned substitutions). This component only holds the state; each block is its own component.
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import type { GameSystem } from '@/shared/domain/types'
import { matches, players, team } from '@/shared/mock/data'
import { useMockStore } from '@/shared/mock/store'
import { Card } from '@/shared/ui/Card'
import { formatShortDate } from '@/shared/utils/format'
import { Court } from './components/Court'
import { PlannedSubsCard } from './components/PlannedSubsCard'
import { SetTabs } from './components/SetTabs'
import { SystemPicker } from './components/SystemPicker'
import {
  canPlay,
  chosenLiberos,
  newSetPlan,
  playersOnCourt,
  replacementPositions,
  roleOnCourt,
  SET_NUMBERS,
  validStartRotation,
  type LiberoSlots,
  type SetPlan,
  type SetPlans,
} from './setPlan'
import { rotatePlayers } from './systems'

/** The match from the URL, or the next upcoming one when opened from the menu. */
function useSelectedMatch() {
  const { matchId } = useParams()
  if (matchId) return matches.find((match) => match.id === matchId)
  return [...matches].sort((a, b) => a.date.localeCompare(b.date))[0]
}

export function SetPlanPage() {
  const match = useSelectedMatch()
  const { callups } = useMockStore()

  const [currentSet, setCurrentSet] = useState(1)
  const [plans, setPlans] = useState<SetPlans>({})
  const [showAll, setShowAll] = useState(false)

  if (!match) return <p className="py-12 text-center text-slate-500">Partido no encontrado.</p>

  const plan = plans[currentSet] ?? newSetPlan(plans[currentSet - 1], team.defaultSystem)
  const updatePlan = (changes: Partial<SetPlan>) => setPlans({ ...plans, [currentSet]: { ...plan, ...changes } })
  const copyPlanFrom = (setNumber: number) => setPlans({ ...plans, [currentSet]: structuredClone(plans[setNumber]) })

  function changeSystem(system: GameSystem) {
    updatePlan({ system, startRotation: validStartRotation(system, plan.startRotation) })
  }

  function changeStartRotation(rotationNumber: number) {
    // Players move with the rotation, so each one keeps the role they were placed in.
    const rotation = rotatePlayers(plan.system, plan.rotation, plan.startRotation, rotationNumber)
    updatePlan({ startRotation: rotationNumber, rotation })
  }

  function assignLibero(slot: 0 | 1, playerId: string | undefined) {
    const liberos: LiberoSlots = [...plan.liberos]
    liberos[slot] = playerId
    updatePlan({ liberos })
  }

  // Who is where, derived from the plan. Only called-up players can take part.
  const calledUp = players.filter((player) => (callups[match.id] ?? []).includes(player.id))
  const onCourtIds = playersOnCourt(plan)
  const liberoIds = chosenLiberos(plan)
  const onCourt = calledUp.filter((player) => onCourtIds.includes(player.id))
  const bench = calledUp.filter((player) => !onCourtIds.includes(player.id) && !liberoIds.includes(player.id))
  const copyableSets = SET_NUMBERS.filter((setNumber) => setNumber !== currentSet && plans[setNumber])

  /** Bench players who can cover the position the outgoing player has in the lineup. */
  function substitutesFor(outId: string) {
    const role = roleOnCourt(plan, outId)
    if (!role) return []
    const allowed = replacementPositions(role)
    return bench.filter((player) => allowed.some((position) => canPlay(player, position)))
  }

  return (
    <section className="space-y-4">
      <div>
        <Link to={`/partidos/${match.id}`} className="text-sm font-medium text-blue-800">
          ← Partido
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Plan vs {match.opponent}</h1>
        <p className="text-sm capitalize text-slate-500">
          {formatShortDate(match.date)} · {calledUp.length} convocados
        </p>
      </div>

      <SetTabs currentSet={currentSet} plans={plans} onSelect={setCurrentSet} />

      <Card className="space-y-3">
        <SystemPicker
          system={plan.system}
          onSystemChange={changeSystem}
          startRotation={plan.startRotation}
          onStartRotationChange={changeStartRotation}
          copyableSets={copyableSets}
          onCopyFrom={copyPlanFrom}
        />
        <Court
          system={plan.system}
          startRotation={plan.startRotation}
          rotation={plan.rotation}
          liberos={plan.liberos}
          candidates={calledUp}
          showAll={showAll}
          onAssign={(zone, playerId) => updatePlan({ rotation: { ...plan.rotation, [zone]: playerId } })}
          onAssignLibero={assignLibero}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="size-4 accent-blue-800"
          />
          Mostrar todos los convocados en cada zona
        </label>
      </Card>

      <PlannedSubsCard
        subs={plan.subs}
        onCourt={onCourt}
        substitutesFor={substitutesFor}
        allPlayers={players}
        onChange={(subs) => updatePlan({ subs })}
      />
    </section>
  )
}
