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
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import ProjectCombobox from '@/components/ProjectCombobox'
import { toast } from 'sonner'
import { createTask, updateTask, fetchSettings } from '@/lib/api'

const ruleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  project_id: z.string().default('1'),
  delegated_to: z.string().optional().default(''),
  status_name: z.string().default('active'),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  days_of_week: z.array(z.string()).optional(),
  due_date_offset_days: z.number().nullable().optional(),
  prevent_duplicates: z.boolean().default(true),
  is_active_template: z.boolean().default(true),
  next_run_date: z.string().optional(),
})

export default function RecurringTaskModal({ open, onOpenChange, rule, onSave, config, onConfigChange }) {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    fetchSettings().then(setSettings).catch(console.error)
  }, [])

  const form = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: { title: '', description: '', project_id: '1', delegated_to: '', status_name: 'active', frequency: 'daily', days_of_week: [], prevent_duplicates: true, is_active_template: true, due_date_offset_days: null, next_run_date: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset(rule ? {
        title: rule.title || '',
        description: rule.description || '',
        project_id: String(rule.project_id || 1),
        delegated_to: rule.delegated_to || '',
        status_name: rule.status_name || 'active',
        frequency: rule.frequency || 'daily',
        days_of_week: rule.days_of_week ? JSON.parse(rule.days_of_week).map(String) : [],
        due_date_offset_days: rule.due_date_offset_days ?? null,
        prevent_duplicates: rule.prevent_duplicates === 1,
        is_active_template: rule.is_active_template === 1,
        next_run_date: rule.next_run_date || '',
      } : {
        title: '', description: '', project_id: '1', delegated_to: '', status_name: 'active',
        frequency: 'daily', days_of_week: [], prevent_duplicates: true, is_active_template: true, due_date_offset_days: null, next_run_date: new Date().toISOString().split('T')[0]
      })
    }
  }, [open, rule, form])

  const frequency = form.watch('frequency')

  const handleSubmit = async (data) => {
    const payload = { 
      ...data,
      is_template: true, // Marker to save as blueprint
      project_id: Number(data.project_id),
      days_of_week: data.days_of_week.length > 0 && frequency !== 'monthly' ? data.days_of_week.map(Number) : null
    }

    try {
      if (rule) {
        await updateTask(rule.id, payload)
        toast.success('Template updated')
      } else {
        await createTask(payload)
        toast.success('Template created')
      }
      onSave()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Template' : 'Create Recurring Template'}</DialogTitle>
          <DialogDescription>Define the blueprint and schedule. The server natively spawns tasks from this configuration.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Task Title</FormLabel>
                <FormControl><Input className="w-full" placeholder="e.g., Daily Standup Notes" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="frequency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              
              <FormField control={form.control} name="due_date_offset_days" render={({ field }) => (
                <FormItem>
                  <FormLabel>Auto-Schedule Due Date (+ Days)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      className="w-full" 
                      placeholder="e.g., 0 for today, 2 for +2 days" 
                      value={field.value === null ? '' : field.value} 
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} 
                    />
                  </FormControl>
                  <FormDescription>Calculated from generation date.</FormDescription>
                </FormItem>
              )} />
            </div>

            {frequency === 'daily' && (
              <FormField control={form.control} name="days_of_week" render={({ field }) => (
                <FormItem>
                  <FormLabel>Days of the Week Filter (Optional)</FormLabel>
                  <FormControl>
                    <ToggleGroup type="multiple" value={field.value} onValueChange={field.onChange} className="justify-start">
                      <ToggleGroupItem value="1" aria-label="Monday">M</ToggleGroupItem>
                      <ToggleGroupItem value="2" aria-label="Tuesday">T</ToggleGroupItem>
                      <ToggleGroupItem value="3" aria-label="Wednesday">W</ToggleGroupItem>
                      <ToggleGroupItem value="4" aria-label="Thursday">Th</ToggleGroupItem>
                      <ToggleGroupItem value="5" aria-label="Friday">F</ToggleGroupItem>
                      <ToggleGroupItem value="6" aria-label="Saturday">Sa</ToggleGroupItem>
                      <ToggleGroupItem value="0" aria-label="Sunday">Su</ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormDescription>Only generate on these specific days.</FormDescription>
                </FormItem>
              )} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="next_run_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Configured Start Date</FormLabel>
                  <FormControl>
                    <Input className="w-full" type="date" {...field} />
                  </FormControl>
                  <FormDescription>When does this cycle start?</FormDescription>
                </FormItem>
              )} />
              <FormField control={form.control} name="project_id" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Project Base</FormLabel>
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
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="status_name" render={({ field }) => {
                const availableStatuses = config.statuses?.filter((s) => {
                  if (s.system_name === 'done') return false
                  if (s.system_name === 'inbox' && settings && !settings.inbox_mode) return false
                  if (s.system_name === 'delegated' && settings && !settings.manager_mode) return false
                  return true
                }) || []
                return (
                  <FormItem>
                    <FormLabel>Blueprint Target Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select target…" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availableStatuses.map((s) => <SelectItem key={s.name} value={s.name}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormDescription>Where should this task spawn?</FormDescription>
                  </FormItem>
                )
              }} />
              <FormField control={form.control} name="delegated_to" render={({ field }) => (
                <FormItem>
                  <FormLabel>Delegated To</FormLabel>
                  <FormControl><Input className="w-full" placeholder="e.g., Jane Smith" {...field} /></FormControl>
                  <FormDescription>Assigned owner.</FormDescription>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description Template</FormLabel>
                <FormControl><Textarea className="w-full" placeholder="Context appended to each generation…" rows={3} {...field} /></FormControl>
              </FormItem>
            )} />

            <div className="space-y-4 pt-2 border-t mt-4">
              <FormField control={form.control} name="prevent_duplicates" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5 max-w-[85%]">
                    <FormLabel>Prevent Duplicates</FormLabel>
                    <FormDescription>Skips generation if an active task spawned by this template already exists.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
              
              <FormField control={form.control} name="is_active_template" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5 max-w-[85%]">
                    <FormLabel>Status Active</FormLabel>
                    <FormDescription>Turn off to pause generation.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Template</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
