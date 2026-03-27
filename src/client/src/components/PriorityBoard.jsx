import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import TaskCard from '@/components/TaskCard'
import PriorityColumn from '@/components/PriorityColumn'
import TaskModal from '@/components/TaskModal'
import { Button } from '@/components/ui/button'
import { fetchTasks, updateTask, createTask, deleteTask, reorderTasks, fetchConfig } from '@/lib/api'
import { COLUMNS } from '@/lib/constants'

/**
 * @description PriorityBoard — resizable board with context-menu insertion support.
 */
export default function PriorityBoard() {
  const [tasks, setTasks] = useState([])
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [insertDefaults, setInsertDefaults] = useState(null)
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const loadAll = useCallback(async () => {
    try {
      const [t, customers, projects, statuses] = await Promise.all([
        fetchTasks(), fetchConfig('customers'), fetchConfig('projects'), fetchConfig('statuses'),
      ])
      setTasks(t)
      setConfig({ customers, projects, statuses })
      setLoading(false)
    } catch (err) { setError(err.message); setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const getColumnLabel = useCallback((colKey) => {
    const status = config.statuses?.find((s) => s.name === colKey)
    return status?.label || COLUMNS.find((c) => c.key === colKey)?.label || colKey
  }, [config.statuses])

  const getColumnForTask = useCallback((task) => {
    for (const col of COLUMNS) { if (col.statusNames.includes(task.status_name)) return col.key }
    return null
  }, [])

  const getTasksForColumn = useCallback((colKey) => {
    const col = COLUMNS.find((c) => c.key === colKey)
    if (!col) return []
    return tasks.filter((t) => col.statusNames.includes(t.status_name) && t.status_name !== 'done')
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
      const newStatusName = targetCol
      const prevTasks = [...tasks]
      const newLabel = config.statuses?.find((s) => s.name === newStatusName)?.label || newStatusName
      
      const colTasks = getTasksForColumn(targetCol)
      let newIndex = colTasks.length
      const overTaskData = overTask || colTasks.find((t) => `task-${t.id}` === overId)
      
      if (overTaskData) {
        const found = colTasks.findIndex((t) => t.id === overTaskData.id)
        if (found !== -1) newIndex = found
      }

      const newColTasks = [...colTasks]
      newColTasks.splice(newIndex, 0, { ...task, status_name: newStatusName, status_label: newLabel })
      
      const targetUpdates = newColTasks.map((t, i) => ({ id: t.id, order_index: i }))

      setTasks((prev) => {
        const withoutTask = prev.filter((t) => t.id !== task.id)
        const otherTasks = withoutTask.filter((t) => t.status_name !== newStatusName)
        return [...otherTasks, ...newColTasks.map((t, i) => ({ ...t, order_index: i }))].sort((a, b) => a.order_index - b.order_index)
      })

      try {
        await updateTask(task.id, { status_name: newStatusName, order_index: newIndex })
        await reorderTasks(targetUpdates)
        toast.success('Task moved')
      } catch {
        setTasks(prevTasks)
        toast.error('Failed to move task')
      }
    }
  }, [tasks, loadAll, getColumnForTask, getTasksForColumn, config.statuses])

  const handleComplete = useCallback(async (task) => {
    const prevTasks = [...tasks]
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status_name: 'done', status_label: 'Done', date_completed: new Date().toISOString() } : t))
    try { await updateTask(task.id, { status_name: 'done', date_completed: new Date().toISOString() }); toast.success('Task completed') }
    catch { setTasks(prevTasks); toast.error('Failed to complete task') }
  }, [tasks])

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
      setModalOpen(false); setEditingTask(null); setInsertDefaults(null)
      loadAll()
    } catch (e) { toast.error(e.message) }
  }, [editingTask, loadAll])

  const openCreate = () => { setEditingTask(null); setInsertDefaults(null); setModalOpen(true) }
  const openEdit = (task) => { setEditingTask(task); setInsertDefaults(null); setModalOpen(true) }
  const openInsert = useCallback(({ status_name, order_index }) => {
    setEditingTask(null)
    setInsertDefaults({ status_name, order_index })
    setModalOpen(true)
  }, [])

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
        <span className="text-xs text-muted-foreground">{tasks.filter((t) => t.status_name !== 'done').length} active tasks</span>
        <Button size="sm" onClick={openCreate}>+ New Task</Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <ResizablePanelGroup direction="horizontal" className="px-4 pb-4 min-h-[calc(100vh-120px)]">
          <ResizablePanel defaultSize={75} minSize={20}>
            {(() => { const col = COLUMNS[0]; const colTasks = getTasksForColumn(col.key); return (
              <PriorityColumn columnKey={col.key} label={getColumnLabel(col.key)} count={colTasks.length} taskIds={colTasks.map((t) => `task-${t.id}`)} onInsertTask={openInsert}>
                {colTasks.map((task) => <TaskCard key={task.id} task={task} onClick={openEdit} onComplete={handleComplete} onDelete={handleDelete} onInsert={openInsert} />)}
              </PriorityColumn>
            ) })()}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={15}>
            {(() => { const col = COLUMNS[1]; const colTasks = getTasksForColumn(col.key); return (
              <PriorityColumn columnKey={col.key} label={getColumnLabel(col.key)} count={colTasks.length} taskIds={colTasks.map((t) => `task-${t.id}`)} onInsertTask={openInsert}>
                {colTasks.map((task) => <TaskCard key={task.id} task={task} onClick={openEdit} onComplete={handleComplete} onDelete={handleDelete} onInsert={openInsert} />)}
              </PriorityColumn>
            ) })()}
          </ResizablePanel>
        </ResizablePanelGroup>
        <DragOverlay dropAnimation={null}>{activeTask ? <div className="z-50"><TaskCard task={activeTask} overlay /></div> : null}</DragOverlay>
      </DndContext>
      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={editingTask} onSave={handleSaveTask} onDelete={handleDelete} config={config} onConfigChange={setConfig} insertDefaults={insertDefaults} />
    </>
  )
}
