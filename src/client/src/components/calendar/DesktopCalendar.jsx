import { useState, useCallback, useMemo } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import CalendarBacklog from '@/components/calendar/CalendarBacklog'
import TimeBlockCard from '@/components/calendar/TimeBlockCard'
import { createTimeBlock, updateTimeBlock, deleteTimeBlock } from '@/lib/api'

const SLOT_HEIGHT = 40
const START_HOUR = 6
const END_HOUR = 22
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2

/**
 * @description Format a Date to a short label like "Mon 31".
 * @param {Date} date
 * @returns {string}
 */
function formatDayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
}

/**
 * @description Format hour for the time gutter label.
 * @param {number} hour - 24h format.
 * @returns {string}
 */
function formatHour(hour) {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

/**
 * @description A single droppable time slot in the grid.
 */
function TimeSlot({ id, dayIndex, slotIndex }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const isHourBoundary = slotIndex % 2 === 0

  return (
    <div
      ref={setNodeRef}
      className={`border-r border-border/40 transition-colors ${
        isHourBoundary ? 'border-t border-border/60' : 'border-t border-border/20'
      } ${isOver ? 'bg-primary/10' : ''}`}
      style={{ gridColumn: dayIndex + 2, gridRow: slotIndex + 2, minHeight: SLOT_HEIGHT }}
    />
  )
}

/**
 * @description A draggable backlog task chip for the overlay.
 */
function DragOverlayCard({ task }) {
  if (!task) return null
  return (
    <div className="bg-primary/90 text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium shadow-lg max-w-[200px] truncate">
      {task.title}
    </div>
  )
}

/**
 * @description DesktopCalendar — 7-day grid with time slots and unscheduled backlog sidebar.
 */
export default function DesktopCalendar({ calendarData, onTaskClick }) {
  const { days, timeBlocks, activeTasks, loading, reload, goToday, goPrev, goNext } = calendarData
  const [draggedTask, setDraggedTask] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const weekLabel = useMemo(() => {
    const end = new Date(days[6])
    const opts = { month: 'short', day: 'numeric' }
    const startStr = days[0].toLocaleDateString('en-US', opts)
    const endStr = end.toLocaleDateString('en-US', opts)
    return `${startStr} – ${endStr}`
  }, [days])

  const handleDragStart = useCallback((event) => {
    const taskId = event.active.id
    const task = activeTasks.find((t) => `backlog-${t.id}` === taskId)
    if (task) setDraggedTask(task)
  }, [activeTasks])

  const handleDragEnd = useCallback(async (event) => {
    setDraggedTask(null)
    const { active, over } = event
    if (!over) return

    const slotId = over.id
    if (typeof slotId !== 'string' || !slotId.startsWith('slot-')) return

    const parts = slotId.split('-')
    const dayIndex = parseInt(parts[1], 10)
    const slotIndex = parseInt(parts[2], 10)

    const day = new Date(days[dayIndex])
    const totalMinutes = (START_HOUR * 60) + (slotIndex * 30)
    const startHour = Math.floor(totalMinutes / 60)
    const startMin = totalMinutes % 60

    const startTime = new Date(day)
    startTime.setHours(startHour, startMin, 0, 0)
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + 30)

    // Determine which task was dragged
    let taskId = null
    const activeId = String(active.id)
    if (activeId.startsWith('backlog-')) {
      taskId = parseInt(activeId.replace('backlog-', ''), 10)
    } else if (activeId.startsWith('block-')) {
      const blockId = parseInt(activeId.replace('block-', ''), 10)
      try {
        await updateTimeBlock(blockId, { start_time: startTime.toISOString(), end_time: endTime.toISOString() })
        toast.success('Block rescheduled')
        reload()
      } catch (e) { toast.error(e.message) }
      return
    }

    if (!taskId) return

    try {
      await createTimeBlock({ task_id: taskId, start_time: startTime.toISOString(), end_time: endTime.toISOString() })
      toast.success('Task scheduled')
      reload()
    } catch (e) { toast.error(e.message) }
  }, [days, reload])

  const handleDeleteBlock = useCallback(async (blockId) => {
    try {
      await deleteTimeBlock(blockId)
      toast.success('Block removed')
      reload()
    } catch (e) { toast.error(e.message) }
  }, [reload])

  const timeSlots = useMemo(() => {
    const slots = []
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      for (let slotIndex = 0; slotIndex < TOTAL_SLOTS; slotIndex++) {
        const id = `slot-${dayIndex}-${slotIndex}`
        slots.push(<TimeSlot key={id} id={id} dayIndex={dayIndex} slotIndex={slotIndex} />)
      }
    }
    return slots
  }, [])

  const renderedBlocks = useMemo(() => {
    const dayBlocksMap = {}
    timeBlocks.forEach(block => {
      const start = new Date(block.start_time)
      const dayIndex = days.findIndex((d) => d.toDateString() === start.toDateString())
      if (dayIndex >= 0) {
        if (!dayBlocksMap[dayIndex]) dayBlocksMap[dayIndex] = []
        dayBlocksMap[dayIndex].push(block)
      }
    })

    const styledBlocks = []

    for (const [dayIdxStr, blocks] of Object.entries(dayBlocksMap)) {
      const dayIndex = Number(dayIdxStr)
      blocks.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      
      let currentGroup = []
      let groupEndMax = 0

      const layoutGroup = (group) => {
        const cols = []
        for (const b of group) {
          const bStart = new Date(b.start_time).getTime()
          let placed = false
          for (const col of cols) {
            const lastInCol = col[col.length - 1]
            if (bStart >= new Date(lastInCol.end_time).getTime()) {
              col.push(b)
              b._colIndex = cols.indexOf(col)
              placed = true
              break
            }
          }
          if (!placed) {
            cols.push([b])
            b._colIndex = cols.length - 1
          }
        }
        for (const b of group) {
          b._totalColumns = cols.length
          b._dayIndex = dayIndex
          styledBlocks.push(b)
        }
      }

      for (const block of blocks) {
        const startMs = new Date(block.start_time).getTime()
        const endMs = new Date(block.end_time).getTime()
        if (currentGroup.length === 0) {
          currentGroup = [block]
          groupEndMax = endMs
        } else {
          if (startMs < groupEndMax) {
            currentGroup.push(block)
            groupEndMax = Math.max(groupEndMax, endMs)
          } else {
            layoutGroup(currentGroup)
            currentGroup = [block]
            groupEndMax = endMs
          }
        }
      }
      if (currentGroup.length > 0) layoutGroup(currentGroup)
    }

    return styledBlocks.map((block) => {
      const blockStart = new Date(block.start_time)
      const blockEnd = new Date(block.end_time)

      const startMinutes = blockStart.getHours() * 60 + blockStart.getMinutes()
      const endMinutes = blockEnd.getHours() * 60 + blockEnd.getMinutes()
      const topSlot = (startMinutes - START_HOUR * 60) / 30
      const spanSlots = (endMinutes - startMinutes) / 30

      if (topSlot < 0 || topSlot >= TOTAL_SLOTS) return null

      return (
        <TimeBlockCard
          key={block.id}
          block={block}
          style={{
            gridColumn: block._dayIndex + 2,
            gridRow: `${Math.floor(topSlot) + 2} / span ${Math.max(1, Math.floor(spanSlots))}`,
            marginLeft: `${(block._colIndex / block._totalColumns) * 100}%`,
            width: `${100 / block._totalColumns}%`,
            zIndex: 10 + block._colIndex,
          }}
          onDelete={handleDeleteBlock}
          onClick={() => onTaskClick(block.task_id)}
        />
      )
    })
  }, [timeBlocks, days, handleDeleteBlock, onTaskClick])

  const hourLabels = useMemo(() => {
    const labels = []
    for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
      if (slot % 2 === 0) {
        const hour = START_HOUR + slot / 2
        labels.push(
          <div
            key={`label-${slot}`}
            className="text-[11px] text-muted-foreground pr-2 text-right leading-none whitespace-nowrap"
            style={{ gridColumn: 1, gridRow: slot + 2 }}
          >
            {formatHour(hour)}
          </div>
        )
      }
    }
    return labels
  }, [])

  const isToday = (date) => date.toDateString() === new Date().toDateString()

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Week Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">{weekLabel}</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={goToday} className="text-xs">Today</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Backlog Sidebar */}
          <CalendarBacklog tasks={activeTasks} loading={loading} />

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden border-l border-border">
            {/* Day Headers */}
            <div className="grid shrink-0 border-b border-border" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
              <div className="border-r border-border/40" />
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`px-2 py-2 text-center text-xs font-medium border-r border-border/40 ${
                    isToday(day) ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {formatDayLabel(day)}
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="flex-1 overflow-auto">
              <div
                className="grid relative"
                style={{
                  gridTemplateColumns: '60px repeat(7, 1fr)',
                  gridTemplateRows: `repeat(${TOTAL_SLOTS}, ${SLOT_HEIGHT}px)`,
                  gridAutoRows: `${SLOT_HEIGHT}px`,
                }}
              >
                {hourLabels}
                {timeSlots}
                {renderedBlocks}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        <DragOverlayCard task={draggedTask} />
      </DragOverlay>
    </DndContext>
  )
}
