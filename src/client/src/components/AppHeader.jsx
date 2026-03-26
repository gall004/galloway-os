import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'

/**
 * @description AppHeader — navigation bar with theme toggle.
 */
export default function AppHeader() {
  const { pathname } = useLocation()

  return (
    <header className="border-b border-border px-6 py-3 flex items-center gap-6">
      <h1 className="text-lg font-heading font-bold text-foreground tracking-tight mr-auto">
        galloway-os
      </h1>
      <nav className="flex gap-1">
        <Link
          to="/"
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            pathname === '/'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Kanban
        </Link>
        <Link
          to="/dashboard"
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            pathname === '/dashboard'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Dashboard
        </Link>
      </nav>
      <ThemeToggle />
    </header>
  )
}
