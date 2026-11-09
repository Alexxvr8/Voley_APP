// "¿Quién ha sido la MVP?": the voter picks 1 or 2 called-up players and saves (or changes) the vote.
// The page remounts it (key) when the saved vote changes, so the selection starts from it.
import { useState } from 'react'
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'
import { useCastVote } from '../api'
import { MAX_PICKS, samePick, togglePick } from '../mvp'
import { PlayerPickList } from './PlayerPickList'

interface VoteCardProps {
  teamId: string
  matchId: string
  /** Called-up players the voter can choose (never themselves). */
  candidates: Player[]
  /** What the voter already voted (empty if nothing yet). */
  myVote: string[]
  /** "Cierra en 23 h". */
  closesIn: string
}

export function VoteCard({ teamId, matchId, candidates, myVote, closesIn }: VoteCardProps) {
  const [picked, setPicked] = useState<string[]>(myVote)
  const castVote = useCastVote(teamId, matchId)
  const voted = myVote.length > 0
  const changed = !samePick(picked, myVote)

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">{voted ? 'Tu voto' : '¿Quién ha sido la MVP?'}</p>
        <p className="text-sm text-slate-500">
          Elige 1 o {MAX_PICKS} compañeras. El voto es secreto. {closesIn}.
        </p>
      </div>
      {candidates.length === 0 ? (
        <p className="text-sm text-slate-500">No hay convocadas a las que votar.</p>
      ) : (
        <PlayerPickList
          players={candidates}
          picked={picked}
          onToggle={(id) => setPicked((current) => togglePick(current, id))}
          disabled={castVote.isPending}
        />
      )}
      {castVote.isError && (
        <p className={ERROR_CLASS}>No se ha podido guardar el voto. Puede que ya esté cerrado.</p>
      )}
      {voted && !changed && (
        <p className="text-sm font-medium text-emerald-700">
          ✓ Voto guardado. Puedes cambiarlo mientras esté abierto.
        </p>
      )}
      {(changed || !voted) && (
        <button
          type="button"
          disabled={picked.length === 0 || castVote.isPending}
          onClick={() => castVote.mutate(picked)}
          className={`w-full ${PRIMARY_BUTTON_CLASS}`}
        >
          {castVote.isPending ? 'Guardando…' : voted ? 'Cambiar voto' : 'Votar'}
        </button>
      )}
    </Card>
  )
}
