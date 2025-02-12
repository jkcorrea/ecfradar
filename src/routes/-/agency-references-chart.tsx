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

import type { ComboboxOption } from '#/components/combobox'
import { Combobox } from '#/components/combobox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import type { Agency, CFRReference } from '#/lib/schemas'
import { agenciesAtom, titlesSummaryAtom } from '#/stores'

interface AgencyStats extends Agency {
  regulations: number
  references: CFRReference[]
  childStats: Array<{
    name: string
    regulations: number
  }>
}

const COLORS = ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']

export function AgencyReferencesChart() {
  const agencies = useAtomValue(agenciesAtom)
  const titles = useAtomValue(titlesSummaryAtom)
  const navigate = useNavigate()
  const [selectedTitles, setSelectedTitles] = React.useState<number[]>([])

  const getColorIndex = (count: number, max: number) => {
    const ratio = count / max
    return Math.floor(ratio * (COLORS.length - 1))
  }

  const agencyStats = React.useMemo(() => {
    if (!agencies.data) return []

    const filteredAgencies = agencies.data.map((agency): AgencyStats => {
      const references = selectedTitles.length
        ? agency.cfr_references.filter((ref) => selectedTitles.includes(ref.title))
        : agency.cfr_references
      const childRefs = agency.children.flatMap((child) =>
        selectedTitles.length
          ? child.cfr_references.filter((ref) => selectedTitles.includes(ref.title))
          : child.cfr_references,
      )

      return {
        ...agency,
        name: agency.short_name ?? agency.display_name,
        regulations: references.length + childRefs.length,
        references: [...references, ...childRefs],
        childStats: agency.children.map((child) => ({
          name: child.short_name ?? child.display_name,
          regulations: selectedTitles.length
            ? child.cfr_references.filter((ref) => selectedTitles.includes(ref.title)).length
            : child.cfr_references.length,
        })),
      }
    })

    return filteredAgencies
      .filter((a) => a.regulations > 0)
      .sort((a, b) => b.regulations - a.regulations)
      .slice(0, 10)
  }, [agencies.data, selectedTitles])

  const maxRegulations = Math.max(...agencyStats.map((a) => a.regulations))

  const titleOptions =
    titles.data?.map((title) => ({
      id: title.number,
      label: `Title ${title.number} - ${title.name}`,
    })) ?? []

  const handleTitleChange = (selected: ComboboxOption<number>[]) => {
    setSelectedTitles(selected.map((option) => option.id))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>Agency References</CardTitle>
            <CardDescription>CFR references by agency (top 10)</CardDescription>
          </div>

          <Combobox
            placeholder="Filter by title..."
            options={titleOptions}
            selected={selectedTitles}
            onChange={handleTitleChange}
            multi
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={agencyStats}
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
              <YAxis type="number" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload as AgencyStats
                  return (
                    <div className="rounded-lg bg-white p-4 shadow-lg">
                      <p className="mb-2 font-semibold">{data.name}</p>
                      <div className="flex items-center gap-2">
                        <span>References:</span>
                        <span className="font-mono">{data.regulations}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Click bar for details</p>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="regulations"
                onClick={(data) => navigate({ to: '/agency/$slug', params: { slug: data.slug } })}
                cursor="pointer"
                barSize={24}
              >
                {agencyStats.map((entry) => (
                  <Cell
                    key={entry.slug}
                    fill={COLORS[getColorIndex(entry.regulations, maxRegulations)]}
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
