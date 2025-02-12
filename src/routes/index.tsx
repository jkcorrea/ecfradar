import { createFileRoute } from '@tanstack/react-router'

import { AgenciesSummaryChart } from './-/agencies-summary-chart'
import { ChangesOverTimeChart } from './-/changes-over-time-chart'
import { OverviewStats } from './-/overview-stats'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="grid gap-6">
      <OverviewStats />
      <AgenciesSummaryChart />
      <ChangesOverTimeChart />
    </div>
  )
}
