// First screen after signing in: the user's teams and the "+" to create or join one.
import { Link } from 'react-router'
import { PageMessage } from '@/shared/ui/PageMessage'
import { useMyTeams } from './api'
import { TeamCard } from './components/TeamCard'

export function TeamsPage() {
  const myTeams = useMyTeams()

  return (
    <section className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Mis equipos</h1>
        <Link
          to="/equipos/nuevo"
          aria-label="Añadir equipo"
          className="flex size-11 items-center justify-center rounded-full bg-blue-800 text-2xl font-bold text-white shadow hover:bg-blue-900"
        >
          +
        </Link>
      </div>

      {myTeams.isPending && <PageMessage>Cargando…</PageMessage>}
      {myTeams.isError && (
        <PageMessage>No se han podido cargar tus equipos. ¿Hay conexión?</PageMessage>
      )}
      {myTeams.data?.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <p className="font-semibold text-slate-900">Aún no estás en ningún equipo</p>
          <p className="mt-1 text-sm text-slate-500">
            Pulsa <strong>+</strong> para crear tu equipo o entrar con el código que te dé tu
            entrenador.
          </p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {myTeams.data?.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </section>
  )
}
