import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'

const PALETTE = [
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(340, 75%, 55%)',
  'hsl(25, 95%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(47, 96%, 53%)',
  'hsl(199, 89%, 48%)',
  'hsl(315, 70%, 50%)',
]

/**
 * @description Donut chart showing active task breakdown by customer.
 * @param {{ data: Array<{customer: string, count: number}> }} props
 */
export default function CustomerDonut({ data }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (!data.length) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Tasks by Customer</h3>
        <p className="text-sm text-muted-foreground">No active tasks</p>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">Tasks by Customer</h3>
      <div className="relative h-[200px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="customer"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_entry, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
                fontSize: '12px',
              }}
              formatter={(value, name) => [`${value} task${value !== 1 ? 's' : ''}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-2xl font-bold text-foreground">{total}</span>
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Active</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
        {data.map((d, i) => (
          <div key={d.customer} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            {d.customer} ({d.count})
          </div>
        ))}
      </div>
    </Card>
  )
}
