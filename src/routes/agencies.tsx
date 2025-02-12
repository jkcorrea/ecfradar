import React from 'react'

import { createFileRoute, Link } from '@tanstack/react-router'
import * as Icons from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { agenciesAtom } from '#/stores'

export const Route = createFileRoute('/agencies')({
  loader: ({ context }) => {
    return { agencies: context.store.get(agenciesAtom) }
  },
  component: AgenciesPage,
})

function AgenciesPage() {
  const { agencies } = Route.useLoaderData()
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredAgencies = React.useMemo(() => {
    if (!agencies.data) return []

    const query = searchQuery.toLowerCase()
    return agencies.data
      .map((agency) => {
        const totalRefs =
          agency.cfr_references.length +
          agency.children.reduce((acc, child) => acc + child.cfr_references.length, 0)
        return { ...agency, totalRefs }
      })
      .filter(
        (agency) =>
          agency.display_name.toLowerCase().includes(query) ||
          agency.short_name?.toLowerCase().includes(query),
      )
      .sort((a, b) => b.totalRefs - a.totalRefs)
  }, [agencies.data, searchQuery])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agencies</h1>
        <p className="text-muted-foreground">Browse all agencies and their CFR references</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Agencies</CardTitle>
          <CardDescription>{agencies.data?.length.toLocaleString()} total agencies</CardDescription>
          <Input
            type="search"
            placeholder="Search agencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredAgencies.map((agency) => (
              <Link
                key={agency.slug}
                to="/agency/$slug"
                params={{ slug: agency.slug }}
                className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{agency.display_name}</span>
                  {agency.short_name && (
                    <span className="text-sm text-muted-foreground">{agency.short_name}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {agency.totalRefs.toLocaleString()} refs
                  </span>
                  <Icons.ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
