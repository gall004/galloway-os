import { Card } from '@/components/ui/card'

/**
 * @description Visual gauge showing active vs delegated task ratio.
 * @param {{ active: number, delegated: number }} props
 */
export default function StatusGauge({ active, delegated }) {
  const total = active + delegated
  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0
  const delegatedPercent = total > 0 ? 100 - activePercent : 0

  const getHealthLabel = () => {
    if (total === 0) return { text: 'No active tasks', color: 'text-muted-foreground' }
    if (delegatedPercent >= 60) return { text: 'Strong delegation', color: 'text-green-500' }
    if (delegatedPercent >= 30) return { text: 'Balanced', color: 'text-blue-500' }
    return { text: 'Hands-on heavy', color: 'text-amber-500' }
  }

  const health = getHealthLabel()

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">Management Efficiency</h3>
      <div className="flex items-end gap-6">
        <div className="flex-1">
          <div className="h-3 rounded-full bg-muted overflow-hidden flex">
            {activePercent > 0 && (
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${activePercent}%` }}
              />
            )}
            {delegatedPercent > 0 && (
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${delegatedPercent}%` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Active ({active})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              Delegated ({delegated})
            </span>
          </div>
        </div>
      </div>
      <p className={`text-xs font-medium mt-3 ${health.color}`}>{health.text}</p>
    </Card>
  )
}
