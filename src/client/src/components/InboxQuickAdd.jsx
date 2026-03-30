import { useState } from 'react'
import { Plus } from 'lucide-react'

/**
 * @description InboxQuickAdd - Minimalist raw task capture input.
 * Submits on Enter. Dispatches POST /api/tasks via onSave handler.
 */
export default function InboxQuickAdd({ onSave }) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSave(title.trim())
      setTitle('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3 px-1">
      <div className="relative flex items-center">
        <div className="absolute left-2.5 text-muted-foreground/50">
          <Plus className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick capture..."
          disabled={isSubmitting}
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </form>
  )
}
