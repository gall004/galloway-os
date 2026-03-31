import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

/**
 * @description SafeDeleteStatusModal — prompts for a fallback status before deleting a column with tasks.
 * @param {{ open, onOpenChange, status, allStatuses, taskCount, onConfirm }} props
 */
export default function SafeDeleteStatusModal({ open, onOpenChange, status, allStatuses, taskCount, onConfirm }) {
  const [fallback, setFallback] = useState('')
  const available = allStatuses.filter((s) => s.name !== status?.name)

  const handleConfirm = () => {
    onConfirm(status.name, fallback)
    setFallback('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete &quot;{status?.label}&quot; Column?</DialogTitle>
          <DialogDescription>
            This column has <strong>{taskCount}</strong> {taskCount === 1 ? 'task' : 'tasks'}. Choose a column to move them to before deleting.
          </DialogDescription>
        </DialogHeader>
        <Select value={fallback} onValueChange={setFallback}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Move tasks to…" />
          </SelectTrigger>
          <SelectContent>
            {available.map((s) => (
              <SelectItem key={s.name} value={s.name}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!fallback} onClick={handleConfirm}>Delete &amp; Move Tasks</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
