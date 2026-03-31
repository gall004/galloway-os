import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CustomerCombobox from '@/components/CustomerCombobox'
import { createConfig, fetchConfig } from '@/lib/api'

/**
 * @description Searchable combobox for projects with "Project — Customer" format
 * and inline "+ Create new Project" action. The quick-create form includes a
 * CustomerCombobox for deep nesting (create customer from within create project).
 * @param {{ value, onChange, projects, customers, onProjectsChange, onCustomersChange }} props
 */
export default function ProjectCombobox({ value, onChange, projects, customers, onProjectsChange, onCustomersChange }) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCustomerId, setNewCustomerId] = useState('1')

  const options = useMemo(() => {
    return projects.map((p) => {
      const customer = customers.find((c) => c.id === p.customer_id)
      const customerName = customer?.name && customer.name !== 'N/A' ? customer.name : null
      return {
        id: String(p.id),
        label: customerName ? `${p.name} — ${customerName}` : p.name,
        searchText: customerName ? `${p.name} ${customerName}` : p.name,
      }
    })
  }, [projects, customers])

  const selectedLabel = options.find((o) => o.id === value)?.label || 'Select project…'

  const handleCreate = async () => {
    try {
      const created = await createConfig('projects', { name: newName.trim(), customer_id: Number(newCustomerId) || 1 })
      const updated = await fetchConfig('projects')
      onProjectsChange(updated)
      onChange(String(created.id))
      setCreateOpen(false)
      setNewName('')
      setNewCustomerId('1')
      toast.success(`Project "${created.name}" created`)
    } catch (e) { toast.error(e.message) }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            <span className="truncate">{selectedLabel}</span>
            <span className="ml-2 shrink-0 opacity-50">⌕</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search projects or customers…" />
            <CommandList>
              <CommandEmpty>No project found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.searchText}
                    onSelect={() => { onChange(opt.id); setOpen(false) }}
                  >
                    <span className={value === opt.id ? 'font-semibold' : ''}>{opt.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem onSelect={() => { setOpen(false); setCreateOpen(true); setNewName(''); setNewCustomerId('1') }} className="text-primary">
                  ＋ Create new Project
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>Create a project and automatically select it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-project-name">Name</Label>
              <Input id="new-project-name" className="w-full" placeholder="e.g., Q3 Rollout" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <CustomerCombobox
                value={newCustomerId}
                onChange={setNewCustomerId}
                customers={customers}
                onCustomersChange={onCustomersChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
