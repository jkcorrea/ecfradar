import { createFileRoute } from '@tanstack/react-router'

import { AgencyReferencesChart } from './-/agency-references-chart'
import { ChangesOverTimeChart } from './-/changes-over-time-chart'
import { OverviewStats } from './-/overview-stats'
import { WordCountChart } from './-/word-count-chart'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="grid gap-6">
      <OverviewStats />
      <div className="grid gap-6 lg:grid-cols-2">
        <AgencyReferencesChart />
        <WordCountChart />
        <ChangesOverTimeChart className="lg:col-span-2" />
      </div>
    </div>
  )
}
