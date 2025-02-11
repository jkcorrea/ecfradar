import { createFileRoute } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import * as Icons from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import type { TitleSummary } from '#/lib/schemas'
import { agenciesAtom, titlesSummaryAtom } from '#/stores'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const agencies = useAtomValue(agenciesAtom)
  const titlesSummary = useAtomValue(titlesSummaryAtom)

  const agencyStats =
    agencies.data?.map((agency) => ({
      name: agency.display_name,
      regulations: agency.cfr_references.length,
    })) ?? []

  // Calculate total word count and average words per title
  const totalWordCount =
    titlesSummary.data?.reduce(
      (acc: number, title: TitleSummary) => acc + (title.wordCount ?? 0),
      0,
    ) ?? 0
  const avgWordsPerTitle = Math.round(totalWordCount / (titlesSummary.data?.length ?? 1))

  // Get recent revisions data (last 30 days)
  const recentRevisions = titlesSummary.data
    ?.flatMap((title: TitleSummary) => title.revisions ?? [])
    .filter((rev: TitleSummary['revisions'][number]) => {
      const revDate = new Date(rev.date)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return revDate >= thirtyDaysAgo
    })
    .reduce(
      (
        acc: Record<string, { date: string; count: number; substantiveCount: number }>,
        rev: TitleSummary['revisions'][number],
      ) => {
        const date = rev.date.split('T')[0] // Get just the date part
        if (!acc[date]) {
          acc[date] = { date, count: 0, substantiveCount: 0 }
        }
        acc[date].count += rev.count
        if (rev.substantive) {
          acc[date].substantiveCount += rev.count
        }
        return acc
      },
      {} as Record<string, { date: string; count: number; substantiveCount: number }>,
    )

  type RevisionStat = { date: string; count: number; substantiveCount: number }
  const revisionChartData = (Object.values(recentRevisions ?? {}) as RevisionStat[]).sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-4xl font-bold">Dashboard</h1>

      <div className="grid gap-6">
        {/* Overview Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Agencies</CardTitle>
              <CardDescription>Number of federal agencies</CardDescription>
            </CardHeader>
            <CardContent className="flex items-baseline gap-2">
              <Icons.Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-3xl font-bold">{agencies.data?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Regulations</CardTitle>
              <CardDescription>Number of CFR references</CardDescription>
            </CardHeader>
            <CardContent className="flex items-baseline gap-2">
              <Icons.BookOpen className="h-4 w-4 text-muted-foreground" />
              <p className="text-3xl font-bold">
                {agencies.data?.reduce((acc, agency) => acc + agency.cfr_references.length, 0) ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Words</CardTitle>
              <CardDescription>Across all regulations</CardDescription>
            </CardHeader>
            <CardContent className="flex items-baseline gap-2">
              <Icons.FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-3xl font-bold">{new Intl.NumberFormat().format(totalWordCount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg Words per Title</CardTitle>
              <CardDescription>Average length of regulations</CardDescription>
            </CardHeader>
            <CardContent className="flex items-baseline gap-2">
              <Icons.BarChart2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat().format(avgWordsPerTitle)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Changes Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Changes (Last 30 Days)</CardTitle>
            <CardDescription>
              Number of changes per day, including substantive changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revisionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Total Changes" />
                  <Line
                    type="monotone"
                    dataKey="substantiveCount"
                    stroke="#ef4444"
                    name="Substantive Changes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Regulations by Agency Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Regulations by Agency</CardTitle>
            <CardDescription>Number of CFR references per agency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agencyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="regulations" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
