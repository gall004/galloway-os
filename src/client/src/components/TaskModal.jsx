import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  date_due: z.string().optional().default(''),
  status_name: z.string().default('active'),
  project_id: z.string().default('1'),
  customer_id: z.string().default('1'),
  delegated_to: z.string().optional().default(''),
})

/**
 * @description TaskModal — create/edit task with zod validation. No priority field.
 * Accepts insertDefaults for context-menu insertion (pre-fills status_name + order_index).
 * @param {{ open, onOpenChange, task, onSave, onDelete, config, insertDefaults? }} props
 */
export default function TaskModal({ open, onOpenChange, task, onSave, onDelete, config, insertDefaults }) {
  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '', date_due: '', status_name: 'active', project_id: '1', customer_id: '1', delegated_to: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset(task ? {
        title: task.title || '', description: task.description || '', date_due: task.date_due || '',
        status_name: task.status_name || 'active',
        project_id: String(task.project_id || 1), customer_id: String(task.customer_id || 1),
        delegated_to: task.delegated_to || '',
      } : {
        title: '', description: '', date_due: '',
        status_name: insertDefaults?.status_name || 'active',
        project_id: '1', customer_id: '1', delegated_to: '',
      })
    }
  }, [open, task, form, insertDefaults])

  const handleProjectChange = (val, onChange) => {
    onChange(val)
    const proj = config.projects?.find((p) => String(p.id) === val)
    if (proj?.customer_id && proj.customer_id !== 1) {
      form.setValue('customer_id', String(proj.customer_id))
    }
  }

  const handleSubmit = (data) => {
    const payload = { ...data, project_id: Number(data.project_id), customer_id: Number(data.customer_id) }
    if (insertDefaults?.order_index !== undefined && !task) {
      payload.order_index = insertDefaults.order_index
    }
    onSave(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>{task ? 'Update the fields below and save.' : 'Fill in the details to add a new task to your board.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input className="w-full" placeholder="e.g., Q3 Sales Deck" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea className="w-full" placeholder="Add context, links, or notes…" rows={3} {...field} /></FormControl>
                <FormDescription>Optional details to help track this task.</FormDescription>
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-6">
              <FormField control={form.control} name="status_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger></FormControl>
                    <SelectContent>{config.statuses?.map((s) => <SelectItem key={s.name} value={s.name}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="date_due" render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl><Input className="w-full" type="date" {...field} /></FormControl>
                  <FormDescription>When it's due.</FormDescription>
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <FormField control={form.control} name="project_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select value={field.value} onValueChange={(v) => handleProjectChange(v, field.onChange)}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger></FormControl>
                    <SelectContent>{config.projects?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormDescription>Auto-assigns customer.</FormDescription>
                </FormItem>
              )} />
              <FormField control={form.control} name="customer_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger></FormControl>
                    <SelectContent>{config.customers?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="delegated_to" render={({ field }) => (
                <FormItem>
                  <FormLabel>Delegated To</FormLabel>
                  <FormControl><Input className="w-full" placeholder="e.g., Jane Smith" {...field} /></FormControl>
                  <FormDescription>Person responsible.</FormDescription>
                </FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4 flex items-center justify-between gap-2">
              {task && (
                <DeleteConfirmDialog title="Delete task?" description={`This will permanently delete "${task.title}". This cannot be undone.`} onConfirm={() => { onDelete?.(task); onOpenChange(false) }}>
                  <Button type="button" variant="destructive" size="sm">Delete Task</Button>
                </DeleteConfirmDialog>
              )}
              <Button type="submit">Save Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
