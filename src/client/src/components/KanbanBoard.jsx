import { useState, useEffect, useCallback } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import TaskCard from '@/components/TaskCard'
import KanbanColumn from '@/components/KanbanColumn'
import TaskModal from '@/components/TaskModal'
import { Button } from '@/components/ui/button'
import { fetchTasks, updateTask, createTask } from '@/lib/api'
import { COLUMNS } from '@/lib/constants'

/**
 * @description KanbanBoard — 5-column drag-and-drop board with optimistic updates.
 * Supports task creation via header button and editing via card click.
 */
export default function KanbanBoard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const loadTasks = useCallback(() => {
    fetchTasks()
      .then((data) => { setTasks(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event
    if (!over) return

    const task = active.data.current?.task
    const newStatus = over.data.current?.status
    if (!task || !newStatus || task.status === newStatus) return

    const prevTasks = [...tasks]
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    )

    try {
      await updateTask(task.id, { status: newStatus })
    } catch {
      setTasks(prevTasks)
    }
  }, [tasks])

  const handleSaveTask = useCallback(async (taskData) => {
    if (editingTask) {
      const updated = await updateTask(editingTask.id, taskData)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } else {
      const created = await createTask(taskData)
      setTasks((prev) => [created, ...prev])
    }
    setModalOpen(false)
    setEditingTask(null)
  }, [editingTask])

  const openCreate = () => { setEditingTask(null); setModalOpen(true) }
  const openEdit = (task) => { setEditingTask(task); setModalOpen(true) }

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
        <Button onClick={() => { setError(null); setLoading(true); loadTasks() }}>
          Try Again
        </Button>
      </div>
    )
  }

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key)
    return acc
  }, {})

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs text-muted-foreground">{tasks.length} tasks</span>
        <Button size="sm" onClick={openCreate}>+ New Task</Button>
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-4 px-4 pb-4 min-h-[calc(100vh-120px)]">
          {COLUMNS.map((col) => (
            <KanbanColumn key={col.key} column={col} count={tasksByStatus[col.key]?.length || 0}>
              {tasksByStatus[col.key]?.map((task) => (
                <TaskCard key={task.id} task={task} onClick={openEdit} />
              ))}
            </KanbanColumn>
          ))}
        </div>
      </DndContext>
      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editingTask}
        onSave={handleSaveTask}
      />
    </>
  )
}
