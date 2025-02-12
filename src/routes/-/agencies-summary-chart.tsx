import React from 'react'

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
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

export function AgenciesSummaryChart() {
  const agencies = useAtomValue(agenciesAtom)
  const titles = useAtomValue(titlesSummaryAtom)
  const [selectedTitles, setSelectedTitles] = React.useState<number[]>([])
  const [selectedAgency, setSelectedAgency] = React.useState<AgencyStats | null>(null)

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
        name: agency.display_name,
        regulations: references.length + childRefs.length,
        references: [...references, ...childRefs],
        childStats: agency.children.map((child) => ({
          name: child.display_name,
          regulations: selectedTitles.length
            ? child.cfr_references.filter((ref) => selectedTitles.includes(ref.title)).length
            : child.cfr_references.length,
        })),
      }
    })

    return filteredAgencies
      .filter((a) => a.regulations > 0)
      .sort((a, b) => b.regulations - a.regulations)
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
          <div>
            <CardTitle>Agency References</CardTitle>
            <CardDescription>Number of CFR references per agency</CardDescription>
          </div>

          <Combobox
            placeholder="Filter by CFR titles..."
            options={titleOptions}
            selected={selectedTitles}
            onChange={handleTitleChange}
            multi
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agencyStats} margin={{ top: 5, right: 20, bottom: 20, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={false}
                height={20}
                label={{ value: 'Agencies', position: 'bottom' }}
              />
              <YAxis
                width={60}
                label={{ value: 'References', angle: -90, position: 'insideLeft' }}
              />
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
                onClick={(data) => setSelectedAgency(data as AgencyStats)}
                cursor="pointer"
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

      <Dialog open={!!selectedAgency} onOpenChange={() => setSelectedAgency(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAgency?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <h4 className="mb-2 font-semibold">Sub-agencies</h4>
            {selectedAgency?.childStats.map((child) => (
              <div key={child.name} className="mb-2 flex items-center justify-between">
                <span>{child.name}</span>
                <span className="font-mono">{child.regulations}</span>
              </div>
            ))}
            <h4 className="mb-2 mt-4 font-semibold">Referenced Titles & Chapters</h4>
            {Object.entries(
              selectedAgency?.references.reduce((acc: Record<string, number>, ref) => {
                const key = `Title ${ref.title}${ref.chapter ? ` Chapter ${ref.chapter}` : ''}`
                acc[key] = (acc[key] || 0) + 1
                return acc
              }, {}) ?? {},
            ).map(([ref, count]) => (
              <div key={ref} className="mb-1 flex items-center justify-between">
                <span>{ref}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
