// App root: auth gate, then the router. Every screen shares the shell with the teams menu.
// Inside `/equipos/:teamId`: the screens of the team's enabled modules allowed for the user's role.
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  type RouteObject,
} from 'react-router'
import { AccountPage } from '@/core/account/AccountPage'
import { AuthProvider, useAuth } from '@/core/auth/auth'
import { LoginPage } from '@/core/auth/LoginPage'
import { RecoveryCodeScreen } from '@/core/auth/RecoveryCodeScreen'
import { AppShell } from '@/core/layout/AppShell'
import { modules } from '@/core/modules/registry'
import type { ModuleDefinition } from '@/core/modules/types'
import { queryClient } from '@/core/query/queryClient'
import { AddTeamPage } from '@/core/teams/AddTeamPage'
import { CurrentTeamProvider, hasRole, useCurrentTeam } from '@/core/teams/currentTeam'
import { TeamsPage } from '@/core/teams/TeamsPage'
import { PageMessage } from '@/shared/ui/PageMessage'

/** Renders a module screen only if the module is enabled for the team and the role is allowed. */
function ModuleGuard({ module, children }: { module: ModuleDefinition; children: ReactNode }) {
  const { team, role } = useCurrentTeam()
  if (!team.enabledModules.includes(module.id) || !hasRole(role, module.minRole)) {
    return <PageMessage>No tienes acceso a esta sección.</PageMessage>
  }
  return children
}

const moduleRoutes: RouteObject[] = modules.flatMap((module) =>
  module.routes.map(({ path, component: Screen }) => ({
    path,
    element: (
      <ModuleGuard module={module}>
        <Screen />
      </ModuleGuard>
    ),
  })),
)

const notFound = { path: '*', element: <PageMessage>Página no encontrada.</PageMessage> }

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <TeamsPage /> },
      { path: '/equipos/nuevo', element: <AddTeamPage /> },
      { path: '/cuenta', element: <AccountPage /> },
      {
        path: '/equipos/:teamId',
        element: (
          <CurrentTeamProvider>
            <Outlet />
          </CurrentTeamProvider>
        ),
        children: [
          { index: true, element: <Navigate to="partidos" replace /> },
          ...moduleRoutes,
          notFound,
        ],
      },
      notFound,
    ],
  },
])

/** Shows the login screen until there is a session; the stored session is restored offline too. */
function AuthGate() {
  const { user, recoveryNotice } = useAuth()
  if (user === undefined || recoveryNotice === 'issuing') return null
  if (recoveryNotice) return <RecoveryCodeScreen code={recoveryNotice.code} />
  if (!user) return <LoginPage />
  return <RouterProvider router={router} />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  )
}
