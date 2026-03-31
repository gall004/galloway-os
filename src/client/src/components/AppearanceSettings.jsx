import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

const THEMES = [
  { key: 'system', label: 'Minimal', description: 'Clean monochrome', colors: ['oklch(0.922 0 0)', 'oklch(0.205 0 0)', 'oklch(0.97 0 0)'] },
  { key: 'ocean', label: 'Ocean', description: 'Calm & focused', colors: ['oklch(0.45 0.15 230)', 'oklch(0.70 0.14 210)', 'oklch(0.90 0.04 190)'] },
  { key: 'sunset', label: 'Sunset', description: 'Warm & energetic', colors: ['oklch(0.55 0.18 35)', 'oklch(0.72 0.16 35)', 'oklch(0.88 0.06 75)'] },
  { key: 'forest', label: 'Forest', description: 'Earthy & grounded', colors: ['oklch(0.45 0.12 155)', 'oklch(0.68 0.12 155)', 'oklch(0.88 0.05 100)'] },
  { key: 'midnight', label: 'Midnight', description: 'Premium & sleek', colors: ['oklch(0.72 0.16 280)', 'oklch(0.45 0.12 310)', 'oklch(0.20 0.04 280)'] },
  { key: 'rose', label: 'Rose', description: 'Soft & modern', colors: ['oklch(0.55 0.18 350)', 'oklch(0.72 0.16 350)', 'oklch(0.88 0.05 320)'] },
]

const DARK_MODES = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'system', label: 'System', icon: Monitor },
]

/**
 * @description Appearance settings panel — curated theme picker and dark mode selector.
 */
export default function AppearanceSettings() {
  const { theme, setTheme, darkMode, setDarkMode } = useTheme()

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Color Theme</h3>
        <p className="text-xs text-muted-foreground mb-4">Choose a curated palette that defines the personality of your board.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={cn(
                'group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md cursor-pointer',
                theme === t.key
                  ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/40'
              )}
            >
              <div className="flex gap-1.5">
                {t.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border border-black/10 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.description}</p>
              </div>
              {theme === t.key && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Mode</h3>
        <p className="text-xs text-muted-foreground mb-4">Control light and dark appearance independently from your color theme.</p>
        <div className="flex gap-2">
          {DARK_MODES.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.key}
                onClick={() => setDarkMode(m.key)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
                  darkMode === m.key
                    ? 'border-primary bg-primary/5 text-foreground shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
