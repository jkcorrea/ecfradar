import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { getDefaultStore } from 'jotai'
import * as Icons from 'lucide-react'

import { AppLink } from '#/components/app-link'
import { UIProvider } from '#/components/ui-provider'

export interface RootRouteContext {
  store: ReturnType<typeof getDefaultStore>
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: RootLayout,
})

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: Icons.Home,
    to: '/',
  },
  {
    label: 'Agencies',
    icon: Icons.Building2,
    to: '/agencies',
  },
  {
    label: 'Titles',
    icon: Icons.BookOpen,
    to: '/titles',
  },
] as const

export function RootLayout() {
  return (
    <UIProvider>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-36 shrink-0 border-r bg-muted/30">
          <div className="flex h-16 items-center border-b px-4">
            <AppLink to="/" className="text-xl font-bold hover:no-underline">
              eCFRadar
            </AppLink>
          </div>

          <nav className="p-2">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <AppLink
                    to={item.to}
                    activeProps={{ className: 'bg-muted' }}
                    className="flex justify-self-start gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="flex-1">
          <header className="border-b bg-background">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Explore the{' '}
                <a
                  href="https://www.ecfr.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Code of Federal Regulations
                  <Icons.ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <a
                href="https://github.com/jkcorrea/ecfradar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <Icons.Github className="h-4 w-4" />
                Source
              </a>
            </div>
          </header>

          <main className="p-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </UIProvider>
  )
}
