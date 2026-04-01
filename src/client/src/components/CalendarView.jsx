import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useCalendarData } from '@/hooks/useCalendarData'
import { fetchSettings, fetchConfig, updateTask, deleteTask } from '@/lib/api'
import DesktopCalendar from '@/components/calendar/DesktopCalendar'
import MobileAgenda from '@/components/calendar/MobileAgenda'
import { Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TaskModal from '@/components/TaskModal'
import { toast } from 'sonner'

/**
 * @description CalendarView — responsive router that renders DesktopCalendar or MobileAgenda.
 * Guards against the feature flag being disabled.
 */
export default function CalendarView() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [authorized, setAuthorized] = useState(null)
  const [config, setConfig] = useState({})
  const [editingTask, setEditingTask] = useState(null)
  const calendarData = useCalendarData()

  useEffect(() => {
    fetchSettings().then((s) => {
      setAuthorized(!!s.enable_calendar)
    }).catch(() => setAuthorized(false))

    Promise.all([fetchConfig('customers'), fetchConfig('projects'), fetchConfig('statuses')])
      .then(([customers, projects, statuses]) => {
        setConfig({ customers, projects, statuses })
      }).catch(console.error)
  }, [])

  const handleTaskClick = (taskId) => {
    const task = calendarData.allTasks.find(t => t.id === taskId)
    if (task) setEditingTask(task)
  }

  const handleUpdate = async (taskId, data) => {
    try {
      await updateTask(taskId, data)
      toast.success('Task updated')
      setEditingTask(null)
      calendarData.reload()
    } catch (e) { toast.error(e.message) }
  }

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId)
      toast.success('Task deleted')
      setEditingTask(null)
      calendarData.reload()
    } catch (e) { toast.error(e.message) }
  }

  if (authorized === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Calendar Mode is Disabled</h2>
        <p className="text-muted-foreground max-w-md">
          Enable Calendar Mode in Settings → Workflow to unlock the timeblocking calendar.
        </p>
        <Button variant="outline" onClick={() => navigate('/settings')}>
          Go to Settings
        </Button>
      </div>
    )
  }

  return (
    <>
      {isMobile ? (
        <MobileAgenda calendarData={calendarData} onTaskClick={handleTaskClick} />
      ) : (
        <DesktopCalendar calendarData={calendarData} onTaskClick={handleTaskClick} />
      )}
      
      <TaskModal
        open={!!editingTask}
        onOpenChange={(v) => !v && setEditingTask(null)}
        task={editingTask}
        config={config}
        onSave={handleUpdate}
        onDelete={handleDelete}
      />
    </>
  )
}
