import { useEffect, useState } from 'react'
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
import ProjectCombobox from '@/components/ProjectCombobox'
import { fetchSettings } from '@/lib/api'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  date_due: z.string().optional().default(''),
  status_name: z.string().default('active'),
  project_id: z.string().default('1'),
  delegated_to: z.string().optional().default(''),
  impact_statement: z.string().optional().default(''),
})

/**
 * @description TaskModal — create/edit with ProjectCombobox (inline creation support).
 * @param {{ open, onOpenChange, task, onSave, onDelete, config, onConfigChange, insertDefaults? }} props
 */
export default function TaskModal({ open, onOpenChange, task, onSave, onDelete, config, onConfigChange, insertDefaults }) {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    fetchSettings().then(setSettings).catch(console.error)
  }, [])

  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '', date_due: '', status_name: 'active', project_id: '1', delegated_to: '', impact_statement: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset(task ? {
        title: task.title || '', description: task.description || '', date_due: task.date_due || '',
        status_name: task.status_name || 'active',
        project_id: String(task.project_id || 1),
        delegated_to: task.delegated_to || '',
        impact_statement: task.impact_statement || '',
      } : {
        title: '', description: '', date_due: '',
        status_name: insertDefaults?.status_name || 'active',
        project_id: '1', delegated_to: '', impact_statement: '',
      })
    }
  }, [open, task, form, insertDefaults])

  const handleSubmit = (data) => {
    const payload = { ...data, project_id: Number(data.project_id) }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <FormField control={form.control} name="status_name" render={({ field }) => {
                const availableStatuses = config.statuses?.filter((s) => {
                  if (s.system_name === 'inbox' && settings?.inbox_mode === false) return false
                  if (s.system_name === 'delegated' && settings?.manager_mode === false) return false
                  return true
                }) || []
                return (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availableStatuses.map((s) => <SelectItem key={s.name} value={s.name}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )
              }} />
              <FormField control={form.control} name="date_due" render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl><Input className="w-full" type="date" {...field} /></FormControl>
                  <FormDescription>When it's due.</FormDescription>
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <FormField control={form.control} name="project_id" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Project</FormLabel>
                  <FormControl>
                    <ProjectCombobox
                      value={field.value}
                      onChange={field.onChange}
                      projects={config.projects || []}
                      customers={config.customers || []}
                      onProjectsChange={(p) => onConfigChange?.({ ...config, projects: p })}
                      onCustomersChange={(c) => onConfigChange?.({ ...config, customers: c })}
                    />
                  </FormControl>
                  <FormDescription>Search or create a project.</FormDescription>
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
            {form.watch('status_name') === 'done' && (
              <FormField control={form.control} name="impact_statement" render={({ field }) => (
                <FormItem>
                  <FormLabel>What Was Done</FormLabel>
                  <FormControl><Textarea className="w-full" placeholder="Key outcomes, takeaways, or impact…" rows={3} {...field} /></FormControl>
                  <FormDescription>Captured at completion — edit anytime.</FormDescription>
                </FormItem>
              )} />
            )}
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
