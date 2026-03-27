import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'

/**
 * @description KanbanColumn — droppable + sortable container with right-click context menu.
 * @param {{ columnKey, label, count, taskIds, children, onInsertTask }} props
 */
export default function KanbanColumn({ columnKey, label, count, taskIds, children, onInsertTask }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${columnKey}`,
    data: { columnKey },
  })

  const handleInsertAtEnd = () => {
    onInsertTask?.({ status_name: columnKey, order_index: count })
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          className={`flex flex-col rounded-lg border-t-4 transition-colors ${
            columnKey === 'active' ? 'border-column-my-tasks' : 'border-column-delegated'
          } ${isOver ? 'bg-accent/60 ring-2 ring-ring' : 'bg-muted/50'}`}
        >
          <div className="flex items-center justify-between px-3 py-2.5">
            <h2 className="text-sm font-semibold text-foreground">{label}</h2>
            <span className="text-xs text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">
              {count}
            </span>
          </div>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-[120px]">
              {children}
              {count === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8 italic">
                  No tasks
                </p>
              )}
            </div>
          </SortableContext>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleInsertAtEnd}>
          ＋ Insert Task Here
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
