import { useDraggable } from '@dnd-kit/core'
import { X } from 'lucide-react'

/**
 * @description TimeBlockCard — renders a scheduled block on the calendar grid.
 * Draggable for rescheduling, with a delete button.
 * @param {{ block: Object, style: Object, onDelete: Function, onClick: Function }} props
 */
export default function TimeBlockCard({ block, style, onDelete, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${block.id}`,
  })

  const isDone = block.status_name === 'done'

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ ...style, position: 'relative' }}
      className={`mx-0.5 rounded-md px-2 py-1 text-xs cursor-grab active:cursor-grabbing overflow-hidden transition-all group ${
        isDragging
          ? 'opacity-40 scale-95 bg-primary/60'
          : isDone
            ? 'bg-muted/30 border border-border text-muted-foreground opacity-75'
            : 'bg-primary/15 border border-primary/30 hover:bg-primary/25 hover:shadow-md'
      }`}
      onClick={(e) => {
        if (e.defaultPrevented) return
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SVG' && e.target.tagName !== 'path') {
          if (onClick) onClick()
        }
      }}
    >
      <div className={`font-semibold truncate leading-tight ${isDone ? 'line-through decoration-muted-foreground/50 text-muted-foreground' : 'text-foreground'}`}>
        {block.task_title}
      </div>
      {block.task_description && (
        <div className={`text-[10px] leading-tight line-clamp-2 mt-0.5 ${isDone ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-muted-foreground'}`}>
          {block.task_description}
        </div>
      )}
      <button
        className="absolute top-0.5 right-0.5 p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
        onClick={(e) => { e.stopPropagation(); onDelete(block.id) }}
        title="Remove block"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
