// Player view: answer "¿Puedes venir?" in one tap and see whether you are called up.
import type { AvailabilityStatus } from '@/shared/domain/types'
import { AvailabilityButtons } from '@/shared/ui/AvailabilityButtons'
import { Card } from '@/shared/ui/Card'

interface MyAvailabilityCardProps {
  status: AvailabilityStatus | undefined
  isCalledUp: boolean
  onChange: (status: AvailabilityStatus) => void
}

export function MyAvailabilityCard({ status, isCalledUp, onChange }: MyAvailabilityCardProps) {
  return (
    <Card className="space-y-3">
      <p className="font-semibold">¿Puedes venir?</p>
      <AvailabilityButtons value={status} onChange={onChange} />
      <p className={`text-sm ${isCalledUp ? 'text-emerald-700' : 'text-slate-500'}`}>
        {isCalledUp ? '✓ Estás convocada/o' : 'Convocatoria aún no publicada para ti'}
      </p>
    </Card>
  )
}
