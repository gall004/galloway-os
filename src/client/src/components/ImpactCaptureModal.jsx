import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

/**
 * @description Lightweight modal that intercepts task completion to capture impact/takeaways.
 * @param {{ open: boolean, onOpenChange: Function, task: Object, onConfirm: Function }} props
 */
export default function ImpactCaptureModal({ open, onOpenChange, task, onConfirm }) {
  const [statement, setStatement] = useState('')

  const handleSave = () => {
    onConfirm?.(task, statement.trim() || null)
    setStatement('')
    onOpenChange(false)
  }

  const handleSkip = () => {
    onConfirm?.(task, null)
    setStatement('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Marking Complete</DialogTitle>
          <DialogDescription>
            What was accomplished? This is optional but creates a valuable record.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{task?.title}</p>
          <Textarea
            placeholder="e.g., Secured $2.1M pipeline commitment from Acme Corp..."
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip}>Skip</Button>
          <Button onClick={handleSave}>Save & Complete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
