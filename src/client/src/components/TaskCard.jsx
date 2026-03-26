import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PRIORITY_STYLES = {
  Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  High: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const WORKSTREAM_STYLES = {
  None: '',
  'Mark Eichten': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'Garrett Stuart': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'Caleb Johnson': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
}

/**
 * @description TaskCard — a Kanban "sticky note" representing one task.
 * Uses ShadCN Card + Badge. Displays title, description, priority, and workstream.
 * @param {{ task: Object }} props
 */
export default function TaskCard({ task }) {
  const formattedDate = task.date_due
    ? new Date(task.date_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <Card className="mb-3 transition-shadow hover:shadow-md cursor-default">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-medium leading-snug">
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 space-y-2">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PRIORITY_STYLES[task.priority] || ''}`}>
            {task.priority}
          </Badge>
          {task.workstream && task.workstream !== 'None' && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${WORKSTREAM_STYLES[task.workstream] || ''}`}>
              {task.workstream}
            </Badge>
          )}
          {task.delegated_to && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              → {task.delegated_to}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          {task.associated_project && (
            <span className="truncate max-w-[120px]">{task.associated_project}</span>
          )}
          {formattedDate && (
            <span className="ml-auto">Due {formattedDate}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
