import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, type RouteObject } from 'react-router'
import { AppLayout } from '@/core/layout/AppLayout'
import { modules } from '@/core/modules/registry'
import type { ModuleDefinition } from '@/core/modules/types'
import { hasRole, SessionProvider, useSession } from '@/core/session/session'
import { team } from '@/shared/mock/data'

/** Renders a module screen only if the module is enabled for the team and the role is allowed. */
function ModuleGuard({ module, children }: { module: ModuleDefinition; children: ReactNode }) {
  const { role } = useSession()
  if (!team.enabledModules.includes(module.id) || !hasRole(role, module.minRole)) {
    return <p className="py-12 text-center text-slate-500">No tienes acceso a esta sección.</p>
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/partidos" replace /> },
      ...moduleRoutes,
      { path: '*', element: <p className="py-12 text-center text-slate-500">Página no encontrada.</p> },
    ],
  },
])

export function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  )
}
