import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card } from '@/components/ui/card'

/**
 * @description Bar chart showing weekly task completion velocity (last 8 weeks).
 * @param {{ data: Array<{week: string, count: number}> }} props
 */
export default function VelocityBar({ data }) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.week.replace(/^\d{4}-W/, 'W'),
  }))

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">Completion Velocity</h3>
      {!formatted.length ? (
        <p className="text-sm text-muted-foreground">No completions in the last 8 weeks</p>
      ) : (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value} task${value !== 1 ? 's' : ''}`, 'Completed']}
              />
              <Bar dataKey="count" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
