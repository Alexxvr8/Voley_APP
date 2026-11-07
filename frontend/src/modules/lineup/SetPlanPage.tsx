// "Rotación" tab of a match: the coach plans each set (system, starting rotation, lineup,
// liberos, planned substitutions). This component only holds the state; each block is its own component.
// The plan is not saved yet: persistence and offline sync arrive in phase 2.
import { useState } from 'react'
import { useParams } from 'react-router'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import { asCalledUp } from '@/shared/domain/callups'
import type { GameSystem, Match, Player, Team } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { PageMessage } from '@/shared/ui/PageMessage'
import { MatchHeader } from '@/shared/ui/MatchHeader'
import { useCallups, useMatches, usePlayers } from './api'
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

/** "Rotación" tab of a match: loads the match and its call-ups, then hands them to the editor. */
export function SetPlanPage() {
  const { matchId = '' } = useParams()
  const { team, role } = useCurrentTeam()
  const matches = useMatches(team.id)
  const players = usePlayers(team.id)
  const callups = useCallups(matchId)

  if (!hasRole(role, 'assistant'))
    return <PageMessage>No tienes acceso a esta sección.</PageMessage>
  if (matches.isPending || players.isPending || callups.isPending) {
    return <PageMessage>Cargando…</PageMessage>
  }
  if (matches.isError || players.isError || callups.isError) {
    return <PageMessage>No se ha podido cargar. ¿Hay conexión?</PageMessage>
  }
  const match = matches.data.find((m) => m.id === matchId)
  if (!match) return <PageMessage>Partido no encontrado.</PageMessage>

  // Called-up players as they play this match (per-match number and position applied).
  const calledUp = callups.data.flatMap((callup) => {
    const player = players.data.find((p) => p.id === callup.playerId)
    return player ? [asCalledUp(player, callup)] : []
  })
  // Remounting per match resets the local plan when switching matches.
  return (
    <SetPlanEditor
      key={match.id}
      team={team}
      match={match}
      players={players.data}
      calledUp={calledUp}
    />
  )
}

interface SetPlanEditorProps {
  team: Team
  match: Match
  players: Player[]
  /** Called-up players: the only ones who can take part. */
  calledUp: Player[]
}

function SetPlanEditor({ team, match, players, calledUp }: SetPlanEditorProps) {
  const teamPath = useTeamPath()
  const [currentSet, setCurrentSet] = useState(1)
  const [plans, setPlans] = useState<SetPlans>({})
  const [showAll, setShowAll] = useState(false)

  const plan = plans[currentSet] ?? newSetPlan(plans[currentSet - 1], team.defaultSystem)
  const updatePlan = (changes: Partial<SetPlan>) =>
    setPlans({ ...plans, [currentSet]: { ...plan, ...changes } })
  const copyPlanFrom = (setNumber: number) =>
    setPlans({ ...plans, [currentSet]: structuredClone(plans[setNumber]) })

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

  // Who is where, derived from the plan.
  const onCourtIds = playersOnCourt(plan)
  const liberoIds = chosenLiberos(plan)
  const onCourt = calledUp.filter((player) => onCourtIds.includes(player.id))
  const bench = calledUp.filter(
    (player) => !onCourtIds.includes(player.id) && !liberoIds.includes(player.id),
  )
  const copyableSets = SET_NUMBERS.filter(
    (setNumber) => setNumber !== currentSet && plans[setNumber],
  )

  /** Bench players who can cover the position the outgoing player has in the lineup. */
  function substitutesFor(outId: string) {
    const role = roleOnCourt(plan, outId)
    if (!role) return []
    const allowed = replacementPositions(role)
    return bench.filter((player) => allowed.some((position) => canPlay(player, position)))
  }

  return (
    <section className="space-y-4">
      <MatchHeader
        match={match}
        backHref={teamPath('partidos')}
        matchPath={teamPath(`partidos/${match.id}`)}
        showStaffTabs
      />
      <div>
        <p className="text-sm text-slate-500">
          {calledUp.length} convocados · el plan aún no se guarda (llegará en la fase 2)
        </p>
        {calledUp.length === 0 && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Aún no hay convocados. Convócalos en la pestaña Gestión para colocarlos en la pista.
          </p>
        )}
      </div>

      <SetTabs currentSet={currentSet} plans={plans} onSelect={setCurrentSet} />

      {/* Wide screens: court on the left, planned substitutions beside it. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
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
            onAssign={(zone, playerId) =>
              updatePlan({ rotation: { ...plan.rotation, [zone]: playerId } })
            }
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
      </div>
    </section>
  )
}
