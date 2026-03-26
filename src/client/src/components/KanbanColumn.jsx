import { useDroppable } from '@dnd-kit/core'

/**
 * @description KanbanColumn — a drop target for dragged task cards.
 * Uses @dnd-kit/core useDroppable.
 * @param {{ column: Object, count: number, children: React.ReactNode }} props
 */
export default function KanbanColumn({ column, count, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${column.key}`,
    data: { status: column.key },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border-t-4 transition-colors ${column.color} ${
        isOver ? 'bg-accent/60 ring-2 ring-ring' : 'bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <h2 className="text-sm font-semibold text-foreground">{column.label}</h2>
        <span className="text-xs text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-[120px]">
        {children}
        {count === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8 italic">
            No tasks
          </p>
        )}
      </div>
    </div>
  )
}
