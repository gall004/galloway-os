import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit2, CheckCircle2, Trash2, Clock, Target } from 'lucide-react'

/**
 * @description TaskCard — Massive UI Overhaul: Condensed padding, focal title typography, and dropdown-menus.
 * @param {{ task: Object, onClick: Function, onComplete: Function, onDelete: Function, onInsert: Function, onToggleFocus: Function, overlay?: boolean }} props
 */
/**
 * @description Calculate days since task was delegated. Pure utility — isolated from React render.
 * @param {Object} task - Task object with status_name and date_delegated.
 * @returns {number|null} Days since delegation, or null if not delegated.
 */
function getDelegationDays(task) {
  if (task.status_name !== 'delegated' || !task.date_delegated) return null
  return Math.floor((Date.now() - new Date(task.date_delegated).getTime()) / 86400000)
}

export default function TaskCard({ task, onClick, onComplete, onDelete, onInsert, onToggleFocus, overlay = false }) {
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

  const delegationDays = getDelegationDays(task)

  const slaBorderClass = delegationDays != null && delegationDays >= 14
    ? 'ring-2 ring-red-500/60 border-red-500/40'
    : delegationDays != null && delegationDays >= 7
      ? 'ring-2 ring-amber-500/60 border-amber-500/40'
      : ''

  const focusClass = task.is_focused ? 'ring-2 ring-primary border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]' : ''

  const cardContent = (
    <Card className={`transition-all hover:shadow-md ${task.is_focused ? focusClass : slaBorderClass} ${overlay ? 'shadow-xl ring-2 ring-ring scale-105 bg-background relative z-50' : 'cursor-grab active:cursor-grabbing bg-card relative z-10'}`}>
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
              {task.status_name === 'active' && (
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFocus?.(task) }} className="cursor-pointer">
                  <Target className="w-4 h-4 mr-2" /> {task.is_focused ? 'Unpin from Focus' : 'Pin to Focus'}
                </DropdownMenuItem>
              )}
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
          {delegationDays != null && delegationDays >= 1 && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0 h-[18px] rounded-sm ${delegationDays >= 14 ? 'bg-red-500/15 text-red-600 dark:text-red-400' : delegationDays >= 7 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
              <Clock className="w-2.5 h-2.5" />{delegationDays}d
            </span>
          )}
          {task.customer && task.customer !== 'N/A' && <span className="text-[10px] font-medium text-primary/70 truncate max-w-[140px] bg-primary/10 px-1.5 py-0.5 rounded-sm">{task.customer}</span>}
          {task.project && task.project !== 'N/A' && <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[120px] bg-muted/60 px-1.5 py-0.5 rounded-sm">{task.project}</span>}
          {formattedDate && <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap font-medium">Due {formattedDate}</span>}
        </div>
      </div>
    </Card>
  )

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="pb-2.5">
        <Card className="rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 shadow-none !opacity-100 overflow-hidden">
          <div className="opacity-0">{cardContent}</div>
        </Card>
      </div>
    )
  }

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
