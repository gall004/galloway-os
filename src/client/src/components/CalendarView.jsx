import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useCalendarData } from '@/hooks/useCalendarData'
import { fetchSettings } from '@/lib/api'
import DesktopCalendar from '@/components/calendar/DesktopCalendar'
import MobileAgenda from '@/components/calendar/MobileAgenda'
import { Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * @description CalendarView — responsive router that renders DesktopCalendar or MobileAgenda.
 * Guards against the feature flag being disabled.
 */
export default function CalendarView() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [authorized, setAuthorized] = useState(null)
  const calendarData = useCalendarData()

  useEffect(() => {
    fetchSettings().then((s) => {
      setAuthorized(!!s.enable_calendar)
    }).catch(() => setAuthorized(false))
  }, [])

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

  return isMobile ? (
    <MobileAgenda calendarData={calendarData} />
  ) : (
    <DesktopCalendar calendarData={calendarData} />
  )
}
