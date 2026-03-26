import { useState, useEffect } from 'react'
import TaskCard from '@/components/TaskCard'
import { fetchTasks } from '@/lib/api'

const COLUMNS = [
  { key: 'Backlog', label: 'Backlog', color: 'border-slate-300 dark:border-slate-700' },
  { key: 'Next Up', label: 'Next Up', color: 'border-blue-400 dark:border-blue-600' },
  { key: 'In Progress', label: 'In Progress', color: 'border-amber-400 dark:border-amber-600' },
  { key: 'Delegated/Waiting', label: 'Delegated / Waiting', color: 'border-orange-400 dark:border-orange-600' },
  { key: 'Done', label: 'Done', color: 'border-emerald-400 dark:border-emerald-600' },
]

/**
 * @description KanbanBoard — renders 5 columns and maps tasks into them by status.
 * Fetches tasks from the backend API on mount.
 */
export default function KanbanBoard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTasks()
      .then((data) => {
        setTasks(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground animate-pulse">Loading tasks…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <p className="text-destructive font-medium">Failed to load tasks</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-5 gap-4 p-4 min-h-[calc(100vh-80px)]">
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          className={`flex flex-col rounded-lg bg-muted/50 border-t-4 ${col.color}`}
        >
          <div className="flex items-center justify-between px-3 py-2.5">
            <h2 className="text-sm font-semibold text-foreground">{col.label}</h2>
            <span className="text-xs text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">
              {tasksByStatus[col.key]?.length || 0}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {tasksByStatus[col.key]?.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {tasksByStatus[col.key]?.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8 italic">
                No tasks
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
