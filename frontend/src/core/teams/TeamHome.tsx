// `/equipos/:teamId` opens the first section of the team the user can see (usually Partidos).
import { Navigate } from 'react-router'
import { useOpenTeam, useTeamMenu } from '@/core/layout/teamMenu'
import { PageMessage } from '@/shared/ui/PageMessage'

export function TeamHome() {
  const sections = useTeamMenu(useOpenTeam())
  if (sections.length === 0) return <PageMessage>Cargando…</PageMessage>
  return <Navigate to={sections[0].path} replace />
}
