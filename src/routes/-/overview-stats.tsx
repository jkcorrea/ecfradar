import { useAtomValue } from 'jotai'
import * as Icons from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import type { TitleSummary } from '#/lib/schemas'
import { agenciesAtom, titlesSummaryAtom } from '#/stores'

export function OverviewStats() {
  const agencies = useAtomValue(agenciesAtom)
  const titlesSummary = useAtomValue(titlesSummaryAtom)

  const totalWordCount =
    titlesSummary.data?.reduce(
      (acc: number, title: TitleSummary) => acc + (title.wordCount ?? 0),
      0,
    ) ?? 0
  const avgWordsPerTitle = Math.round(totalWordCount / (titlesSummary.data?.length ?? 1))

  return (
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
          <p className="text-3xl font-bold">{new Intl.NumberFormat().format(avgWordsPerTitle)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
