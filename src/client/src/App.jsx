import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import AppHeader from '@/components/AppHeader'
import PriorityBoard from '@/components/PriorityBoard'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import ArchiveView from '@/components/ArchiveView'
import SettingsView from '@/components/SettingsView'

/**
 * @description Root application component with routing and Sonner toaster.
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader />
        <Routes>
          <Route path="/" element={<PriorityBoard />} />
          <Route path="/dashboard" element={<AnalyticsDashboard />} />
          <Route path="/archive" element={<ArchiveView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </div>
      <Toaster richColors position="bottom-right" />
    </BrowserRouter>
  )
}
