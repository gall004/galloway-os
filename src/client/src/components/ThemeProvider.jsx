import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { fetchSettings, updateSettings } from '@/lib/api'

const VALID_THEMES = ['system', 'ocean', 'sunset', 'forest', 'midnight', 'rose']

const ThemeContext = createContext({
  theme: 'system',
  isDark: false,
  setTheme: () => {},
})

/**
 * @description Resolve whether a given theme name implies dark mode by default.
 * Midnight is an inherently dark theme. Others follow the light/dark toggle.
 * @param {string} themeName - The curated theme name.
 * @param {string} darkMode - 'light', 'dark', or 'system'.
 * @returns {boolean}
 */
function resolveIsDark(themeName, darkMode) {
  if (darkMode === 'dark') return true
  if (darkMode === 'light') return false
  if (themeName === 'midnight') return true
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * @description Apply theme class + dark mode to documentElement.
 * Removes all previous theme-* classes, then adds the current one.
 * @param {string} themeName - e.g. 'ocean', 'midnight', 'system'
 * @param {string} darkMode - 'light', 'dark', or 'system'
 */
function applyThemeToDOM(themeName, darkMode) {
  const root = document.documentElement
  VALID_THEMES.forEach((t) => root.classList.remove(`theme-${t}`))
  root.classList.remove('dark')

  if (themeName !== 'system') {
    root.classList.add(`theme-${themeName}`)
  }

  if (resolveIsDark(themeName, darkMode)) {
    root.classList.add('dark')
  }
}

/**
 * @description Provider that manages the curated theme + dark mode state.
 * Reads initial value from app_settings API, persists changes back to API.
 * @param {{ children: React.ReactNode }} props
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('galloway-theme') || 'system'
  )
  const [darkMode, setDarkModeState] = useState(
    () => localStorage.getItem('galloway-dark-mode') || 'system'
  )
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchSettings()
      .then((settings) => {
        if (settings?.theme_preference) {
          const pref = settings.theme_preference
          if (VALID_THEMES.includes(pref) || pref === 'system') {
            setThemeState(pref)
            localStorage.setItem('galloway-theme', pref)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    applyThemeToDOM(theme, darkMode)
    localStorage.setItem('galloway-theme', theme)
    localStorage.setItem('galloway-dark-mode', darkMode)
  }, [theme, darkMode])

  useEffect(() => {
    if (darkMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyThemeToDOM(theme, darkMode)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme, darkMode])

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme)
    updateSettings({ theme_preference: newTheme }).catch(() => {})
  }, [])

  const setDarkMode = useCallback((mode) => {
    setDarkModeState(mode)
  }, [])

  const isDark = resolveIsDark(theme, darkMode)

  if (!loaded) return null

  return (
    <ThemeContext.Provider value={{ theme, darkMode, isDark, setTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * @description Hook to consume the current theme context.
 * @returns {{ theme: string, darkMode: string, isDark: boolean, setTheme: Function, setDarkMode: Function }}
 */
export function useTheme() {
  return useContext(ThemeContext)
}
