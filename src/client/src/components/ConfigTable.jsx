import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import { fetchConfig, createConfig, updateConfig, deleteConfig } from '@/lib/api'

/**
 * @description Reusable CRUD table for a config entity.
 * @param {{ entity: string, label: string, parentEntity?: string, parentLabel?: string }} props
 */
export default function ConfigTable({ entity, label, parentEntity, parentLabel }) {
  const [items, setItems] = useState([])
  const [parents, setParents] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')

  const load = useCallback(() => {
    fetchConfig(entity).then(setItems).catch((e) => toast.error(e.message))
    if (parentEntity) fetchConfig(parentEntity).then(setParents).catch(() => {})
  }, [entity, parentEntity])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditItem(null); setName(''); setParentId('1'); setModalOpen(true) }
  const openEdit = (item) => { setEditItem(item); setName(item.name); setParentId(String(item.customer_id || '')); setModalOpen(true) }

  const handleSave = async () => {
    const data = { name }
    if (parentEntity) data.customer_id = Number(parentId) || 1
    try {
      if (editItem) {
        await updateConfig(entity, editItem.id, data)
        toast.success(`${label} updated`)
      } else {
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
        <Button size="sm" onClick={openCreate}>+ Add</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">ID</TableHead>
            <TableHead>Name</TableHead>
            {parentEntity && <TableHead>{parentLabel}</TableHead>}
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-muted-foreground">{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              {parentEntity && <TableCell>{item.customer_name || '—'}</TableCell>}
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>✏️</Button>
                <DeleteConfirmDialog title={`Delete ${label}?`} description={`This will permanently delete "${item.name}".`} onConfirm={() => handleDelete(item)}>
                  <Button variant="ghost" size="sm">🗑️</Button>
                </DeleteConfirmDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? `Edit ${label}` : `New ${label}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            {parentEntity && (
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder={`Select ${parentLabel}`} /></SelectTrigger>
                <SelectContent>
                  {parents.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
