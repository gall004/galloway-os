import KanbanBoard from '@/components/KanbanBoard'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-heading font-bold text-foreground tracking-tight">
          galloway-os
        </h1>
        <span className="text-xs text-muted-foreground">
          Task Engine
        </span>
      </header>
      <KanbanBoard />
    </div>
  )
}

export default App
