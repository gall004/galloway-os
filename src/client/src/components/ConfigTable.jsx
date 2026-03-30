import { useState, useEffect, useCallback, Fragment } from 'react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import CustomerCombobox from '@/components/CustomerCombobox'
import { fetchConfig, createConfig, updateConfig, deleteConfig } from '@/lib/api'

/**
 * @description Reusable CRUD table for config entities. Uses CustomerCombobox for parent FK.
 * @param {{ entity, label, pluralLabel?, parentEntity?, parentLabel?, readOnly?, nameField? }} props
 */
export default function ConfigTable({ entity, label, pluralLabel, parentEntity, parentLabel, readOnly = false, nameField = 'name' }) {
  const [items, setItems] = useState([])
  const [parents, setParents] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formValue, setFormValue] = useState('')
  const [parentId, setParentId] = useState('1')
  const [expandedRow, setExpandedRow] = useState(null)

  const load = useCallback(() => {
    fetchConfig(entity).then(setItems).catch((e) => toast.error(e.message))
    if (parentEntity) { fetchConfig(parentEntity).then(setParents).catch(() => {}) }
  }, [entity, parentEntity])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditItem(null); setFormValue(''); setParentId('1'); setModalOpen(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setFormValue(readOnly ? (item.label || '') : (item.name || ''))
    setParentId(String(item.customer_id || '1'))
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
        <h3 className="text-sm font-semibold text-foreground">{pluralLabel || `${label}s`}</h3>
        {!readOnly && <Button size="sm" onClick={openCreate}>+ Add</Button>}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {!readOnly && <TableHead className="w-12 hidden md:table-cell">ID</TableHead>}
            {readOnly && <TableHead className="w-32 hidden md:table-cell">Key</TableHead>}
            <TableHead>{readOnly ? 'Display Label' : 'Name'}</TableHead>
            {parentEntity && <TableHead className="hidden md:table-cell">{parentLabel}</TableHead>}
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const itemIdentifier = readOnly ? item[nameField] : item.id
            const isExpanded = expandedRow === itemIdentifier
            return (
              <Fragment key={itemIdentifier}>
                <TableRow 
                  onClick={() => setExpandedRow(isExpanded ? null : itemIdentifier)}
                  className="cursor-pointer md:cursor-default transition-colors hover:bg-muted/50"
                >
                  {!readOnly && <TableCell className="text-muted-foreground hidden md:table-cell">{item.id}</TableCell>}
                  {readOnly && <TableCell className="text-muted-foreground font-mono text-xs hidden md:table-cell">{item[nameField]}</TableCell>}
                  <TableCell className="font-medium truncate">{readOnly ? item.label : item.name}</TableCell>
                  {parentEntity && <TableCell className="hidden md:table-cell truncate">{item.customer_name || '—'}</TableCell>}
                  <TableCell className="text-right space-x-1 whitespace-nowrap">
                    {item.id !== 1 && (
                      <>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(item) }}>✏️</Button>
                        {!readOnly && (
                          <DeleteConfirmDialog title={`Delete ${label}?`} description={`This will permanently delete "${item.name}". This cannot be undone.`} onConfirm={() => handleDelete(item)}>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>🗑️</Button>
                          </DeleteConfirmDialog>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="md:hidden bg-muted/20 border-b">
                    <TableCell colSpan={readOnly ? 3 : parentEntity ? 4 : 3} className="px-5 py-3 border-l-2 border-primary/50">
                      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                        {!readOnly && <div className="flex gap-2"><strong className="text-foreground min-w-16">ID:</strong> <span>{item.id}</span></div>}
                        {readOnly && <div className="flex gap-2"><strong className="text-foreground min-w-16">Key:</strong> <span className="font-mono">{item[nameField]}</span></div>}
                        {parentEntity && <div className="flex gap-2"><strong className="text-foreground min-w-16">{parentLabel}:</strong> <span className="text-wrap break-words">{item.customer_name || '—'}</span></div>}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
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
              <Input id="config-value" className="w-full" placeholder={readOnly ? 'e.g., My Custom Label' : `e.g., ${label === 'Customer' ? 'Acme Corp' : label === 'Project' ? 'Q3 Rollout' : 'Urgent'}`} value={formValue} onChange={(e) => setFormValue(e.target.value)} />
            </div>
            {parentEntity && !readOnly && (
              <div className="space-y-2">
                <Label>{parentLabel}</Label>
                <CustomerCombobox
                  value={parentId}
                  onChange={setParentId}
                  customers={parents}
                  onCustomersChange={setParents}
                />
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
