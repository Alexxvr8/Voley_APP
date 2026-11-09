// Options as tappable buttons instead of a dropdown: one tap to choose, all choices visible.
// Used for warm-up, venue, match format, home/away and similar short lists.

export interface Choice<T extends string | number> {
  value: T
  label: string
}

interface ChoiceChipsProps<T extends string | number> {
  /** Accessible name of the group, e.g. "Calentamiento". */
  label: string
  choices: Choice<T>[]
  /** Chosen value; null when nothing is chosen. */
  value: T | null
  onChange: (value: T) => void
  /** Equal-width columns (e.g. 2 for Local / Visitante); without it, buttons wrap to their text. */
  columns?: 2 | 3 | 4 | 5
}

const COLUMN_CLASSES = {
  2: 'grid grid-cols-2',
  3: 'grid grid-cols-3',
  4: 'grid grid-cols-2 sm:grid-cols-4',
  5: 'grid grid-cols-5',
}

export function ChoiceChips<T extends string | number>({
  label,
  choices,
  value,
  onChange,
  columns,
}: ChoiceChipsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`gap-2 ${columns ? COLUMN_CLASSES[columns] : 'flex flex-wrap'}`}
    >
      {choices.map((choice) => {
        const on = choice.value === value
        return (
          <button
            key={String(choice.value)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(choice.value)}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${columns ? 'px-1' : 'px-3.5'} ${
              on
                ? 'bg-blue-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-900'
            }`}
          >
            {choice.label}
          </button>
        )
      })}
    </div>
  )
}
