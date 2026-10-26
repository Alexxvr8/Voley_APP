// Chooses the libero and the court player they replace.
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { PlayerSelect } from '@/shared/ui/PlayerSelect'

interface LiberoCardProps {
  liberoId: string | undefined
  replacesId: string | undefined
  /** Players allowed to come in as libero (not already on court). */
  liberoCandidates: Player[]
  /** Players on court, any of whom the libero can replace. */
  onCourt: Player[]
  onChange: (changes: { liberoId?: string; liberoReplacesId?: string }) => void
}

export function LiberoCard({ liberoId, replacesId, liberoCandidates, onCourt, onChange }: LiberoCardProps) {
  return (
    <Card className="space-y-2">
      <p className="font-semibold">Líbero</p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label>
          <span className="mb-1 block text-slate-500">Entra</span>
          <PlayerSelect players={liberoCandidates} value={liberoId} onChange={(id) => onChange({ liberoId: id })} />
        </label>
        <label>
          <span className="mb-1 block text-slate-500">Por</span>
          <PlayerSelect players={onCourt} value={replacesId} onChange={(id) => onChange({ liberoReplacesId: id })} />
        </label>
      </div>
    </Card>
  )
}
