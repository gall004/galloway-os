import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight">
          galloway-os
        </h1>
        <p className="text-muted-foreground">
          Kanban interface loading...
        </p>
        <Button variant="default">Get Started</Button>
      </div>
    </div>
  )
}

export default App
