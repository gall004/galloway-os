import { useState } from 'react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createConfig, fetchConfig } from '@/lib/api'

/**
 * @description Searchable combobox for clients with inline "+ Create new Client" action.
 * Includes a "No Client" option for explicit deselection.
 * @param {{ value, onChange, customers, onCustomersChange }} props
 */
export default function CustomerCombobox({ value, onChange, customers, onCustomersChange }) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const selectedLabel = (() => {
    if (!value || value === '1') return 'No Client'
    return customers.find((c) => String(c.id) === value)?.name || 'Select client…'
  })()

  const handleCreate = async () => {
    try {
      const created = await createConfig('customers', { name: newName.trim() })
      const updated = await fetchConfig('customers')
      onCustomersChange(updated)
      onChange(String(created.id))
      setCreateOpen(false)
      setNewName('')
      toast.success(`Client "${created.name}" created`)
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
            <CommandInput placeholder="Search clients…" />
            <CommandList>
              <CommandEmpty>No client found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__no_client__"
                  onSelect={() => { onChange('1'); setOpen(false) }}
                >
                  <span className={value === '1' || !value ? 'font-semibold' : ''}>No Client</span>
                </CommandItem>
                {customers.filter(c => c.id !== 1).map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    onSelect={() => { onChange(String(c.id)); setOpen(false) }}
                  >
                    <span className={value === String(c.id) ? 'font-semibold' : ''}>{c.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem onSelect={() => { setOpen(false); setCreateOpen(true); setNewName('') }} className="text-primary">
                  ＋ Create new Client
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription>Create a client and automatically select it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-customer-name">Name</Label>
            <Input id="new-customer-name" className="w-full" placeholder="e.g., Acme Corp" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Create Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
