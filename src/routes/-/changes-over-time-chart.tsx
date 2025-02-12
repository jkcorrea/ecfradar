import React from 'react'

import { format, parse } from 'date-fns'
import { useAtomValue } from 'jotai'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Slider } from '#/components/ui/slider'
import { agenciesAtom, titlesSummaryAtom } from '#/stores'

type GroupBy = 'year' | 'month'

const AGENCY_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
]

const TOP_N_AGENCIES = 10

export function ChangesOverTimeChart({ className }: { className?: string }) {
  const titlesSummary = useAtomValue(titlesSummaryAtom)
  const agencies = useAtomValue(agenciesAtom)
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

  // Get all revisions and group them by agency
  const revisionData = React.useMemo(() => {
    if (!titlesSummary.data || !agencies.data) return []

    // Create a map of title numbers to agency names
    const titleToAgency = new Map<number, string>()
    for (const agency of agencies.data) {
      for (const ref of agency.cfr_references) {
        titleToAgency.set(ref.title, agency.display_name)
      }
      if (agency.children) {
        for (const child of agency.children) {
          for (const ref of child.cfr_references) {
            titleToAgency.set(ref.title, agency.display_name)
          }
        }
      }
    }

    // Group revisions by date and agency
    const grouped = titlesSummary.data.reduce(
      (acc: Record<string, Record<string, number>>, title) => {
        const agency = titleToAgency.get(title.number) ?? 'Other'

        if (title.revisions) {
          for (const rev of title.revisions) {
            const date = new Date(rev.date)
            const year = date.getFullYear()
            if (year < selectedYears[0] || year > selectedYears[1]) continue

            const key = groupBy === 'year' ? format(date, 'yyyy') : format(date, 'yyyy-MM')
            if (!acc[key]) {
              acc[key] = {}
            }
            acc[key][agency] = (acc[key][agency] || 0) + rev.count
          }
        }
        return acc
      },
      {},
    )

    // Convert to array format for Recharts
    return Object.entries(grouped)
      .map(([date, agencies]) => ({
        date,
        ...agencies,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [titlesSummary.data, agencies.data, selectedYears, groupBy])

  // Calculate average changes per period
  const averageChanges = React.useMemo(() => {
    if (!revisionData.length) return 0
    const totalChanges = revisionData.reduce((sum, data) => {
      const periodTotal = Object.entries(data).reduce((acc, [key, value]) => {
        if (key === 'date') return acc
        return acc + (typeof value === 'number' ? value : 0)
      }, 0)
      return sum + periodTotal
    }, 0)
    return Math.round(totalChanges / revisionData.length)
  }, [revisionData])

  // Get unique agencies sorted by total volume
  const uniqueAgencies = React.useMemo(() => {
    if (!revisionData.length) return []

    // Calculate total volume for each agency
    const agencyVolumes = new Map<string, number>()
    for (const data of revisionData) {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'date') continue
        agencyVolumes.set(
          key,
          (agencyVolumes.get(key) || 0) + (typeof value === 'number' ? value : 0),
        )
      }
    }

    // Sort agencies by volume and take top N
    return Array.from(agencyVolumes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N_AGENCIES)
      .map(([agency]) => agency)
  }, [revisionData])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>CFR Changes by Agency Over Time</CardTitle>
            <CardDescription>
              Number of changes per {groupBy} by top {TOP_N_AGENCIES} agencies
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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revisionData} margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
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
                formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                isAnimationActive={false}
                cursor={{ strokeDasharray: '3 3' }}
                wrapperStyle={{ zIndex: 100 }}
                allowEscapeViewBox={{ x: false, y: false }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null

                  // Sort by value descending
                  const sortedPayload = [...payload].sort(
                    (a, b) => (b.value as number) - (a.value as number),
                  )

                  // Calculate total for this period
                  const periodTotal = sortedPayload.reduce(
                    (sum, entry) => sum + (entry.value as number),
                    0,
                  )

                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-medium">{label}</div>
                      <div className="mb-1 text-xs text-muted-foreground">
                        Total changes: {periodTotal.toLocaleString()}
                      </div>
                      <div className="flex max-h-[300px] flex-col gap-1 overflow-y-auto">
                        {sortedPayload.map((entry) => {
                          const value = entry.value as number
                          const percentage = ((value / periodTotal) * 100).toFixed(1)
                          return (
                            <div key={entry.dataKey} className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="truncate">{entry.name}:</span>
                              <span className="font-medium">
                                {value.toLocaleString()} ({percentage}%)
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                }}
              />
              <Legend />
              <ReferenceLine
                y={averageChanges}
                label={{
                  value: `Avg: ${averageChanges.toLocaleString()}`,
                  position: 'right',
                }}
                stroke="#666"
                strokeDasharray="3 3"
              />
              {uniqueAgencies.map((agency, index) => (
                <Line
                  key={agency}
                  type="monotone"
                  dataKey={agency}
                  name={agency}
                  stroke={AGENCY_COLORS[index % AGENCY_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
