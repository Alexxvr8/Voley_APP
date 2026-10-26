// Game system and starting rotation (R1, R2…) selectors, plus "copy from set N" so the coach
// does not start every set from scratch.
import { SYSTEM_LABELS } from '@/shared/domain/labels'
import type { GameSystem } from '@/shared/domain/types'
import { availableRotations, SYSTEMS } from '../systems'

interface SystemPickerProps {
  system: GameSystem
  onSystemChange: (system: GameSystem) => void
  startRotation: number
  onStartRotationChange: (rotationNumber: number) => void
  /** Other sets that already have a plan and can be copied. The copy control hides when empty. */
  copyableSets: number[]
  onCopyFrom: (setNumber: number) => void
}

const SELECT_CLASS = 'rounded-lg border border-slate-300 bg-white px-2 py-2 font-medium'

export function SystemPicker({
  system,
  onSystemChange,
  startRotation,
  onStartRotationChange,
  copyableSets,
  onCopyFrom,
}: SystemPickerProps) {
  // Named by the setter's zone: R1–R6 in a 5-1, R2–R4 in a 4-2, none in a 6-0 (no setter).
  const rotationNumbers = availableRotations(system)

  return (
    <div className="flex items-end gap-2">
      <label className="min-w-0 flex-1 text-sm">
        <span className="mb-1 block text-slate-500">Sistema</span>
        <select
          value={system}
          onChange={(e) => onSystemChange(e.target.value as GameSystem)}
          className={`w-full ${SELECT_CLASS}`}
        >
          {SYSTEMS.map((option) => (
            <option key={option} value={option}>
              {SYSTEM_LABELS[option]}
            </option>
          ))}
        </select>
      </label>

      {rotationNumbers.length > 0 && (
        <label className="text-sm">
          <span className="mb-1 block text-slate-500">Rotación</span>
          <select
            value={startRotation}
            onChange={(e) => onStartRotationChange(Number(e.target.value))}
            className={SELECT_CLASS}
          >
            {rotationNumbers.map((rotationNumber) => (
              <option key={rotationNumber} value={rotationNumber}>
                R{rotationNumber}
              </option>
            ))}
          </select>
        </label>
      )}

      {copyableSets.length > 0 && (
        <label className="text-sm">
          <span className="mb-1 block text-slate-500">Copiar de</span>
          {/* Always shows "—": choosing a set copies it right away instead of keeping a selection. */}
          <select value="" onChange={(e) => onCopyFrom(Number(e.target.value))} className={SELECT_CLASS}>
            <option value="">—</option>
            {copyableSets.map((setNumber) => (
              <option key={setNumber} value={setNumber}>
                Set {setNumber}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
