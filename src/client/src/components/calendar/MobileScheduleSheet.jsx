import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

const START_HOUR = 0
const END_HOUR = 24

/**
 * @description Generate time slot options for the schedule picker.
 * @returns {Array<{ value: string, label: string, hour: number, minute: number }>}
 */
function generateTimeOptions() {
  const options = []
  const hours = Array.from({ length: 24 }, (_, i) => i)
  for (const h of hours) {
    for (let m = 0; m < 60; m += 30) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      const ampm = h < 12 ? 'AM' : 'PM'
      const label = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
      options.push({ value: `${h}-${m}`, label, hour: h, minute: m })
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

/**
 * @description MobileScheduleSheet — bottom sheet for tap-to-schedule on mobile.
 * @param {{ open, onOpenChange, tasks, selectedDay, onSchedule }} props
 */
export default function MobileScheduleSheet({ open, onOpenChange, tasks, selectedDay, onSchedule }) {
  const [search, setSearch] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedTime, setSelectedTime] = useState(`${9}-${0}`)
  const [duration, setDuration] = useState('30')

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirm = () => {
    if (!selectedTask) return
    const parts = selectedTime.split('-')
    const hour = parseInt(parts[0], 10)
    const minute = parseInt(parts[1], 10)
    onSchedule(selectedTask.id, selectedDay, hour, minute, parseInt(duration, 10))
    setSelectedTask(null)
    setSearch('')
  }

  const handleClose = (isOpen) => {
    if (!isOpen) {
      setSelectedTask(null)
      setSearch('')
    }
    onOpenChange(isOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="max-h-[80vh] flex flex-col rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{selectedTask ? 'Schedule Task' : 'Select a Task'}</SheetTitle>
          <SheetDescription>
            {selectedTask
              ? `Schedule "${selectedTask.title}" for ${selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
              : 'Choose an active task to add to your calendar'}
          </SheetDescription>
        </SheetHeader>

        {selectedTask ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedTask(null)}>Back</Button>
              <Button className="flex-1" onClick={handleConfirm}>Schedule</Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 py-2">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tasks…"
                className="h-9 text-sm pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {search ? 'No matching tasks' : 'No active tasks!'}
                </p>
              ) : (
                filtered.map((task) => {
                  const future = task.future_blocks || 0
                  const past = task.past_blocks || 0
                  let indicator = ''
                  if (future > 0 && past > 0) indicator = `${future} Upcoming | ${future + past} Total`
                  else if (future > 0) indicator = `${future} Upcoming`
                  else if (past > 0) indicator = `⚠️ Unplanned (${past} Past)`
                  const isSafelyScheduled = future > 0

                  return (
                    <button
                      key={task.id}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        task.id === selectedTask?.id
                          ? 'border-primary bg-primary/10'
                          : isSafelyScheduled
                            ? 'opacity-50 grayscale border-border bg-muted/20 hover:bg-muted/50'
                            : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="font-medium text-foreground truncate">{task.title}</div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5 gap-2">
                        <span className="truncate">{task.customer || 'Internal'} • {task.project}</span>
                        {indicator && <span className={`shrink-0 font-medium whitespace-nowrap ${!isSafelyScheduled && past > 0 ? 'text-destructive/80' : ''}`}>{indicator}</span>}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
