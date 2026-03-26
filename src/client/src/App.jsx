import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'
import KanbanBoard from '@/components/KanbanBoard'
import RetroactiveDashboard from '@/components/RetroactiveDashboard'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <Routes>
          <Route path="/" element={<KanbanBoard />} />
          <Route path="/dashboard" element={<RetroactiveDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
