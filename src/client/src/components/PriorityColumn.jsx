import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'

/**
 * @description PriorityColumn — droppable + sortable container with right-click context menu.
 * @param {{ columnKey, label, count, taskIds, children, headerSlot, onInsertTask }} props
 */
export default function PriorityColumn({ columnKey, label, count, taskIds, children, headerSlot, onInsertTask }) {
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
          className={`flex flex-col h-full min-h-0 rounded-lg border-t-4 transition-all duration-200 ${
            columnKey === 'active' ? 'border-column-my-tasks' :
            columnKey === 'delegated' ? 'border-column-delegated' :
            'border-column-inbox'
          } ${isOver ? 'bg-primary/5 ring-2 ring-primary/60 ring-inset shadow-sm scale-[1.01]' : 'bg-muted/50'}`}
        >
          <div className="flex items-center justify-between px-3 py-2.5">
            <h2 className="text-sm font-semibold text-foreground">{label}</h2>
            <span className="text-xs text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">
              {count}
            </span>
          </div>
          {headerSlot && (
            <div className="px-2 pb-2">
              {headerSlot}
            </div>
          )}
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1 min-h-[120px]">
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
          ＋ Insert Task at Bottom
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
