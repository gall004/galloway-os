import { Card } from '@/components/ui/card'

/**
 * @description Reusable metric stat card for the analytics dashboard.
 * @param {{ label: string, value: string|number, subtitle?: string, className?: string }} props
 */
export default function MetricCard({ label, value, subtitle, className = '' }) {
  return (
    <Card className={`p-5 flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-3xl font-bold text-foreground tracking-tight">{value ?? '—'}</span>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
    </Card>
  )
}
