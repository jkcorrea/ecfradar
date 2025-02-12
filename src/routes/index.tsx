import { createFileRoute } from '@tanstack/react-router'

import { OverviewStats } from './-/overview-stats'
import { RecentChangesChart } from './-/recent-changes-chart'
import { TopAgenciesChart } from './-/top-agencies-chart'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="container mx-auto p-8 min-w-6xl">
      <h1 className="mb-8 text-4xl font-bold">eCFRadar</h1>

      <div className="grid gap-6">
        <OverviewStats />
        <RecentChangesChart />
        <TopAgenciesChart />
      </div>
    </div>
  )
}
