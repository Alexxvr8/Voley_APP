// "Tengo un código": joins the team that owns the code.
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { useJoinTeam } from '../api'

export function JoinTeamForm() {
  const joinTeam = useJoinTeam()
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    joinTeam.mutate(code, { onSuccess: () => navigate('/') })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Escribe el código que te ha dado tu entrenador. Si entras como jugador, el entrenador tendrá
        que aceptarte antes de que veas el equipo.
      </p>
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Código del equipo</span>
        <input
          className={`${INPUT_CLASS} font-mono uppercase tracking-widest`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD2345"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </label>
      {joinTeam.isError && (
        <p role="alert" className={ERROR_CLASS}>
          Ese código no existe o ya no está activo. Revísalo con tu entrenador.
        </p>
      )}
      <button type="submit" disabled={joinTeam.isPending} className={PRIMARY_BUTTON_CLASS}>
        {joinTeam.isPending ? 'Un momento…' : 'Entrar en el equipo'}
      </button>
    </form>
  )
}
