import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'

/**
 * @description Curated palette of visually distinct column colors.
 * Each entry is an oklch hue angle. Columns are assigned by index, cycling through.
 */
const COLUMN_HUES = [250, 150, 55, 340, 200, 100, 20, 280]

/**
 * @description Generate CSS color strings for a column based on its palette index.
 * Returns border color, header tint, and body tint.
 * @param {number} index - Column's positional index in the board.
 * @returns {{ border: string, headerBg: string, bodyBg: string }}
 */
function getColumnColors(index) {
  const hue = COLUMN_HUES[index % COLUMN_HUES.length]
  return {
    border: `oklch(0.55 0.14 ${hue})`,
    headerBg: `oklch(0.55 0.14 ${hue} / 0.12)`,
    bodyBg: `oklch(0.55 0.14 ${hue} / 0.04)`,
  }
}

/**
 * @description PriorityColumn — droppable + sortable container with auto-colored headers and micro-animations.
 * @param {{ columnKey, label, count, taskIds, children, headerSlot, onInsertTask, colorIndex }} props
 */
export default function PriorityColumn({ columnKey, label, count, taskIds, children, headerSlot, onInsertTask, colorIndex = 0 }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${columnKey}`,
    data: { columnKey },
  })

  const colors = getColumnColors(colorIndex)

  const handleInsertAtEnd = () => {
    onInsertTask?.({ status_name: columnKey, order_index: count })
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          className={`flex flex-col flex-1 h-full min-h-0 rounded-lg border-t-4 transition-all duration-300 ${
            isOver ? 'ring-2 ring-primary/60 ring-inset shadow-md scale-[1.01]' : ''
          }`}
          style={{
            borderTopColor: colors.border,
            backgroundColor: isOver ? undefined : colors.bodyBg,
          }}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ backgroundColor: colors.headerBg }}
          >
            <h2 className="text-sm font-semibold text-foreground tracking-tight">{label}</h2>
            <span className="text-xs text-muted-foreground font-medium bg-background/60 rounded-full px-2 py-0.5 tabular-nums">
              {count}
            </span>
          </div>
          {headerSlot && (
            <div className="px-2 pt-2.5">
              {headerSlot}
            </div>
          )}
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="flex-1 overflow-y-auto px-2 pb-2 pt-2.5 min-h-[120px]">
              {children}
              {count === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8 italic opacity-60">
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
