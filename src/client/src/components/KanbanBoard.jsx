import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import TaskCard from '@/components/TaskCard'
import KanbanColumn from '@/components/KanbanColumn'
import TaskModal from '@/components/TaskModal'
import { Button } from '@/components/ui/button'
import { fetchTasks, updateTask, createTask, reorderTasks } from '@/lib/api'
import { COLUMNS } from '@/lib/constants'

/**
 * @description KanbanBoard — 2-column sortable board with DragOverlay for z-index fix.
 */
export default function KanbanBoard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const loadTasks = useCallback(() => {
    fetchTasks()
      .then((data) => { setTasks(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  const getColumnForTask = useCallback((task) => {
    for (const col of COLUMNS) {
      if (col.statuses.includes(task.status)) return col.key
    }
    return null
  }, [])

  const getTasksForColumn = useCallback((colKey) => {
    const col = COLUMNS.find((c) => c.key === colKey)
    if (!col) return []
    return tasks.filter((t) => col.statuses.includes(t.status) && t.status !== 'Done')
  }, [tasks])

  const handleDragStart = (event) => {
    setActiveTask(event.active.data.current?.task || null)
  }

  const handleDragEnd = useCallback(async (event) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const task = active.data.current?.task
    if (!task) return

    const overId = over.id.toString()
    const overColumnKey = over.data.current?.columnKey
    const overTask = over.data.current?.task

    const sourceCol = getColumnForTask(task)
    let targetCol = overColumnKey || (overTask ? getColumnForTask(overTask) : null)

    if (!targetCol) {
      if (overId.startsWith('column-')) targetCol = overId.replace('column-', '')
    }
    if (!targetCol) return

    if (sourceCol === targetCol) {
      const colTasks = getTasksForColumn(targetCol)
      const oldIndex = colTasks.findIndex((t) => t.id === task.id)
      const overTaskData = overTask || colTasks.find((t) => `task-${t.id}` === overId)
      const newIndex = overTaskData ? colTasks.findIndex((t) => t.id === overTaskData.id) : colTasks.length

      if (oldIndex === newIndex || oldIndex === -1) return

      const reordered = arrayMove(colTasks, oldIndex, newIndex)
      const updates = reordered.map((t, i) => ({ id: t.id, order_index: i }))

      setTasks((prev) => {
        const rest = prev.filter((t) => !reordered.find((r) => r.id === t.id))
        return [...rest, ...reordered.map((t, i) => ({ ...t, order_index: i }))].sort((a, b) => a.order_index - b.order_index)
      })

      try { await reorderTasks(updates) } catch { loadTasks() }
    } else {
      const targetColDef = COLUMNS.find((c) => c.key === targetCol)
      const newStatus = targetColDef?.statuses[0]
      if (!newStatus) return

      const prevTasks = [...tasks]
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t))

      try { await updateTask(task.id, { status: newStatus }) } catch { setTasks(prevTasks) }
    }
  }, [tasks, loadTasks, getColumnForTask, getTasksForColumn])

  const handleComplete = useCallback(async (task) => {
    const prevTasks = [...tasks]
    const now = new Date().toISOString()
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'Done', date_completed: now } : t))

    try { await updateTask(task.id, { status: 'Done', date_completed: now }) }
    catch { setTasks(prevTasks) }
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
        <Button onClick={() => { setError(null); setLoading(true); loadTasks() }}>Try Again</Button>
      </div>
    )
  }

  const activeTasks = tasks.filter((t) => t.status !== 'Done')

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs text-muted-foreground">{activeTasks.length} active tasks</span>
        <Button size="sm" onClick={openCreate}>+ New Task</Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 gap-4 px-4 pb-4 min-h-[calc(100vh-120px)]">
          {COLUMNS.map((col) => {
            const colTasks = getTasksForColumn(col.key)
            const taskIds = colTasks.map((t) => `task-${t.id}`)
            return (
              <KanbanColumn key={col.key} columnKey={col.key} label={col.label} count={colTasks.length} taskIds={taskIds}>
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={openEdit} onComplete={handleComplete} />
                ))}
              </KanbanColumn>
            )
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="z-50">
              <TaskCard task={activeTask} overlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={editingTask} onSave={handleSaveTask} />
    </>
  )
}
