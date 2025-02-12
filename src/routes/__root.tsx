import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { getDefaultStore } from 'jotai'

import { AppLink } from '#/components/app-link'
import { UIProvider } from '#/components/ui-provider'

export interface RootRouteContext {
  store: ReturnType<typeof getDefaultStore>
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: RootLayout,
})

export function RootLayout() {
  return (
    <UIProvider>
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-background">
          <div className="container flex h-16 items-center">
            <AppLink to="/" className="text-xl font-bold">
              eCFRadar
            </AppLink>
          </div>
        </header>

        <main className="container mx-auto flex-1 py-8">
          <Outlet />
        </main>
      </div>
    </UIProvider>
  )
}
