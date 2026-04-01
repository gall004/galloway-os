import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/ThemeProvider'
import { BoardProvider } from '@/contexts/BoardProvider'
import AppHeader from '@/components/AppHeader'
import PriorityBoard from '@/components/PriorityBoard'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import ArchiveView from '@/components/ArchiveView'
import SettingsView from '@/components/SettingsView'
import CalendarView from '@/components/CalendarView'

/**
 * @description Root application component with ThemeProvider, routing, and Sonner toaster.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <BoardProvider>
          <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 min-h-0 flex flex-col relative w-full">
            <Routes>
              <Route path="/" element={<PriorityBoard />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/dashboard" element={<AnalyticsDashboard />} />
              <Route path="/archive" element={<ArchiveView />} />
              <Route path="/settings" element={<SettingsView />} />
            </Routes>
          </main>
          </div>
          <Toaster richColors position="bottom-right" />
        </BoardProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
