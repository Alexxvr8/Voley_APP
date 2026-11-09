// Link from a played match to its MVP vote (mvp module, linked by URL), with the vote's state.
import { Link } from 'react-router'
import type { Match, Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { playerName } from '@/shared/utils/format'

interface MvpLinkCardProps {
  match: Match
  players: Player[]
  /** Coach: also sees matches without a vote (to open it) and ties to resolve. */
  isCoach: boolean
  /** Link to the match's vote screen. */
  href: string
}

/** Title and button text for each state of the vote, or null when there is nothing to show. */
function describe(
  match: Match,
  players: Player[],
  isCoach: boolean,
): { title: string; action: string } | null {
  switch (match.mvpStatus) {
    case 'open':
      return { title: 'Votación MVP abierta', action: 'Ir a votar' }
    case 'tie_pending':
      return isCoach
        ? { title: 'MVP: hay empate', action: 'Resolver empate' }
        : { title: 'MVP: resultado pendiente', action: 'Ver' }
    case 'finished': {
      const names = match.mvpWinners.flatMap((id) => {
        const player = players.find((candidate) => candidate.id === id)
        return player ? [playerName(player)] : []
      })
      return {
        title: names.length ? `MVP: ★ ${names.join(' y ')}` : 'Sin MVP (nadie votó)',
        action: 'Ver',
      }
    }
    default:
      return isCoach ? { title: 'Sin votación MVP', action: 'Abrir votación' } : null
  }
}

export function MvpLinkCard({ match, players, isCoach, href }: MvpLinkCardProps) {
  const state = describe(match, players, isCoach)
  if (!state) return null
  return (
    <Card className="flex items-center justify-between gap-3">
      <p className="min-w-0 font-semibold text-slate-900">{state.title}</p>
      <Link
        to={href}
        className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
      >
        {state.action}
      </Link>
    </Card>
  )
}
