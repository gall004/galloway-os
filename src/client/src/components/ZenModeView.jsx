import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from '@/components/TaskCard'
import { CheckCircle2, Target } from 'lucide-react'

/**
 * @description ZenModeView displays only the pinned "focused" tasks in a centered, minimalist layout.
 * @param {{ tasks: Array, onClick: Function, onComplete: Function, onDelete: Function, onToggleFocus: Function }} props
 */
export default function ZenModeView({
  tasks,
  onClick,
  onComplete,
  onDelete,
  onToggleFocus
}) {
  const focusTasks = tasks.filter((t) => t.is_focused === 1 || t.is_focused === true)
  const taskIds = focusTasks.map(t => `task-${t.id}`)

  return (
    <div className="flex-1 flex flex-col items-center pt-24 bg-background/50 h-full overflow-y-auto w-full animate-in fade-in duration-500">
      <div className="w-full max-w-2xl px-6 flex flex-col items-center pb-24">
        <div className="text-center mb-10 mt-8">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Focus Mode</h2>
          <p className="text-muted-foreground mt-2">The Rule of Three. Clear distractions. Execute.</p>
        </div>

        {focusTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted rounded-xl bg-card/50 w-full">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm font-medium">You have no active focus tasks.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Exit Focus Mode and pin up to 3 tasks to begin.</p>
          </div>
        ) : (
          <div className="w-full">
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {focusTasks.map((task) => (
                <div key={task.id} className="mb-4">
                  <TaskCard
                    task={task}
                    onClick={onClick}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onToggleFocus={onToggleFocus}
                  />
                </div>
              ))}
            </SortableContext>
          </div>
        )}
      </div>
    </div>
  )
}
