import React, { useState, useEffect, useCallback, useRef } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import TaskCard from '@/components/TaskCard'
import PriorityColumn from '@/components/PriorityColumn'
import TaskModal from '@/components/TaskModal'
import ImpactCaptureModal from '@/components/ImpactCaptureModal'
import { Button } from '@/components/ui/button'
import ZenModeView from '@/components/ZenModeView'
import { Target } from 'lucide-react'
import { fetchTasks, updateTask, createTask, deleteTask, reorderTasks, fetchConfig } from '@/lib/api'
import { COLUMNS } from '@/lib/constants'
import InboxQuickAdd from '@/components/InboxQuickAdd'

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
  const [impactOpen, setImpactOpen] = useState(false)
  const [completingTask, setCompletingTask] = useState(null)
  const [isZenModeEnabled, setIsZenModeEnabled] = useState(false)
  const dragStartStatus = useRef(null)

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



  const getTasksForColumn = useCallback((colKey) => {
    const col = COLUMNS.find((c) => c.key === colKey)
    if (!col) return []
    return tasks.filter((t) => col.statusNames.includes(t.status_name) && t.status_name !== 'done')
  }, [tasks])

  const handleDragStart = (event) => {
    const task = event.active.data.current?.task || null
    dragStartStatus.current = task?.status_name || null
    setActiveTask(task)
  }

  const handleDragOver = useCallback((event) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id.toString().replace('task-', '')
    const overId = over.id.toString()
    
    const activeTask = tasks.find(t => t.id.toString() === activeId)
    if (!activeTask) return
    const activeContainer = activeTask.status_name

    let overContainer = null
    if (overId.startsWith('column-')) overContainer = overId.replace('column-', '')
    else overContainer = tasks.find(t => `task-${t.id}` === overId)?.status_name

    if (!overContainer || activeContainer === overContainer) return

    setTasks((prev) => {
      const activeItems = prev.filter(t => t.status_name === activeContainer && t.status_name !== 'done')
      const overItems = prev.filter(t => t.status_name === overContainer && t.status_name !== 'done')
      
      const newActiveTask = { ...activeTask, status_name: overContainer, status_label: config.statuses?.find(s => s.name === overContainer)?.label || overContainer }

      let overIndex = overItems.length
      if (!overId.startsWith('column-')) {
        const overTaskId = overId.replace('task-', '')
        const foundIndex = overItems.findIndex(t => t.id.toString() === overTaskId)
        if (foundIndex !== -1) {
          const isBelowOverItem =
            over && active.rect.current.translated &&
            active.rect.current.translated.top > over.rect.top + over.rect.height / 2
          overIndex = isBelowOverItem ? foundIndex + 1 : foundIndex
        }
      }

      const newOverItems = [...overItems]
      newOverItems.splice(overIndex, 0, newActiveTask)
      
      const sortedOverItems = newOverItems.map((t, i) => ({ ...t, order_index: i }))
      const sortedActiveItems = activeItems.filter(t => t.id.toString() !== activeId).map((t, i) => ({ ...t, order_index: i }))
      const otherItems = prev.filter(t => t.id.toString() !== activeId && t.status_name !== activeContainer && t.status_name !== overContainer && t.status_name !== 'done')
      const doneItems = prev.filter(t => t.status_name === 'done')

      return [...otherItems, ...doneItems, ...sortedActiveItems, ...sortedOverItems].sort((a,b) => a.order_index - b.order_index)
    })
  }, [tasks, config.statuses])

  const handleDragEnd = useCallback(async (event) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) {
      loadAll() 
      return
    }

    const activeId = active.id.toString().replace('task-', '')
    const originalTask = active.data.current?.task
    if (!originalTask) return

    const currentTask = tasks.find(t => t.id.toString() === activeId)
    if (!currentTask) return
    const finalContainer = currentTask.status_name

    const colTasks = tasks.filter(t => t.status_name === finalContainer && t.status_name !== 'done').sort((a,b) => a.order_index - b.order_index)
    const oldIndex = colTasks.findIndex(t => t.id.toString() === activeId)
    
    const overId = over.id.toString()
    let newIndex = colTasks.length - 1
    
    if (!overId.startsWith('column-')) {
      const overTaskId = overId.replace('task-', '')
      const found = colTasks.findIndex(t => t.id.toString() === overTaskId)
      if (found !== -1) {
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height / 2
        newIndex = isBelowOverItem ? found + 1 : found
      }
    }

    if (newIndex > colTasks.length - 1) newIndex = colTasks.length - 1
    if (oldIndex === -1 || newIndex === -1) {
      loadAll()
      return
    }

    let targetUpdates = null
    
    if (oldIndex !== newIndex) {
      const reordered = arrayMove(colTasks, oldIndex, newIndex)
      targetUpdates = reordered.map((t, i) => ({ id: t.id, order_index: i }))
      
      setTasks(prev => {
        const others = prev.filter(t => t.status_name !== finalContainer && t.status_name !== 'done')
        const doneItems = prev.filter(t => t.status_name === 'done')
        return [...others, ...doneItems, ...reordered.map((t, i) => ({ ...t, order_index: i }))].sort((a,b) => a.order_index - b.order_index)
      })
    } else {
      targetUpdates = colTasks.map((t, i) => ({ id: t.id, order_index: i }))
    }

    try {
      if (dragStartStatus.current && dragStartStatus.current !== finalContainer) {
        await updateTask(originalTask.id, { status_name: finalContainer, order_index: newIndex })
        toast.success('Task moved')
      }
      // Guarantee order_index sequential syncs even on complex cross container landings
      await reorderTasks(targetUpdates)
    } catch {
      loadAll()
      toast.error('Failed to sync changes')
    }
  }, [tasks, loadAll])

  const handleComplete = useCallback((task) => {
    setCompletingTask(task)
    setImpactOpen(true)
  }, [])

  const handleConfirmComplete = useCallback(async (task, impactStatement) => {
    const prevTasks = [...tasks]
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status_name: 'done', status_label: 'Done', date_completed: new Date().toISOString(), impact_statement: impactStatement } : t))
    try {
      await updateTask(task.id, { status_name: 'done', date_completed: new Date().toISOString(), impact_statement: impactStatement })
      toast.success('Task completed')
    } catch {
      setTasks(prevTasks)
      toast.error('Failed to complete task')
    }
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

  const handleToggleFocus = useCallback(async (task) => {
    try {
      const updated = await updateTask(task.id, { is_focused: !task.is_focused })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      toast.success(updated.is_focused ? 'Pinned to focus' : 'Unpinned from focus')
    } catch (e) {
      toast.error(e.message || 'Failed to toggle focus')
    }
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
        <div className="flex items-center gap-2">
          <Button 
            variant={isZenModeEnabled ? "default" : "secondary"} 
            size="sm" 
            onClick={() => setIsZenModeEnabled(!isZenModeEnabled)}
            className={isZenModeEnabled ? "" : "bg-primary/10 text-primary hover:bg-primary/20"}
          >
            <Target className="w-4 h-4 mr-2" />
            {isZenModeEnabled ? 'Exit Focus Mode' : 'Enter Focus Mode'}
          </Button>
          <Button size="sm" onClick={openCreate}>+ New Task</Button>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        {isZenModeEnabled ? (
          <ZenModeView
            tasks={tasks}
            onClick={openEdit}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onToggleFocus={handleToggleFocus}
          />
        ) : (
          <ResizablePanelGroup direction="horizontal" className="px-4 pb-4 h-[calc(100vh-120px)]">
            {COLUMNS.map((col, idx) => {
              const colTasks = getTasksForColumn(col.key);
              const isInbox = col.key === 'inbox';
              return (
                <React.Fragment key={col.key}>
                  <ResizablePanel defaultSize={isInbox ? 20 : col.key === 'active' ? 60 : 20} minSize={15}>
                    <PriorityColumn
                      columnKey={col.key}
                      label={getColumnLabel(col.key)}
                      count={colTasks.length}
                      taskIds={colTasks.map((t) => `task-${t.id}`)}
                      onInsertTask={openInsert}
                    >
                      {isInbox && (
                        <InboxQuickAdd 
                          onSave={(title) => handleSaveTask({ title, status_name: 'inbox', order_index: 0 })} 
                        />
                      )}
                      {colTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={openEdit}
                          onComplete={handleComplete}
                          onDelete={handleDelete}
                          onInsert={openInsert}
                          onToggleFocus={handleToggleFocus}
                        />
                      ))}
                    </PriorityColumn>
                  </ResizablePanel>
                  {idx < COLUMNS.length - 1 && <ResizableHandle withHandle />}
                </React.Fragment>
              );
            })}
          </ResizablePanelGroup>
        )}
        {!isZenModeEnabled && (
          <DragOverlay dropAnimation={null}>{activeTask ? <div className="z-50 opacity-95 rotate-2 cursor-grabbing shadow-2xl"><TaskCard task={activeTask} overlay /></div> : null}</DragOverlay>
        )}
      </DndContext>
      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={editingTask} onSave={handleSaveTask} onDelete={handleDelete} config={config} onConfigChange={setConfig} insertDefaults={insertDefaults} />
      <ImpactCaptureModal open={impactOpen} onOpenChange={setImpactOpen} task={completingTask} onConfirm={handleConfirmComplete} />
    </>
  )
}
