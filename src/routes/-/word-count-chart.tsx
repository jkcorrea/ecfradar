import React from 'react'

import { useNavigate } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { agenciesAtom, titlesSummaryAtom } from '#/stores'

const COLORS = ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534']

export function WordCountChart() {
  const agencies = useAtomValue(agenciesAtom)
  const titles = useAtomValue(titlesSummaryAtom)
  const navigate = useNavigate()

  const agencyWordCounts = React.useMemo(() => {
    if (!agencies.data || !titles.data) return []

    // Create a map of title numbers to word counts
    const titleWordCounts = new Map(
      titles.data.map((title) => [title.number, title.wordCount ?? 0]),
    )

    // Calculate word counts for each agency including their children
    const wordCounts = agencies.data.map((agency) => {
      // Get all unique titles referenced by this agency and its children
      const allTitles = new Set([
        ...agency.cfr_references.map((ref) => ref.title),
        ...agency.children.flatMap((child) => child.cfr_references.map((ref) => ref.title)),
      ])

      // Sum up word counts for all referenced titles
      const totalWords = Array.from(allTitles).reduce(
        (sum, title) => sum + (titleWordCounts.get(title) ?? 0),
        0,
      )

      return {
        name: agency.short_name ?? agency.display_name,
        slug: agency.slug,
        wordCount: totalWords,
      }
    })

    return wordCounts
      .filter((a) => a.wordCount > 0)
      .sort((a, b) => b.wordCount - a.wordCount)
      .slice(0, 10) // Only show top 10
  }, [agencies.data, titles.data])

  const maxWordCount = Math.max(...agencyWordCounts.map((a) => a.wordCount))

  const getColorIndex = (count: number, max: number) => {
    const ratio = count / max
    return Math.floor(ratio * (COLORS.length - 1))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Word Count by Agency</CardTitle>
        <CardDescription>Total words in referenced titles (top 10)</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={agencyWordCounts}
              margin={{ top: 5, right: 16, bottom: 50, left: 16 }}
              barSize={24}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={(props) => {
                  const { x, y, payload } = props
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={16}
                        textAnchor="end"
                        transform="rotate(-45)"
                        fontSize={11}
                      >
                        {payload.value.length > 20
                          ? `${payload.value.slice(0, 20)}...`
                          : payload.value}
                      </text>
                    </g>
                  )
                }}
                height={50}
                interval={0}
              />
              <YAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg bg-white p-4 shadow-lg">
                      <p className="mb-2 font-semibold">{data.name}</p>
                      <div className="flex items-center gap-2">
                        <span>Words:</span>
                        <span className="font-mono">{data.wordCount.toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Click bar for details</p>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="wordCount"
                onClick={(data) => navigate({ to: '/agency/$slug', params: { slug: data.slug } })}
                cursor="pointer"
                barSize={20}
              >
                {agencyWordCounts.map((entry) => (
                  <Cell
                    key={entry.slug}
                    fill={COLORS[getColorIndex(entry.wordCount, maxWordCount)]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
