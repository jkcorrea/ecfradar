import { useAtomValue } from 'jotai'
import {
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
import { titlesSummaryAtom } from '#/stores'

export function RecentChangesChart() {
  const titlesSummary = useAtomValue(titlesSummaryAtom)

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
    <Card>
      <CardHeader>
        <CardTitle>Recent Changes (Last 30 Days)</CardTitle>
        <CardDescription>Number of changes per day, including substantive changes</CardDescription>
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
  )
}
