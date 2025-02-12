import React from 'react'

import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import * as Icons from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { z } from 'zod'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import type { CFRReference } from '#/lib/schemas'
import { agenciesAtom, titlesSummaryAtom } from '#/stores'

export const Route = createFileRoute('/agency/$slug')({
  params: z.object({
    slug: z.string(),
  }),
  loader: async ({ params, context }) => {
    const agencies = context.store.get(agenciesAtom)
    const titlesSummary = context.store.get(titlesSummaryAtom)

    const agency = agencies.data?.find((a) => a.slug === params.slug)
    if (!agency) throw notFound()

    return { agency, titlesSummary }
  },
  component: AgencyDetailPage,
})

function AgencyDetailPage() {
  const { agency, titlesSummary } = Route.useLoaderData()
  const navigate = useNavigate()

  // Get all references including child agencies
  const allReferences = React.useMemo(() => {
    const refs = [...agency.cfr_references] as CFRReference[]
    for (const child of agency.children) {
      refs.push(...child.cfr_references)
    }
    return refs
  }, [agency])

  // Group references by title and chapter
  const referencesByTitle = React.useMemo(() => {
    const grouped = {} as Record<string, { count: number; title: number; chapter?: number }>
    for (const ref of allReferences) {
      const key = `Title ${ref.title}${ref.chapter ? ` Chapter ${ref.chapter}` : ''}`
      if (!grouped[key]) {
        grouped[key] = {
          count: 0,
          title: ref.title,
          chapter: ref.chapter ? Number.parseInt(ref.chapter) : undefined,
        }
      }
      grouped[key].count++
    }
    return grouped
  }, [allReferences])

  // Get changes over time for this agency's titles
  const changesOverTime = React.useMemo(() => {
    const agencyTitles = new Set(allReferences.map((ref) => ref.title))
    const changes = new Map<string, number>()

    for (const title of titlesSummary?.data ?? []) {
      if (!agencyTitles.has(title.number)) continue
      if (!title.revisions) continue

      for (const rev of title.revisions) {
        const year = new Date(rev.date).getFullYear().toString()
        changes.set(year, (changes.get(year) || 0) + rev.count)
      }
    }

    return Array.from(changes.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year))
  }, [titlesSummary?.data, allReferences])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: '/' })} className="rounded-full p-2 hover:bg-muted">
          <Icons.ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{agency.display_name}</h1>
          <p className="text-muted-foreground">
            {allReferences.length.toLocaleString()} total CFR references
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sub-agencies */}
        <Card>
          <CardHeader>
            <CardTitle>Sub-agencies</CardTitle>
            <CardDescription>Breakdown of references by sub-agency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {agency.children.map((child) => (
                <div
                  key={child.slug}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"
                >
                  <span className="text-sm">
                    {child.display_name.replace(/, Department of .*$/, '')}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {child.cfr_references.length.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referenced Titles */}
        <Card>
          <CardHeader>
            <CardTitle>Referenced Titles & Chapters</CardTitle>
            <CardDescription>Breakdown of references by CFR title and chapter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2">
              {Object.entries(referencesByTitle)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([key, data]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"
                  >
                    <span className="text-sm">{key}</span>
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      {data.count.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Changes Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Changes Over Time</CardTitle>
            <CardDescription>Number of changes to referenced titles by year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={changesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => value.toLocaleString()} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Changes']}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
