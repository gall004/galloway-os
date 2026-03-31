import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

/**
 * @description SafeDeleteStatusModal — prompts for a fallback status before deleting a column with tasks.
 * @param {{ open, onOpenChange, status, allStatuses, taskCount, onConfirm }} props
 */
export default function SafeDeleteStatusModal({ open, onOpenChange, status, allStatuses, taskCount = 0, templateCount = 0, onConfirm }) {
  const [fallback, setFallback] = useState('')
  const available = allStatuses.filter((s) => !['inbox', 'delegated', 'done', status?.name].includes(s.name))

  const handleConfirm = () => {
    onConfirm(status.name, fallback)
    setFallback('')
  }

  const totalCount = taskCount + templateCount;
  const themIt = totalCount === 1 ? 'it' : 'them';
  const itemItems = totalCount === 1 ? 'item' : 'items';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete &quot;{status?.label}&quot; Column?</DialogTitle>
          <DialogDescription>
            This column contains {taskCount > 0 && <span><strong>{taskCount}</strong> active {taskCount === 1 ? 'task' : 'tasks'}</span>}
            {taskCount > 0 && templateCount > 0 && ' and '}
            {templateCount > 0 && <span><strong>{templateCount}</strong> recurring {templateCount === 1 ? 'template' : 'templates'}</span>}. 
            Choose a column to move {themIt} to before deleting.
          </DialogDescription>
        </DialogHeader>
        <Select value={fallback} onValueChange={setFallback}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Move ${itemItems} to…`} />
          </SelectTrigger>
          <SelectContent>
            {available.map((s) => (
              <SelectItem key={s.name} value={s.name}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!fallback} onClick={handleConfirm}>Delete &amp; Move {itemItems === 'item' ? 'Item' : 'Items'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
