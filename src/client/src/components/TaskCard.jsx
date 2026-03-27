import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit2, CheckCircle2, Trash2 } from 'lucide-react'

/**
 * @description TaskCard — Massive UI Overhaul: Condensed padding, focal title typography, and dropdown-menus.
 * @param {{ task: Object, onClick: Function, onComplete: Function, onDelete: Function, onInsert: Function, overlay?: boolean }} props
 */
export default function TaskCard({ task, onClick, onComplete, onDelete, onInsert, overlay = false }) {
  const [showDelete, setShowDelete] = useState(false)
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
    <Card className={`transition-all hover:shadow-md ${overlay ? 'shadow-xl ring-2 ring-ring scale-105' : 'cursor-grab active:cursor-grabbing'}`}>
      <div className="p-2.5 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-[15px] font-semibold tracking-tight leading-snug flex-1 cursor-pointer hover:text-primary transition-colors text-foreground" onClick={(e) => { e.stopPropagation(); onClick?.(task) }}>
            {task.title}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground/60 hover:bg-muted hover:text-foreground shrink-0 rounded-md" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onComplete?.(task) }} className="cursor-pointer">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Done
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onClick?.(task) }} className="cursor-pointer">
                <Edit2 className="w-4 h-4 mr-2" /> Edit Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setShowDelete(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>}
        
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {task.delegated_to && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[18px] bg-delegated/15 text-delegated-foreground border-delegated/20">→ {task.delegated_to}</Badge>}
          {task.project && task.project !== 'N/A' && <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[120px] bg-muted/60 px-1.5 py-0.5 rounded-sm">{task.project}</span>}
          {formattedDate && <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap font-medium">Due {formattedDate}</span>}
        </div>
      </div>
    </Card>
  )

  if (overlay) return cardContent

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="pb-2.5">
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
      
      <DeleteConfirmDialog open={showDelete} onOpenChange={setShowDelete} title="Delete task?" description={`Permanently delete "${task.title}"?`} onConfirm={() => onDelete?.(task)} />
    </>
  )
}
