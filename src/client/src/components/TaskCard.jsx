import { useDraggable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PRIORITY_STYLES, WORKSTREAM_STYLES } from '@/lib/constants'

/**
 * @description TaskCard — a draggable Kanban "sticky note".
 * Uses @dnd-kit/core draggable + ShadCN Card + Badge.
 * @param {{ task: Object, onClick: Function }} props
 */
export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  const formattedDate = task.date_due
    ? new Date(task.date_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`mb-3 ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      <Card
        className="transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing"
        onClick={(e) => {
          if (!isDragging) {
            onClick?.(task)
          }
          e.stopPropagation()
        }}
      >
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
    </div>
  )
}
