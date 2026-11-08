// Every position a player can play, as tappable boxes. The first one checked is the main position.
import { POSITION_LABELS, POSITIONS } from '@/shared/domain/labels'
import { togglePosition } from '@/shared/domain/positions'
import type { Position } from '@/shared/domain/types'
import { LABEL_TEXT_CLASS } from './form'

interface PositionChecklistProps {
  /** Checked positions in order; the first is the main one. */
  value: Position[]
  onChange: (positions: Position[]) => void
  className?: string
}

export function PositionChecklist({ value, onChange, className = '' }: PositionChecklistProps) {
  return (
    <fieldset className={className}>
      <legend className={LABEL_TEXT_CLASS}>Posiciones</legend>
      <p className="text-xs text-slate-500">La primera que marques es la principal.</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {POSITIONS.map((position) => {
          const checked = value.includes(position)
          const isMain = value[0] === position
          return (
            <label
              key={position}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
                checked
                  ? 'bg-blue-50 text-blue-900 ring-2 ring-blue-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(togglePosition(value, position))}
                className="size-4 accent-blue-800"
              />
              <span className="flex-1">{POSITION_LABELS[position]}</span>
              {isMain && (
                <span className="rounded-full bg-blue-800 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  Principal
                </span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
