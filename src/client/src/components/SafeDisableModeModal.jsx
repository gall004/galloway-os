import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

/**
 * @description SafeDisableModeModal — prompts for a fallback status before disabling a mode (Inbox/Manager) that contains tasks.
 * @param {{ open, onOpenChange, modeName, statusName, allStatuses, taskCount, onConfirm }} props
 */
export default function SafeDisableModeModal({ open, onOpenChange, modeName, statusName, allStatuses, taskCount, onConfirm }) {
  const [fallback, setFallback] = useState('none')

  // If we just want them to drop it in Active, or any other core column, actually it's easier to just let them drop it in ANY core column 
  // currently enabled, but 'Active' is the easiest safe haven. Let's just allow all strictly active board columns.
  const boardColumns = allStatuses.filter(s => s.name !== statusName && s.name !== 'done')

  const handleConfirm = () => {
    onConfirm(statusName, fallback)
    setFallback('')
  }

  const handleCancel = () => {
    setFallback('none')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Disable {modeName}?</DialogTitle>
          <DialogDescription>
            There are <strong>{taskCount}</strong> {taskCount === 1 ? 'task' : 'tasks'} currently in the '{statusName}' column. Disabling this mode will hide the column from your board. Where should we move these tasks?
          </DialogDescription>
        </DialogHeader>
        <Select value={fallback} onValueChange={setFallback}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Where should they go?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Don't move, tasks will be hidden</SelectItem>
            {boardColumns.map((s) => (
              <SelectItem key={s.name} value={s.name}>Move to {s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button variant="default" onClick={handleConfirm}>Confirm Disable</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
