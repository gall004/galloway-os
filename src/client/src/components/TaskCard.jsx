import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'

/**
 * @description TaskCard — sortable card with complete, edit, and delete actions. No priority badge.
 * @param {{ task: Object, onClick: Function, onComplete: Function, onDelete: Function, onInsert: Function, overlay?: boolean }} props
 */
export default function TaskCard({ task, onClick, onComplete, onDelete, onInsert, overlay = false }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: `task-${task.id}`, data: { task }, disabled: overlay })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const formattedDate = task.date_due
    ? new Date(task.date_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  const cardContent = (
    <Card className={`transition-shadow hover:shadow-md ${overlay ? 'shadow-xl ring-2 ring-ring' : 'cursor-grab active:cursor-grabbing'}`}>
      <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-start gap-1">
        <CardTitle className="text-sm font-medium leading-snug flex-1 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onClick?.(task) }}>
          {task.title}
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-success shrink-0" onClick={(e) => { e.stopPropagation(); onComplete?.(task) }} title="Mark as done">✓</Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0" onClick={(e) => { e.stopPropagation(); onClick?.(task) }} title="Edit">✏️</Button>
        <DeleteConfirmDialog title="Delete task?" description={`Permanently delete "${task.title}"?`} onConfirm={() => onDelete?.(task)}>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={(e) => e.stopPropagation()} title="Delete">🗑️</Button>
        </DeleteConfirmDialog>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 space-y-2">
        {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
        <div className="flex flex-wrap gap-1.5">
          {task.delegated_to && <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-delegated text-delegated-foreground">→ {task.delegated_to}</Badge>}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          {task.project && task.project !== 'N/A' && <span className="truncate max-w-[120px]">{task.project}</span>}
          {formattedDate && <span className="ml-auto">Due {formattedDate}</span>}
        </div>
      </CardContent>
    </Card>
  )

  if (overlay) return cardContent

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="pb-3">
          {cardContent}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={(e) => { e.stopPropagation(); onInsert?.({ status_name: task.status_name, order_index: task.order_index }) }}>
          ＋ Insert Task Above
        </ContextMenuItem>
        <ContextMenuItem onClick={(e) => { e.stopPropagation(); onInsert?.({ status_name: task.status_name, order_index: task.order_index + 1 }) }}>
          ＋ Insert Task Below
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
