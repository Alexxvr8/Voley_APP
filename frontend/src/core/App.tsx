// App root: auth gate, then the router. Every screen shares the shell with the teams menu.
// Inside `/equipos/:teamId`: the screens of the team's enabled modules allowed for the user's role.
import { useState, type ReactNode } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createBrowserRouter, Outlet, RouterProvider, type RouteObject } from 'react-router'
import { AccountPage } from '@/core/account/AccountPage'
import { AuthProvider, useAuth } from '@/core/auth/auth'
import { EmailResetScreen } from '@/core/auth/EmailResetScreen'
import { LoginPage } from '@/core/auth/LoginPage'
import { RecoveryCodeScreen } from '@/core/auth/RecoveryCodeScreen'
import { AppShell } from '@/core/layout/AppShell'
import { ModuleCatalogContext } from '@/core/modules/catalog'
import { modules } from '@/core/modules/registry'
import type { ModuleDefinition } from '@/core/modules/types'
import { setOfflineModules } from '@/core/offline/prepare'
import { startOutbox } from '@/core/offline/outbox'
import { PERSIST_MAX_AGE, queryPersister } from '@/core/offline/persister'
import { queryClient } from '@/core/query/queryClient'
import { AddTeamPage } from '@/core/teams/AddTeamPage'
import { CurrentTeamProvider, hasRole, useCurrentTeam } from '@/core/teams/currentTeam'
import { TeamHome } from '@/core/teams/TeamHome'
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

setOfflineModules(modules)
startOutbox()

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
        children: [{ index: true, element: <TeamHome /> }, ...moduleRoutes, notFound],
      },
      notFound,
    ],
  },
])

/** Token and username of a reset email link opened in the browser, if any. */
function readEmailResetLink(): { token: string; username: string } | null {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('recuperar')
  const username = params.get('usuario')
  return token && username ? { token, username } : null
}

/** Shows the login screen until there is a session; the stored session is restored offline too. */
function AuthGate() {
  const { user, recoveryNotice } = useAuth()
  const [emailReset, setEmailReset] = useState(readEmailResetLink)

  function leaveEmailReset() {
    window.history.replaceState(null, '', '/')
    setEmailReset(null)
  }

  if (emailReset) {
    return <EmailResetScreen {...emailReset} onDone={leaveEmailReset} />
  }
  if (user === undefined || recoveryNotice === 'issuing') return null
  if (recoveryNotice) return <RecoveryCodeScreen code={recoveryNotice.code} />
  if (!user) return <LoginPage />
  return <RouterProvider router={router} />
}

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      // Only data is kept on the device; changes made offline live in the outbox (core/offline/outbox).
      persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE }}
    >
      <ModuleCatalogContext.Provider value={modules}>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ModuleCatalogContext.Provider>
    </PersistQueryClientProvider>
  )
}
