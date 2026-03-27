import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import { fetchConfig, createConfig, updateConfig, deleteConfig } from '@/lib/api'

/**
 * @description Reusable CRUD table for a config entity. Supports readOnly mode (no add/delete).
 * @param {{ entity, label, parentEntity?, parentLabel?, readOnly?, nameField? }} props
 */
export default function ConfigTable({ entity, label, parentEntity, parentLabel, readOnly = false, nameField = 'name' }) {
  const [items, setItems] = useState([])
  const [parents, setParents] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formValue, setFormValue] = useState('')
  const [parentId, setParentId] = useState('')

  const load = useCallback(() => {
    fetchConfig(entity).then(setItems).catch((e) => toast.error(e.message))
    if (parentEntity) { fetchConfig(parentEntity).then(setParents).catch(() => {}) }
  }, [entity, parentEntity])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditItem(null); setFormValue(''); setParentId('1'); setModalOpen(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setFormValue(readOnly ? (item.label || '') : (item.name || ''))
    setParentId(String(item.customer_id || ''))
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (readOnly && editItem) {
        await updateConfig(entity, editItem[nameField], { label: formValue })
        toast.success(`${label} label updated`)
      } else if (editItem) {
        const data = { name: formValue }
        if (parentEntity) { data.customer_id = Number(parentId) || 1 }
        await updateConfig(entity, editItem.id, data)
        toast.success(`${label} updated`)
      } else {
        const data = { name: formValue }
        if (parentEntity) { data.customer_id = Number(parentId) || 1 }
        await createConfig(entity, data)
        toast.success(`${label} created`)
      }
      setModalOpen(false)
      load()
    } catch (e) { toast.error(e.message) }
  }

  const handleDelete = async (item) => {
    try {
      await deleteConfig(entity, item.id)
      toast.success(`${label} deleted`)
      load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{label}s</h3>
        {!readOnly && <Button size="sm" onClick={openCreate}>+ Add</Button>}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {!readOnly && <TableHead className="w-12">ID</TableHead>}
            {readOnly && <TableHead className="w-32">Key</TableHead>}
            <TableHead>{readOnly ? 'Display Label' : 'Name'}</TableHead>
            {parentEntity && <TableHead>{parentLabel}</TableHead>}
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={readOnly ? item[nameField] : item.id}>
              {!readOnly && <TableCell className="text-muted-foreground">{item.id}</TableCell>}
              {readOnly && <TableCell className="text-muted-foreground font-mono text-xs">{item[nameField]}</TableCell>}
              <TableCell>{readOnly ? item.label : item.name}</TableCell>
              {parentEntity && <TableCell>{item.customer_name || '—'}</TableCell>}
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>✏️</Button>
                {!readOnly && (
                  <DeleteConfirmDialog title={`Delete ${label}?`} description={`This will permanently delete "${item.name}". This cannot be undone.`} onConfirm={() => handleDelete(item)}>
                    <Button variant="ghost" size="sm">🗑️</Button>
                  </DeleteConfirmDialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editItem ? `Edit ${label}` : `New ${label}`}</DialogTitle>
            <DialogDescription>
              {readOnly ? `Update the display label for "${editItem?.[nameField]}". The system key cannot be changed.`
                : editItem ? 'Update the name below.' : `Add a new ${label.toLowerCase()} to your configuration.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="config-value">{readOnly ? 'Display Label' : 'Name'}</Label>
              <Input id="config-value" placeholder={readOnly ? 'e.g., My Custom Label' : `e.g., ${label === 'Customer' ? 'Acme Corp' : label === 'Project' ? 'Q3 Rollout' : 'Urgent'}`} value={formValue} onChange={(e) => setFormValue(e.target.value)} />
            </div>
            {parentEntity && !readOnly && (
              <div className="space-y-2">
                <Label>{parentLabel}</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger><SelectValue placeholder={`Select ${parentLabel}`} /></SelectTrigger>
                  <SelectContent>
                    {parents.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={!formValue.trim()}>Save {readOnly ? 'Label' : label}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
