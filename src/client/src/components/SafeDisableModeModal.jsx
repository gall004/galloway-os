import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

/**
 * @description SafeDisableModeModal — prompts for a fallback status before disabling a mode (Inbox/Manager) that contains tasks.
 * @param {{ open, onOpenChange, modeName, statusName, allStatuses, taskCount, onConfirm }} props
 */
export default function SafeDisableModeModal({ open, onOpenChange, modeName, statusName, allStatuses, taskCount = 0, templateCount = 0, onConfirm }) {
  const [fallback, setFallback] = useState('none')
  
  // Safe havens exclude system governance columns that may be restricted
  const boardColumns = allStatuses ? allStatuses.filter(s => !['inbox', 'delegated', 'done', statusName].includes(s.name)) : [];

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
            There are {taskCount > 0 && <span><strong>{taskCount}</strong> {taskCount === 1 ? 'task' : 'tasks'}</span>}
            {taskCount > 0 && templateCount > 0 && ' and '}
            {templateCount > 0 && <span><strong>{templateCount}</strong> {templateCount === 1 ? 'template' : 'templates'}</span>} currently in the &apos;{statusName}&apos; column. Disabling this mode will hide the column from your board. Where should we move these tasks?
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
