import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { fetchMetrics } from '@/lib/api'
import CustomerDonut from '@/components/charts/CustomerDonut'
import VelocityBar from '@/components/charts/VelocityBar'
import StatusGauge from '@/components/charts/StatusGauge'
import MetricCard from '@/components/charts/MetricCard'
import ReportGenerator from '@/components/ReportGenerator'

/**
 * @description Analytics dashboard with charts, gauges, and operational metrics.
 */
export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await fetchMetrics()
      setMetrics(data)
    } catch {
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground animate-pulse">Loading metrics…</p>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-destructive font-medium">Failed to load metrics</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        <ReportGenerator />
      </div>

      {/* Top row — KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Tasks Completed"
          value={metrics.totalCompleted}
          subtitle="All time"
        />
        <MetricCard
          label="Avg Cycle Time"
          value={metrics.avgCycleTimeDays != null ? `${metrics.avgCycleTimeDays}d` : '—'}
          subtitle="Created → Done"
        />
        <MetricCard
          label="Delegation Time"
          value={metrics.avgDelegationTimeDays != null ? `${metrics.avgDelegationTimeDays}d` : '—'}
          subtitle="Delegated → Done"
        />
        <MetricCard
          label="Active Tasks"
          value={(metrics.activeVsDelegated.active || 0) + (metrics.activeVsDelegated.delegated || 0)}
          subtitle="In flight now"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomerDonut data={metrics.tasksByCustomer} />
        <VelocityBar data={metrics.completionVelocity} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatusGauge
          active={metrics.activeVsDelegated.active || 0}
          delegated={metrics.activeVsDelegated.delegated || 0}
        />

        {/* Recent Wins */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Wins</h3>
          {metrics.recentImpacts.length > 0 ? (
            <ul className="space-y-2.5">
              {metrics.recentImpacts.map((item, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground italic line-clamp-2 mt-0.5">↳ {item.impact_statement}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No impact statements captured yet</p>
          )}
        </Card>
      </div>
    </div>
  )
}
