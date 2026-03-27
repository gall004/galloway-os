import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import TaskCard from '@/components/TaskCard'
import KanbanColumn from '@/components/KanbanColumn'
import TaskModal from '@/components/TaskModal'
import { Button } from '@/components/ui/button'
import { fetchTasks, updateTask, createTask, deleteTask, reorderTasks, fetchConfig } from '@/lib/api'
import { COLUMNS } from '@/lib/constants'

/**
 * @description KanbanBoard — 2-column sortable board with config-driven FK dropdowns.
 */
export default function KanbanBoard() {
  const [tasks, setTasks] = useState([])
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const loadAll = useCallback(async () => {
    try {
      const [t, priorities, statuses, workstreams, customers, projects] = await Promise.all([
        fetchTasks(), fetchConfig('priorities'), fetchConfig('statuses'),
        fetchConfig('workstreams'), fetchConfig('customers'), fetchConfig('projects'),
      ])
      setTasks(t)
      setConfig({ priorities, statuses, workstreams, customers, projects })
      setLoading(false)
    } catch (err) { setError(err.message); setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const getColumnForTask = useCallback((task) => {
    for (const col of COLUMNS) { if (col.statusNames.includes(task.status)) return col.key }
    return null
  }, [])

  const getTasksForColumn = useCallback((colKey) => {
    const col = COLUMNS.find((c) => c.key === colKey)
    if (!col) return []
    return tasks.filter((t) => col.statusNames.includes(t.status) && t.status !== 'Done')
  }, [tasks])

  const handleDragStart = (event) => setActiveTask(event.active.data.current?.task || null)

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
    if (!targetCol && overId.startsWith('column-')) targetCol = overId.replace('column-', '')
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
      try { await reorderTasks(updates) } catch { loadAll() }
    } else {
      const targetColDef = COLUMNS.find((c) => c.key === targetCol)
      const newStatusName = targetColDef?.statusNames[0]
      const newStatusId = config.statuses?.find((s) => s.name === newStatusName)?.id
      if (!newStatusId) return
      const prevTasks = [...tasks]
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatusName, status_id: newStatusId } : t))
      try { await updateTask(task.id, { status_id: newStatusId }); toast.success('Task moved') }
      catch { setTasks(prevTasks); toast.error('Failed to move task') }
    }
  }, [tasks, loadAll, getColumnForTask, getTasksForColumn, config.statuses])

  const handleComplete = useCallback(async (task) => {
    const doneId = config.statuses?.find((s) => s.name === 'Done')?.id
    if (!doneId) return
    const prevTasks = [...tasks]
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'Done', date_completed: new Date().toISOString() } : t))
    try { await updateTask(task.id, { status_id: doneId, date_completed: new Date().toISOString() }); toast.success('Task completed') }
    catch { setTasks(prevTasks); toast.error('Failed to complete task') }
  }, [tasks, config.statuses])

  const handleDelete = useCallback(async (task) => {
    const prevTasks = [...tasks]
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    try { await deleteTask(task.id); toast.success('Task deleted') }
    catch { setTasks(prevTasks); toast.error('Failed to delete task') }
  }, [tasks])

  const handleSaveTask = useCallback(async (taskData) => {
    try {
      if (editingTask) {
        const updated = await updateTask(editingTask.id, taskData)
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        toast.success('Task updated')
      } else {
        const created = await createTask(taskData)
        setTasks((prev) => [created, ...prev])
        toast.success('Task created')
      }
      setModalOpen(false); setEditingTask(null)
    } catch (e) { toast.error(e.message) }
  }, [editingTask])

  const openCreate = () => { setEditingTask(null); setModalOpen(true) }
  const openEdit = (task) => { setEditingTask(task); setModalOpen(true) }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground animate-pulse">Loading tasks…</p></div>
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <p className="text-destructive font-medium">Failed to load tasks</p>
      <Button onClick={() => { setError(null); setLoading(true); loadAll() }}>Try Again</Button>
    </div>
  )

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs text-muted-foreground">{tasks.filter((t) => t.status !== 'Done').length} active tasks</span>
        <Button size="sm" onClick={openCreate}>+ New Task</Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 gap-4 px-4 pb-4 min-h-[calc(100vh-120px)]">
          {COLUMNS.map((col) => {
            const colTasks = getTasksForColumn(col.key)
            return (
              <KanbanColumn key={col.key} columnKey={col.key} label={col.label} count={colTasks.length} taskIds={colTasks.map((t) => `task-${t.id}`)}>
                {colTasks.map((task) => <TaskCard key={task.id} task={task} onClick={openEdit} onComplete={handleComplete} onDelete={handleDelete} />)}
              </KanbanColumn>
            )
          })}
        </div>
        <DragOverlay dropAnimation={null}>{activeTask ? <div className="z-50"><TaskCard task={activeTask} overlay /></div> : null}</DragOverlay>
      </DndContext>
      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={editingTask} onSave={handleSaveTask} onDelete={handleDelete} config={config} />
    </>
  )
}
