import { Link, useLocation } from 'react-router-dom'
import { Menu, AppWindow, Inbox, Settings, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetDescription } from '@/components/ui/sheet'

/**
 * @description AppHeader — navigation bar with theme toggle.
 */
export default function AppHeader() {
  const { pathname } = useLocation()

  const links = [
    { to: '/', label: 'Priority', icon: Inbox },
    { to: '/dashboard', label: 'Dashboard', icon: AppWindow },
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
            <SheetTitle className="font-heading font-bold tracking-tight">galloway-os</SheetTitle>
            <SheetDescription className="sr-only">Navigation Menu</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-1 mt-2">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.to}
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
              )
            })}
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
