import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, AppWindow, Inbox, Settings, Layers, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetDescription, SheetClose } from '@/components/ui/sheet'
import { fetchSettings } from '@/lib/api'

/**
 * @description Compute time-of-day greeting based on local hour.
 * @returns {string} A greeting string like "Good morning".
 */
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * @description AppHeader — navigation bar with personalized greeting and theme toggle.
 */
export default function AppHeader() {
  const { pathname } = useLocation()
  const [calendarEnabled, setCalendarEnabled] = useState(false)

  useEffect(() => {
    fetchSettings().then((s) => setCalendarEnabled(!!s.enable_calendar)).catch(() => {})
  }, [])

  const links = [
    { to: '/', label: 'Board', icon: Inbox },
    ...(calendarEnabled ? [{ to: '/calendar', label: 'Calendar', icon: CalendarDays }] : []),
    { to: '/dashboard', label: 'Insights', icon: AppWindow },
    { to: '/archive', label: 'Archive', icon: Layers },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <header className="border-b border-border px-4 md:px-6 py-3 flex items-center gap-4 md:gap-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle className="font-heading font-bold tracking-tight">{getGreeting()}, Nathan</SheetTitle>
            <SheetDescription className="sr-only">Navigation Menu</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-1 mt-2">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <SheetClose asChild key={link.to}>
                  <Link
                    to={link.to}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-base rounded-lg transition-colors',
                      pathname === link.to
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {link.label}
                  </Link>
                </SheetClose>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="flex items-center gap-2 text-lg font-heading font-semibold text-foreground tracking-tight mr-auto">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 46" className="w-5 h-5 shrink-0">
          <path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
        </svg>
        {getGreeting()}, Nathan
      </h1>

      <nav className="hidden md:flex gap-1">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-200',
                pathname === link.to
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
