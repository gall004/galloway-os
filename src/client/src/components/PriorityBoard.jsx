import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import TaskCard from '@/components/TaskCard'
import PriorityColumn from '@/components/PriorityColumn'
import TaskModal from '@/components/TaskModal'
import ImpactCaptureModal from '@/components/ImpactCaptureModal'
import { Button } from '@/components/ui/button'
import ZenModeView from '@/components/ZenModeView'
import { Target } from 'lucide-react'
import { fetchTasks, updateTask, createTask, deleteTask, reorderTasks, fetchConfig, fetchSettings } from '@/lib/api'
import InboxQuickAdd from '@/components/InboxQuickAdd'

function CarouselTabs({ columns, getColumnLabel }) {
  const { api } = useCarousel()
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap())
    api.on("select", onSelect)
    api.on("reInit", onSelect)
    return () => { api.off("select", onSelect); api.off("reInit", onSelect) }
  }, [api])

  return (
    <div className="flex justify-center gap-2 mb-4 px-4 pt-2">
      {columns.map((col, index) => (
        <Button
          key={col.name}
          variant={selectedIndex === index ? "default" : "secondary"}
          size="sm"
          onClick={() => api?.scrollTo(index)}
          className="text-xs px-4 h-8 rounded-full shadow-sm"
        >
          {getColumnLabel(col.name)}
        </Button>
      ))}
    </div>
  )
}

/**
 * @description PriorityBoard — dynamically rendered from API statuses and app_settings.
 */
export default function PriorityBoard() {
  const [tasks, setTasks] = useState([])
  const [config, setConfig] = useState({})
  const [settings, setSettings] = useState(null)
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
      const [t, customers, projects, statuses, appSettings] = await Promise.all([
        fetchTasks(), fetchConfig('customers'), fetchConfig('projects'), fetchConfig('statuses'), fetchSettings(),
      ])
      setTasks(t)
      setConfig({ customers, projects, statuses })
      setSettings(appSettings)
      setLoading(false)
    } catch (err) { setError(err.message); setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const columns = useMemo(() => {
    if (!config.statuses || !settings) return []
    return config.statuses.filter((s) => {
      if (s.name === 'done') return false
      if (s.system_name === 'inbox' && !settings.inbox_mode) return false
      if (s.system_name === 'delegated' && !settings.manager_mode) return false
      return true
    })
  }, [config.statuses, settings])

  const getColumnLabel = useCallback((colName) => {
    const status = config.statuses?.find((s) => s.name === colName)
    return status?.label || colName
  }, [config.statuses])

  const getTasksForColumn = useCallback((colName) => {
    return tasks.filter((t) => t.status_name === colName && t.status_name !== 'done')
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
    
    const activeTaskItem = tasks.find(t => t.id.toString() === activeId)
    if (!activeTaskItem) return
    const activeContainer = activeTaskItem.status_name

    let overContainer = null
    if (overId.startsWith('column-')) overContainer = overId.replace('column-', '')
    else overContainer = tasks.find(t => `task-${t.id}` === overId)?.status_name

    if (!overContainer || activeContainer === overContainer) return

    setTasks((prev) => {
      const activeItems = prev.filter(t => t.status_name === activeContainer && t.status_name !== 'done')
      const overItems = prev.filter(t => t.status_name === overContainer && t.status_name !== 'done')
      
      const newActiveTask = { ...activeTaskItem, status_name: overContainer, status_label: config.statuses?.find(s => s.name === overContainer)?.label || overContainer }

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
          <>
            {/* Desktop View */}
            <ResizablePanelGroup direction="horizontal" className="hidden! md:flex! px-4 pb-4 h-[calc(100vh-120px)] max-h-[calc(100vh-120px)] overflow-hidden">
              {columns.map((col, idx) => {
                const colTasks = getTasksForColumn(col.name);
                const isInbox = col.system_name === 'inbox';
                const panelSize = isInbox ? 20 : col.system_name === 'active' ? Math.floor(80 / columns.length) : Math.floor(80 / columns.length);
                return (
                  <React.Fragment key={col.name}>
                    <ResizablePanel defaultSize={panelSize} minSize={15} className="h-full flex flex-col min-h-0">
                      <PriorityColumn
                        columnKey={col.name}
                        label={getColumnLabel(col.name)}
                        count={colTasks.length}
                        taskIds={colTasks.map((t) => `task-${t.id}`)}
                        onInsertTask={openInsert}
                        headerSlot={
                          isInbox && (
                            <InboxQuickAdd 
                              onSave={(title) => handleSaveTask({ title, status_name: 'inbox', order_index: 0 })} 
                            />
                          )
                        }
                      >
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
                    {idx < columns.length - 1 && <ResizableHandle withHandle />}
                  </React.Fragment>
                );
              })}
            </ResizablePanelGroup>

            {/* Mobile View */}
            <div className="md:hidden px-4 pb-4 h-[calc(100vh-120px)] relative">
              <Carousel 
                className="w-full h-full flex flex-col" 
                opts={{ loop: false, align: "start" }}
              >
                <CarouselTabs columns={columns} getColumnLabel={getColumnLabel} />
                
                <CarouselContent className="flex-1 min-h-0">
                  {columns.map((col) => {
                    const colTasks = getTasksForColumn(col.name);
                    const isInbox = col.system_name === 'inbox';
                    return (
                      <CarouselItem key={col.name} className="h-full flex flex-col min-h-0 basis-full px-2">
                        <PriorityColumn
                          columnKey={col.name}
                          label={getColumnLabel(col.name)}
                          count={colTasks.length}
                          taskIds={colTasks.map((t) => `task-${t.id}`)}
                          onInsertTask={openInsert}
                          headerSlot={
                            isInbox && (
                              <InboxQuickAdd 
                                onSave={(title) => handleSaveTask({ title, status_name: 'inbox', order_index: 0 })} 
                              />
                            )
                          }
                        >
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
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
            </div>
          </>
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
