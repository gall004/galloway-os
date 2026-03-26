import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PRIORITIES, STATUSES, WORKSTREAMS } from '@/lib/constants'

/**
 * @description TaskModal — ShadCN Dialog for creating and editing tasks.
 * Dual-purpose: create (task=null) or edit (task=Object).
 * @param {{ open, onOpenChange, task, onSave }} props
 */
export default function TaskModal({ open, onOpenChange, task, onSave }) {
  const isEdit = Boolean(task)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(getDefaults())

  function getDefaults() {
    return {
      title: '', description: '', priority: 'Medium', status: 'Backlog',
      date_due: '', associated_project: '', associated_customer: '',
      delegated_to: '', workstream: 'None',
    }
  }

  useEffect(() => {
    if (open) {
      setForm(task ? {
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        status: task.status || 'Backlog',
        date_due: task.date_due ? task.date_due.split('T')[0] : '',
        associated_project: task.associated_project || '',
        associated_customer: task.associated_customer || '',
        delegated_to: task.delegated_to || '',
        workstream: task.workstream || 'None',
      } : getDefaults())
    }
  }, [open, task])

  const handleField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        date_due: form.date_due || null,
        associated_project: form.associated_project || null,
        associated_customer: form.associated_customer || null,
        delegated_to: form.delegated_to || null,
      }
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => handleField('title', e.target.value)} placeholder="What needs to be done?" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => handleField('description', e.target.value)} placeholder="Additional details…" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => handleField('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => handleField('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Workstream</Label>
              <Select value={form.workstream} onValueChange={(v) => handleField('workstream', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORKSTREAMS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_due">Due Date</Label>
              <Input id="date_due" type="date" value={form.date_due} onChange={(e) => handleField('date_due', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="project">Project</Label>
              <Input id="project" value={form.associated_project} onChange={(e) => handleField('associated_project', e.target.value)} placeholder="Project name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer</Label>
              <Input id="customer" value={form.associated_customer} onChange={(e) => handleField('associated_customer', e.target.value)} placeholder="Customer name" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delegated">Delegated To</Label>
            <Input id="delegated" value={form.delegated_to} onChange={(e) => handleField('delegated_to', e.target.value)} placeholder="Person responsible" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
