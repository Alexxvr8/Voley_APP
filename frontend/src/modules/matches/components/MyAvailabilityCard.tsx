// Player view: answer "¿Puedes venir?" in one tap, add an optional note and see whether you are
// called up.
import { useState } from 'react'
import type { AvailabilityEntry, AvailabilityStatus } from '@/shared/domain/types'
import { AvailabilityButtons } from '@/shared/ui/AvailabilityButtons'
import { Card } from '@/shared/ui/Card'

interface MyAvailabilityCardProps {
  answer: AvailabilityEntry | undefined
  isCalledUp: boolean
  /** `comment` is only passed when the note changes. */
  onChange: (status: AvailabilityStatus, comment?: string) => void
}

export function MyAvailabilityCard({ answer, isCalledUp, onChange }: MyAvailabilityCardProps) {
  const [comment, setComment] = useState(answer?.comment ?? '')

  function saveComment() {
    if (answer && comment.trim() !== (answer.comment ?? '')) onChange(answer.status, comment.trim())
  }

  return (
    <Card className="space-y-3">
      <p className="font-semibold">¿Puedes venir?</p>
      <AvailabilityButtons value={answer?.status} onChange={(status) => onChange(status)} />
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={saveComment}
        disabled={!answer}
        maxLength={140}
        placeholder={answer ? 'Comentario (opcional): "depende de un examen"…' : 'Responde primero'}
        aria-label="Comentario para el entrenador"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-50"
      />
      <p className={`text-sm ${isCalledUp ? 'text-emerald-700' : 'text-slate-500'}`}>
        {isCalledUp ? '✓ Estás convocada/o' : 'Aún no estás en la convocatoria'}
      </p>
    </Card>
  )
}
