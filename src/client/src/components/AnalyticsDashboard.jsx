import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchMetrics, fetchSettings, fetchConfig } from '@/lib/api'
import CustomerDonut from '@/components/charts/CustomerDonut'
import VelocityBar from '@/components/charts/VelocityBar'

import MetricCard from '@/components/charts/MetricCard'
import ReportGenerator from '@/components/ReportGenerator'
import { useBoard } from '@/hooks/useBoard'

/**
 * @description Analytics dashboard with charts, gauges, and operational metrics.
 * Conditionally hides delegation metrics when Manager Mode is disabled.
 */
export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [settings, setSettings] = useState(null)
  const [configStatuses, setConfigStatuses] = useState([])
  const [timeframe, setTimeframe] = useState('7d')
  const [loading, setLoading] = useState(true)
  const { activeBoardId } = useBoard()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [data, appSettings, fetchedStatuses] = await Promise.all([fetchMetrics(timeframe, activeBoardId), fetchSettings(activeBoardId), fetchConfig('statuses')])
      setMetrics(data)
      setSettings(appSettings)
      setConfigStatuses(fetchedStatuses || [])
    } catch {
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }, [timeframe, activeBoardId])

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

  const managerMode = !!settings?.manager_mode
  const inboxMode = !!settings?.inbox_mode

  let totalActiveTasks = 0
  const parkedTasks = []
  const orphanedTasks = []

  if (metrics?.statusCounts) {
    metrics.statusCounts.forEach(st => {
      const isValidColumn = configStatuses.some(col => col.name === st.status_name)
      const isSystemColumn = ['inbox', 'delegated', 'active', 'done'].includes(st.status_name)
      
      const isOrphaned = !isValidColumn && !isSystemColumn
      const isInboxParked = st.status_name === 'inbox' && !inboxMode
      const isManagerParked = st.status_name === 'delegated' && !managerMode

      if (isOrphaned) {
        orphanedTasks.push(st)
      } else if (isInboxParked || isManagerParked) {
        parkedTasks.push(st)
      } else {
        totalActiveTasks += st.count
      }
    })
  }

  return (
    <div className="w-full flex-1 max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Insights</h2>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <ReportGenerator />
        </div>
      </div>

      {parkedTasks.length > 0 && (
        <div className="relative w-full rounded-lg border p-4 bg-muted text-muted-foreground border-border mb-6">
          <div className="text-sm font-medium">Parked Tasks: {parkedTasks.reduce((acc, p) => acc + p.count, 0)} in {parkedTasks.map(p => p.status_name).join(', ')} <span className="opacity-70 font-normal italic ml-2">(As of right now)</span></div>
        </div>
      )}

      {orphanedTasks.length > 0 && (
        <div className="relative w-full rounded-lg border p-4 border-destructive/50 text-destructive dark:border-destructive mb-6">
          <div className="text-sm font-medium">Data Anomaly: {orphanedTasks.reduce((acc, o) => acc + o.count, 0)} orphaned tasks detected in deleted columns <span className="opacity-70 font-normal italic ml-2">(As of right now)</span></div>
        </div>
      )}

      {/* Top row — KPI cards */}
      <div className={`grid grid-cols-2 ${managerMode ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
        <MetricCard
          label="Tasks Completed"
          value={metrics.totalCompleted}
          subtitle={timeframe === '7d' ? 'In the last 7 days' : timeframe === '30d' ? 'In the last 30 days' : 'All time'}
        />
        <MetricCard
          label="Avg Cycle Time"
          value={metrics.avgCycleTimeDays != null ? `${metrics.avgCycleTimeDays}d` : '—'}
          subtitle="Created → Done"
        />
        {managerMode && (
          <MetricCard
            label="Delegation Time"
            value={metrics.avgDelegationTimeDays != null ? `${metrics.avgDelegationTimeDays}d` : '—'}
            subtitle="Delegated → Done"
          />
        )}
        <MetricCard
          label="Active Tasks"
          value={totalActiveTasks}
          subtitle="Current pipeline"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomerDonut data={metrics.tasksByCustomer} />
        <VelocityBar data={metrics.completionVelocity} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4">
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
