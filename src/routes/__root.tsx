import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { getDefaultStore } from 'jotai'

import { AppLink } from '#/components/app-link'
import { ScrollArea } from '#/components/ui/scroll-area'
import { Separator } from '#/components/ui/separator'
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
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 border-r bg-background">
          <div className="flex h-16 items-center px-4">
            <AppLink to="/" className="text-xl font-bold">
              ECFRadar
            </AppLink>
          </div>
          <Separator />
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <nav className="space-y-1 p-4">
              <AppLink
                to="/"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                activeProps={{ className: 'bg-accent' }}
              >
                Dashboard
              </AppLink>
              {/* <AppLink
                to="/regulations"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                activeProps={{ className: 'bg-accent' }}
              >
                Regulations
              </AppLink>
              <AppLink
                to="/agencies"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                activeProps={{ className: 'bg-accent' }}
              >
                Agencies
              </AppLink> */}
            </nav>
          </ScrollArea>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </UIProvider>
  )
}
