import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet'

/**
 * @description AppHeader — navigation bar with theme toggle.
 */
export default function AppHeader() {
  const { pathname } = useLocation()

  const links = [
    { to: '/', label: 'Priority' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/archive', label: 'Archive' },
    { to: '/settings', label: 'Settings' },
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
            <SheetTitle className="font-heading font-bold tracking-tight">galloway-os</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-4 py-3 text-sm rounded-md transition-colors',
                  pathname === link.to
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-heading font-bold text-foreground tracking-tight mr-auto">
        galloway-os
      </h1>

      <nav className="hidden md:flex gap-1">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              pathname === link.to
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <ThemeToggle />
    </header>
  )
}
