// "+" screen: create a new team or join one with a code.
import { useState } from 'react'
import { Link } from 'react-router'
import { Card } from '@/shared/ui/Card'
import { CreateTeamForm } from './components/CreateTeamForm'
import { JoinTeamForm } from './components/JoinTeamForm'

type Mode = 'join' | 'create'

const TABS: [Mode, string][] = [
  ['join', 'Tengo un código'],
  ['create', 'Crear equipo'],
]

export function AddTeamPage() {
  const [mode, setMode] = useState<Mode>('join')

  return (
    <section className="mx-auto max-w-md space-y-4">
      <Link to="/" className="text-sm font-medium text-blue-800">
        ← Mis equipos
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Añadir equipo</h1>

      <div className="flex rounded-full bg-slate-200 p-1 text-sm font-semibold" role="tablist">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={`flex-1 rounded-full py-2.5 ${mode === value ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>{mode === 'join' ? <JoinTeamForm /> : <CreateTeamForm />}</Card>
    </section>
  )
}
