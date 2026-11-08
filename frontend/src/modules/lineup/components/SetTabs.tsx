// Tabs to switch between the sets of the match (as many as its format allows). A dot marks other sets
// that already have a plan.
import type { SetPlans } from '../setPlan'

interface SetTabsProps {
  /** Set numbers of the match, from its format. */
  setNumbers: number[]
  currentSet: number
  plans: SetPlans
  onSelect: (setNumber: number) => void
}

export function SetTabs({ setNumbers, currentSet, plans, onSelect }: SetTabsProps) {
  if (setNumbers.length < 2) return null
  return (
    <div
      className="grid gap-1 rounded-xl bg-slate-200 p-1"
      style={{ gridTemplateColumns: `repeat(${setNumbers.length}, minmax(0, 1fr))` }}
    >
      {setNumbers.map((setNumber) => {
        const isCurrent = setNumber === currentSet
        const hasPlan = plans[setNumber] !== undefined
        return (
          <button
            key={setNumber}
            type="button"
            onClick={() => onSelect(setNumber)}
            className={`rounded-lg py-2 text-sm font-semibold ${
              isCurrent ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Set {setNumber}
            {hasPlan && !isCurrent ? ' •' : ''}
          </button>
        )
      })}
    </div>
  )
}
