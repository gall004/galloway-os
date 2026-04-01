import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Loader2, X } from 'lucide-react'
import { createTimeBlock, deleteTimeBlock } from '@/lib/api'
import { toast } from 'sonner'
import MobileScheduleSheet from '@/components/calendar/MobileScheduleSheet'

/**
 * @description MobileAgenda — 1-day agenda with horizontal date selector and tap-to-schedule.
 * @param {{ calendarData: Object }} props
 */
export default function MobileAgenda({ calendarData }) {
  const { days, timeBlocks, activeTasks, loading, reload, goToday, goPrev, goNext } = calendarData
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date()
    const idx = days.findIndex((d) => d.toDateString() === today.toDateString())
    return idx >= 0 ? idx : 0
  })
  const [sheetOpen, setSheetOpen] = useState(false)

  const selectedDay = days[selectedDayIndex] || days[0]

  const dayBlocks = useMemo(() => {
    return timeBlocks
      .filter((b) => {
        const start = new Date(b.start_time)
        return start.toDateString() === selectedDay.toDateString()
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  }, [timeBlocks, selectedDay])

  const handleSchedule = async (taskId, date, startHour, startMinute, duration) => {
    const start = new Date(date)
    start.setHours(startHour, startMinute, 0, 0)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + duration)

    try {
      await createTimeBlock({
        task_id: taskId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      toast.success('Task scheduled')
      setSheetOpen(false)
      reload()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleDeleteBlock = async (blockId) => {
    try {
      await deleteTimeBlock(blockId)
      toast.success('Block removed')
      reload()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const isToday = (date) => date.toDateString() === new Date().toDateString()

  const weekLabel = useMemo(() => {
    const opts = { month: 'short', day: 'numeric' }
    return `${days[0].toLocaleDateString('en-US', opts)} – ${days[6].toLocaleDateString('en-US', opts)}`
  }, [days])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Week Navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{weekLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={goToday}>Today</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Day Selector Strip */}
      <div className="flex gap-1 px-3 py-2 border-b border-border shrink-0 overflow-x-auto">
        {days.map((day, i) => (
          <button
            key={i}
            onClick={() => setSelectedDayIndex(i)}
            className={`flex flex-col items-center min-w-[44px] px-2 py-1.5 rounded-lg text-xs transition-all ${
              i === selectedDayIndex
                ? 'bg-primary text-primary-foreground shadow-sm'
                : isToday(day)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <span className="text-[10px] uppercase font-medium">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <span className="text-base font-semibold leading-tight">{day.getDate()}</span>
          </button>
        ))}
      </div>

      {/* Day Agenda */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <h3 className="text-sm font-semibold mb-3">
          {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : dayBlocks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No scheduled blocks for this day</p>
            <p className="text-xs mt-1">Tap + to schedule a task</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayBlocks.map((block) => {
              const start = new Date(block.start_time)
              const end = new Date(block.end_time)
              const timeStr = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
              return (
                <div
                  key={block.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-primary/20 bg-primary/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{block.task_title}</div>
                    <div className="text-xs text-muted-foreground">{timeStr}</div>
                  </div>
                  <button
                    className="p-1 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    onClick={() => handleDeleteBlock(block.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 right-6">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setSheetOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <MobileScheduleSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tasks={activeTasks}
        selectedDay={selectedDay}
        onSchedule={handleSchedule}
      />
    </div>
  )
}
