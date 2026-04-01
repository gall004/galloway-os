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

  // Format indicator
  const future = task.future_blocks || 0
  const past = task.past_blocks || 0
  
  let indicator = ''
  if (future > 0 && past > 0) indicator = `${future} Upcoming | ${future + past} Total`
  else if (future > 0) indicator = `${future} Upcoming`
  else if (past > 0) indicator = `⚠️ Unplanned (${past} Past)`
  
  const isSafelyScheduled = future > 0

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 border-b border-border text-sm cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors ${
        isDragging ? 'opacity-50 bg-primary/10' : ''
      } ${isSafelyScheduled ? 'opacity-40 grayscale bg-muted/20' : ''}`}
    >
      <div className="font-medium text-foreground truncate">{task.title}</div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1 gap-2">
        <span className="truncate">{task.customer || 'Internal'} • {task.project}</span>
        {indicator && <span className={`shrink-0 font-medium whitespace-nowrap ${!isSafelyScheduled && past > 0 ? 'text-destructive/80' : ''}`}>{indicator}</span>}
      </div>
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
