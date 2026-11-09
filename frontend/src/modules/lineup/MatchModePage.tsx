// Match mode: what the coach looks at during the match. Big court of the current set and rotation,
// liberos, planned substitutions, and moving on to the next set. Works offline: it uses the data kept
// on the device, plan changes go through the offline queue and the progress is stored locally.
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { OfflineStatus } from '@/core/offline/components/OfflineStatus'
import { loadLocalState, saveLocalState } from '@/core/offline/db'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import { asCalledUp } from '@/shared/domain/callups'
import { SYSTEM_LABELS } from '@/shared/domain/labels'
import type { GameSystem, Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { PageMessage } from '@/shared/ui/PageMessage'
import { QueryProblemMessage } from '@/shared/ui/QueryProblemMessage'
import { queriesProblem } from '@/core/query/status'
import { savePlan, useCallups, useMatches, usePlayers, useSetPlans } from './api'
import { LiveCourt } from './components/LiveCourt'
import { LiveSubsCard } from './components/LiveSubsCard'
import { SetTabs } from './components/SetTabs'
import { SystemPicker } from './components/SystemPicker'
import {
  advanceSub,
  hasStarted,
  INITIAL_MATCH_MODE,
  liveLineup,
  NO_PROGRESS,
  readProgress,
  roleSteps,
  undoSub,
  type MatchModeState,
  type SetProgress,
} from './matchMode'
import { setNumbersFor } from '@/shared/domain/results'
import { newSetPlan, withSystem, type SetPlans } from './setPlan'
import { rotatePlayers, rotationAfter, zoneRolesAfter } from './systems'
import { shortName } from '@/shared/utils/format'

/** Progress of the match mode for a match, loaded from and saved to the device. */
function useMatchModeState(matchId: string) {
  const key = `match-mode:${matchId}`
  const [state, setState] = useState<MatchModeState | null>(null)

  useEffect(() => {
    loadLocalState<MatchModeState>(key).then((saved) => setState(saved ?? INITIAL_MATCH_MODE))
  }, [key])

  function update(next: MatchModeState) {
    setState(next)
    saveLocalState(key, next)
  }

  return [state, update] as const
}

export function MatchModePage() {
  const { matchId = '' } = useParams()
  const { team, role } = useCurrentTeam()
  const teamPath = useTeamPath()
  const matches = useMatches(team.id)
  const players = usePlayers(team.id)
  const callups = useCallups(matchId)
  const setPlans = useSetPlans(matchId)
  const [state, setState] = useMatchModeState(matchId)

  if (!hasRole(role, 'assistant'))
    return <PageMessage>No tienes acceso a esta sección.</PageMessage>
  const problem = queriesProblem(matches, players, callups, setPlans)
  if (problem || !matches.data || !players.data || !callups.data || !setPlans.data || !state) {
    return <QueryProblemMessage problem={problem ?? 'loading'} />
  }
  const match = matches.data.find((m) => m.id === matchId)
  if (!match) return <PageMessage>Partido no encontrado.</PageMessage>

  // Players as they play this match (per-match number and positions), by id.
  const playersById = new Map<string, Player>(
    callups.data.flatMap((callup) => {
      const player = players.data.find((p) => p.id === callup.playerId)
      return player ? [[player.id, asCalledUp(player, callup)] as const] : []
    }),
  )
  const plans = Object.fromEntries(
    Object.entries(setPlans.data).map(([setNumber, saved]) => [setNumber, saved!.plan]),
  ) as SetPlans
  const set = state.currentSet
  const plan = plans[set] ?? newSetPlan(plans[set - 1], team.defaultSystem)
  const progress: SetProgress = readProgress(state.sets[set])
  const started = hasStarted(progress)

  const lineup = liveLineup(plan, progress)
  // A double switch in effect moves the setter role to the opposite's zone (R4 → R1).
  const roles = zoneRolesAfter(plan.system, plan.startRotation, roleSteps(plan, progress))
  const rotationNumber = rotationAfter(plan.system, plan.startRotation, roleSteps(plan, progress))
  const liberos = plan.liberos.flatMap((id) =>
    id && playersById.get(id) ? [playersById.get(id)!] : [],
  )

  function setProgress(next: SetProgress) {
    setState({ ...state!, sets: { ...state!.sets, [set]: next } })
  }

  function changeSystem(system: GameSystem) {
    savePlan(match!.id, set, withSystem(plan, system, [...playersById.values()]))
  }

  function changeStartRotation(rotationNumber: number) {
    // Players move with the rotation, so each one keeps the role they were placed in.
    const rotation = rotatePlayers(plan.system, plan.rotation, plan.startRotation, rotationNumber)
    savePlan(match!.id, set, { ...plan, startRotation: rotationNumber, rotation })
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link to={teamPath(`partidos/${match.id}`)} className="text-sm font-medium text-blue-800">
          ← Partido
        </Link>
        <Link
          to={`${teamPath(`partidos/${match.id}/rotacion`)}?set=${set}`}
          className="text-sm font-medium text-blue-800 underline"
        >
          Editar plan del set {set}
        </Link>
      </div>
      <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Partido vs {match.opponent}</h1>

      <SetTabs
        setNumbers={setNumbersFor(match.setsFormat)}
        currentSet={set}
        plans={plans}
        onSelect={(currentSet) => setState({ ...state, currentSet })}
      />

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-black text-slate-900">
            Set {set}
            {rotationNumber !== null && <span className="text-blue-800"> · R{rotationNumber}</span>}
          </p>
          <p className="text-sm text-slate-500">Sistema {SYSTEM_LABELS[plan.system]}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setProgress({ ...progress, steps: progress.steps - 1 })}
            disabled={progress.steps === 0}
            className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            ⟲ Atrás
          </button>
          <button
            type="button"
            onClick={() => setProgress({ ...progress, steps: progress.steps + 1 })}
            className="rounded-xl bg-blue-800 px-5 py-3 text-base font-bold text-white hover:bg-blue-900"
          >
            ⟳ Rotar
          </button>
        </div>
      </div>

      <LiveCourt lineup={lineup} roles={roles} playersById={playersById} />

      {liberos.length > 0 && (
        <p className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
          Líbero: {liberos.map((p) => `${p.number ?? '–'} ${shortName(p)}`).join(' · ')}
        </p>
      )}

      <LiveSubsCard
        subs={plan.subs}
        stepsDone={progress.subSteps}
        playersById={playersById}
        onAdvance={(index) => setProgress(advanceSub(progress, plan, index))}
        onUndo={(index) => setProgress(undoSub(progress, index))}
      />

      {!started && (
        <Card className="space-y-2">
          <p className="font-semibold">Antes de empezar el set {set}</p>
          <SystemPicker
            system={plan.system}
            onSystemChange={changeSystem}
            startRotation={plan.startRotation}
            onStartRotationChange={changeStartRotation}
            copyableSets={[]}
            onCopyFrom={() => {}}
          />
        </Card>
      )}

      {set < setNumbersFor(match.setsFormat).length && (
        <button
          type="button"
          onClick={() => setState({ ...state, currentSet: set + 1 })}
          className="w-full rounded-xl bg-slate-900 py-3 text-base font-semibold text-white"
        >
          Terminar set {set} → Set {set + 1}
        </button>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <OfflineStatus teamId={team.id} matchId={match.id} />
        <button
          type="button"
          onClick={() => setProgress(NO_PROGRESS)}
          disabled={!started}
          className="text-xs font-medium text-slate-500 underline disabled:opacity-40"
        >
          Reiniciar este set
        </button>
      </div>
    </section>
  )
}
