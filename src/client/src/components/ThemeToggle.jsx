import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

/**
 * @description ThemeToggle — cycles between light, dark, and system modes.
 * Reads/persists preference in localStorage.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => document.documentElement.classList.toggle('dark', e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const labels = { light: '☀️', dark: '🌙', system: '💻' }
  const cycle = () => setTheme((t) => (t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light'))

  return (
    <Button variant="ghost" size="sm" onClick={cycle} className="text-sm px-2" title={`Theme: ${theme}`}>
      {labels[theme]}
    </Button>
  )
}
