import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Edit2, Trash2, Plus, Lock, ShieldCheck, ArrowUp, ArrowDown } from 'lucide-react'
import { fetchSettings, updateSettings, fetchConfig, createStatus, updateStatus, deleteStatus, reorderStatuses } from '@/lib/api'
import SafeDeleteStatusModal from '@/components/SafeDeleteStatusModal'
import { fetchTasks } from '@/lib/api'

/**
 * @description WorkflowSettings — App workflow toggles + dynamic status column management.
 */
export default function WorkflowSettings() {
  const [settings, setSettings] = useState(null)
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [editingName, setEditingName] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteTaskCount, setDeleteTaskCount] = useState(0)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([fetchSettings(), fetchConfig('statuses')])
      setSettings(s)
      setStatuses(st)
    } catch { /* handled by loading state */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (field, value) => {
    try {
      const updated = await updateSettings({ [field]: value })
      setSettings(updated)
      toast.success('Setting updated')
    } catch (e) { toast.error(e.message) }
  }

  const handleAddStatus = async () => {
    if (!newName.trim() || !newLabel.trim()) return
    try {
      await createStatus({ name: newName.trim(), label: newLabel.trim() })
      setNewName('')
      setNewLabel('')
      load()
      toast.success('Column added')
    } catch (e) { toast.error(e.message) }
  }

  const handleSaveRename = async (name) => {
    try {
      await updateStatus(name, { label: editLabel })
      setEditingName(null)
      load()
      toast.success('Column renamed')
    } catch (e) { toast.error(e.message) }
  }

  const handleDeleteClick = async (status) => {
    try {
      const tasks = await fetchTasks()
      const count = tasks.filter((t) => t.status_name === status.name).length
      if (count > 0) {
        setDeleteTarget(status)
        setDeleteTaskCount(count)
        setDeleteModalOpen(true)
      } else {
        await deleteStatus(status.name)
        load()
        toast.success('Column deleted')
      }
    } catch (e) { toast.error(e.message) }
  }

  const handleSafeDelete = async (name, fallback) => {
    try {
      await deleteStatus(name, fallback)
      setDeleteModalOpen(false)
      setDeleteTarget(null)
      load()
      toast.success('Column deleted and tasks moved')
    } catch (e) { toast.error(e.message) }
  }

  const boardColumns = statuses.filter((s) => s.system_name !== 'done')

  const handleMove = async (index, direction) => {
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= boardColumns.length) return

    const reordered = [...boardColumns]
    const temp = reordered[index]
    reordered[index] = reordered[swapIndex]
    reordered[swapIndex] = temp

    const items = reordered.map((s, i) => ({ name: s.name, display_order: i }))
    try {
      const updated = await reorderStatuses(items)
      setStatuses(updated)
      toast.success('Column order updated')
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <div className="text-center p-8 text-muted-foreground animate-pulse">Loading settings...</div>

  return (
    <div className="space-y-8 pt-2">
      {/* Workflow Toggles */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Workflow Mode</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="inbox-mode" className="font-medium">Inbox Mode</Label>
              <p className="text-xs text-muted-foreground">Capture tasks quickly without triaging. New items land in an Inbox column and are promoted to the board when ready.</p>
            </div>
            <Switch id="inbox-mode" checked={!!settings?.inbox_mode} onCheckedChange={(v) => handleToggle('inbox_mode', v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="manager-mode" className="font-medium">Manager Mode</Label>
              <p className="text-xs text-muted-foreground">Track work you've handed off to others. Adds a Delegated column with SLA aging indicators and delegation metrics on the dashboard.</p>
            </div>
            <Switch id="manager-mode" checked={!!settings?.manager_mode} onCheckedChange={(v) => handleToggle('manager_mode', v)} />
          </div>
        </div>
      </div>

      {/* Status Column Management */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Board Columns</h3>
        <p className="text-xs text-muted-foreground">Drag to reorder how columns appear on the Priority Board. Done is always last.</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Column Name</TableHead>
              <TableHead className="hidden md:table-cell">Internal Key</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boardColumns.map((s, idx) => (
              <TableRow key={s.name}>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-foreground" onClick={() => handleMove(idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-foreground" onClick={() => handleMove(idx, 1)} disabled={idx === boardColumns.length - 1}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {editingName === s.name ? (
                    <div className="flex items-center gap-2">
                      <Input className="h-8 text-sm" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(s.name)} />
                      <Button size="sm" variant="outline" className="h-8" onClick={() => handleSaveRename(s.name)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingName(null)}>✕</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.label}</span>
                      {s.is_system_locked === 1 && <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" title="System locked" />}
                      {s.is_renamable === 0 && <Lock className="h-3.5 w-3.5 text-muted-foreground" title="Not renamable" />}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">{s.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {s.is_renamable !== 0 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-foreground" onClick={() => { setEditingName(s.name); setEditLabel(s.label) }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {s.is_system_locked !== 1 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-destructive" onClick={() => handleDeleteClick(s)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {/* Done row — informational only */}
            <TableRow className="opacity-50">
              <TableCell></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Done</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" title="System locked" />
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" title="Not renamable" />
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">done</TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">Always last</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Add Custom Column */}
        <div className="flex items-center gap-2">
          <Input className="flex-1 h-9" placeholder="Internal key (e.g., review)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input className="flex-1 h-9" placeholder="Display label (e.g., In Review)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
          <Button size="sm" onClick={handleAddStatus} disabled={!newName.trim() || !newLabel.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add Column
          </Button>
        </div>
      </div>

      <SafeDeleteStatusModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        status={deleteTarget}
        allStatuses={statuses}
        taskCount={deleteTaskCount}
        onConfirm={handleSafeDelete}
      />
    </div>
  )
}
