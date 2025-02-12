import React from 'react'

import { format, parse } from 'date-fns'
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
import { Slider } from '#/components/ui/slider'
import type { TitleSummary } from '#/lib/schemas'
import { titlesSummaryAtom } from '#/stores'

type GroupBy = 'year' | 'month'

export function ChangesOverTimeChart() {
  const titlesSummary = useAtomValue(titlesSummaryAtom)
  const [groupBy, setGroupBy] = React.useState<GroupBy>('year')

  // Get min/max years from the data
  const yearRange = React.useMemo(() => {
    if (!titlesSummary.data) return { min: 0, max: new Date().getFullYear() }

    const dates = titlesSummary.data
      .flatMap((title) => title.revisions ?? [])
      .map((rev) => new Date(rev.date))

    return {
      min: Math.min(...dates.map((d) => d.getFullYear())),
      max: Math.max(...dates.map((d) => d.getFullYear())),
    }
  }, [titlesSummary.data])

  // State for the year range slider
  const [selectedYears, setSelectedYears] = React.useState<[number, number]>([
    yearRange.max - 5,
    yearRange.max,
  ])

  // Get all revisions and group them
  const revisionData = React.useMemo(() => {
    if (!titlesSummary.data) return []

    const allRevisions = titlesSummary.data.flatMap((title: TitleSummary) => title.revisions ?? [])

    // Filter by year range
    const filteredRevisions = allRevisions.filter((rev) => {
      const year = new Date(rev.date).getFullYear()
      return year >= selectedYears[0] && year <= selectedYears[1]
    })

    // Group by year or month
    const grouped = filteredRevisions.reduce(
      (acc: Record<string, { date: string; count: number; substantiveCount: number }>, rev) => {
        const date = new Date(rev.date)
        const key = groupBy === 'year' ? format(date, 'yyyy') : format(date, 'yyyy-MM')

        if (!acc[key]) {
          acc[key] = { date: key, count: 0, substantiveCount: 0 }
        }
        acc[key].count += rev.count
        if (rev.substantive) {
          acc[key].substantiveCount += rev.count
        }
        return acc
      },
      {},
    )

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  }, [titlesSummary.data, selectedYears, groupBy])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>CFR Changes Over Time</CardTitle>
            <CardDescription>
              Number of changes per {groupBy}, including substantive changes
              <div className="mt-1 text-xs">
                Data available from {yearRange.min} to {yearRange.max}
              </div>
            </CardDescription>
          </div>

          <div className="flex items-center gap-4">
            <select
              className="rounded-md border px-2 py-1"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="year">Yearly</option>
              <option value="month">Monthly</option>
            </select>

            <div className="flex w-[300px] flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span>{selectedYears[0]}</span>
                <span>{selectedYears[1]}</span>
              </div>
              <Slider
                min={yearRange.min}
                max={yearRange.max}
                step={1}
                value={selectedYears}
                onValueChange={(value) => setSelectedYears(value as [number, number])}
                className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revisionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  if (groupBy === 'year') return value
                  try {
                    return format(parse(value, 'yyyy-MM', new Date()), 'MMM yyyy')
                  } catch {
                    return value
                  }
                }}
              />
              <YAxis tickFormatter={(value) => value.toLocaleString()} />
              <Tooltip
                labelFormatter={(value) => {
                  if (groupBy === 'year') return value
                  try {
                    return format(parse(value, 'yyyy-MM', new Date()), 'MMMM yyyy')
                  } catch {
                    return value
                  }
                }}
                formatter={(value: number, name: string) => {
                  const label = name === 'count' ? 'Total Changes' : 'Substantive Changes'
                  return [value.toLocaleString(), label]
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                name="Total Changes"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="substantiveCount"
                stroke="#ef4444"
                name="Substantive Changes"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
