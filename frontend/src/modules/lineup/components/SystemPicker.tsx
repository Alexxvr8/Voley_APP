// Game system selector, plus "copy from set N" so the coach does not start every set from scratch.
import { SYSTEM_LABELS } from '@/shared/domain/labels'
import type { GameSystem } from '@/shared/domain/types'
import { SYSTEMS } from '../systems'

interface SystemPickerProps {
  system: GameSystem
  onSystemChange: (system: GameSystem) => void
  /** Other sets that already have a plan and can be copied. The copy control hides when empty. */
  copyableSets: number[]
  onCopyFrom: (setNumber: number) => void
}

const SELECT_CLASS = 'rounded-lg border border-slate-300 bg-white px-2 py-2 font-medium'

export function SystemPicker({ system, onSystemChange, copyableSets, onCopyFrom }: SystemPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="flex-1 text-sm">
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
