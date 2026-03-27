import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'

/**
 * @description TaskModal — create/edit task with FK dropdowns and delete action.
 * @param {{ open, onOpenChange, task, onSave, onDelete, config }} props
 */
export default function TaskModal({ open, onOpenChange, task, onSave, onDelete, config }) {
  const [form, setForm] = useState({})

  useEffect(() => {
    if (open) {
      setForm(task ? {
        title: task.title || '', description: task.description || '', date_due: task.date_due || '',
        priority_id: String(task.priority_id || 3), status_id: String(task.status_id || 2),
        project_id: String(task.project_id || 1), customer_id: String(task.customer_id || 1),
        workstream_id: String(task.workstream_id || 1), delegated_to: task.delegated_to || '',
      } : {
        title: '', description: '', date_due: '', priority_id: '3', status_id: '2',
        project_id: '1', customer_id: '1', workstream_id: '1', delegated_to: '',
      })
    }
  }, [open, task])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e?.target ? e.target.value : e }))

  const handleProjectChange = (val) => {
    setForm((f) => {
      const proj = config.projects?.find((p) => String(p.id) === val)
      return { ...f, project_id: val, customer_id: proj?.customer_id && proj.customer_id !== 1 ? String(proj.customer_id) : f.customer_id }
    })
  }

  const handleSave = () => {
    const data = { ...form, priority_id: Number(form.priority_id), status_id: Number(form.status_id), project_id: Number(form.project_id), customer_id: Number(form.customer_id), workstream_id: Number(form.workstream_id) }
    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div><Label>Title</Label><Input value={form.title || ''} onChange={set('title')} /></div>
          <div><Label>Description</Label><Textarea value={form.description || ''} onChange={set('description')} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Priority</Label>
              <Select value={form.priority_id} onValueChange={set('priority_id')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{config.priorities?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Status</Label>
              <Select value={form.status_id} onValueChange={set('status_id')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{config.statuses?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Project</Label>
              <Select value={form.project_id} onValueChange={handleProjectChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{config.projects?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Customer</Label>
              <Select value={form.customer_id} onValueChange={set('customer_id')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{config.customers?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Workstream</Label>
              <Select value={form.workstream_id} onValueChange={set('workstream_id')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{config.workstreams?.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Due Date</Label><Input type="date" value={form.date_due || ''} onChange={set('date_due')} /></div>
          </div>
          <div><Label>Delegated To</Label><Input value={form.delegated_to || ''} onChange={set('delegated_to')} /></div>
        </div>
        <DialogFooter className="flex justify-between">
          {task && (
            <DeleteConfirmDialog title="Delete task?" description={`Permanently delete "${task.title}"?`} onConfirm={() => { onDelete?.(task); onOpenChange(false) }}>
              <Button variant="destructive" size="sm">Delete Task</Button>
            </DeleteConfirmDialog>
          )}
          <Button onClick={handleSave} disabled={!form.title?.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
