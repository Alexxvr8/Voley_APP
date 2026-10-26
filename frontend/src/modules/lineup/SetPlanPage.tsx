// "Preparar partido" screen: the coach plans each set (system, starting rotation, libero,
// planned substitutions). This component only holds the state; each card is its own component.
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { matches, players, team } from '@/shared/mock/data'
import { useMockStore } from '@/shared/mock/store'
import { Card } from '@/shared/ui/Card'
import { formatShortDate } from '@/shared/utils/format'
import { Court } from './components/Court'
import { LiberoCard } from './components/LiberoCard'
import { PlannedSubsCard } from './components/PlannedSubsCard'
import { SetTabs } from './components/SetTabs'
import { SystemPicker } from './components/SystemPicker'
import { canPlay, newSetPlan, playersOnCourt, SET_NUMBERS, type SetPlan, type SetPlans } from './setPlan'

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

  // Who is where, derived from the plan. Only called-up players can take part.
  const calledUp = players.filter((player) => (callups[match.id] ?? []).includes(player.id))
  const onCourtIds = playersOnCourt(plan)
  const onCourt = calledUp.filter((player) => onCourtIds.includes(player.id))
  const bench = calledUp.filter((player) => !onCourtIds.includes(player.id) && player.id !== plan.liberoId)
  const liberoCandidates = calledUp.filter(
    (player) => !onCourtIds.includes(player.id) && (showAll || canPlay(player, 'libero')),
  )
  const copyableSets = SET_NUMBERS.filter((setNumber) => setNumber !== currentSet && plans[setNumber])

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
          onSystemChange={(system) => updatePlan({ system })}
          copyableSets={copyableSets}
          onCopyFrom={copyPlanFrom}
        />
        <Court
          system={plan.system}
          rotation={plan.rotation}
          candidates={calledUp}
          showAll={showAll}
          onAssign={(zone, playerId) => updatePlan({ rotation: { ...plan.rotation, [zone]: playerId } })}
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

      <LiberoCard
        liberoId={plan.liberoId}
        replacesId={plan.liberoReplacesId}
        liberoCandidates={liberoCandidates}
        onCourt={onCourt}
        onChange={updatePlan}
      />

      <PlannedSubsCard
        subs={plan.subs}
        onCourt={onCourt}
        bench={bench}
        allPlayers={players}
        onChange={(subs) => updatePlan({ subs })}
      />
    </section>
  )
}
