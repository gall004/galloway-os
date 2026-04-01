import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'

/**
 * @description A draggable backlog task item.
 */
function BacklogItem({ task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `backlog-${task.id}`,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`px-3 py-2 rounded-md border border-border bg-card text-sm cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-40 scale-95' : 'hover:bg-muted/50 hover:shadow-sm'
      }`}
    >
      <div className="font-medium truncate">{task.title}</div>
      {(task.project_name || task.customer_name) && (
        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
          {[task.project_name, task.customer_name].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  )
}

/**
 * @description CalendarBacklog — vertical list of unscheduled tasks with search filter.
 * @param {{ tasks: Array, loading: boolean }} props
 */
export default function CalendarBacklog({ tasks, loading }) {
  const [search, setSearch] = useState('')

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-[260px] shrink-0 flex flex-col border-r border-border bg-muted/20">
      <div className="px-3 py-3 border-b border-border shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Tasks</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter tasks…"
            className="h-8 text-xs pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto px-2 py-2 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            {search ? 'No matching tasks' : 'No active tasks!'}
          </p>
        ) : (
          filtered.map((task) => <BacklogItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}
