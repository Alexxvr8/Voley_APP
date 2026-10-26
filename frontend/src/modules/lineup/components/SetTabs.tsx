// Tabs to switch between sets 1–5. A dot marks other sets that already have a plan.
import { SET_NUMBERS, type SetPlans } from '../setPlan'

interface SetTabsProps {
  currentSet: number
  plans: SetPlans
  onSelect: (setNumber: number) => void
}

export function SetTabs({ currentSet, plans, onSelect }: SetTabsProps) {
  return (
    <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-200 p-1">
      {SET_NUMBERS.map((setNumber) => {
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
