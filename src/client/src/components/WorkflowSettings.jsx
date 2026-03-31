import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Edit2, Trash2, Plus, Lock, ShieldCheck, GripVertical } from 'lucide-react'
import { fetchSettings, updateSettings, fetchConfig, createStatus, updateStatus, deleteStatus, reorderStatuses, fetchTasks, reassignStatusTasks } from '@/lib/api'
import SafeDeleteStatusModal from '@/components/SafeDeleteStatusModal'
import SafeDisableModeModal from '@/components/SafeDisableModeModal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableRow({ status, editingName, editLabel, setEditingName, setEditLabel, handleSaveRename, handleDeleteClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.name })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted/50 relative z-50 shadow-sm' : ''}>
      <TableCell className="w-16">
        <Button variant="ghost" size="icon" className="h-6 w-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:bg-transparent" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell>
        {editingName === status.name ? (
          <div className="flex items-center gap-2">
            <Input className="h-8 text-sm" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(status.name)} />
            <Button size="sm" variant="outline" className="h-8" onClick={() => handleSaveRename(status.name)}>Save</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingName(null)}>✕</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium">{status.label}</span>
            {status.is_system_locked === 1 && <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" title="System locked" />}
            {status.is_renamable === 0 && <Lock className="h-3.5 w-3.5 text-muted-foreground" title="Not renamable" />}
          </div>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">{status.name}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {status.is_renamable !== 0 && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-foreground" onClick={() => { setEditingName(status.name); setEditLabel(status.label) }}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {status.is_system_locked !== 1 && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-destructive" onClick={() => handleDeleteClick(status)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

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
  const [disableModeContext, setDisableModeContext] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
      if (value === false) {
        const modeStatusMap = {
          inbox_mode: { name: 'inbox', label: 'Inbox Mode' },
          manager_mode: { name: 'delegated', label: 'Manager Mode' }
        };
        const st = modeStatusMap[field];
        if (st) {
          const tasks = await fetchTasks();
          const count = tasks.filter((t) => t.status_name === st.name).length;
          if (count > 0) {
            setDisableModeContext({ field, modeName: st.label, statusName: st.name, taskCount: count });
            return;
          }
        }
      }

      const updated = await updateSettings({ [field]: value })
      setSettings(updated)
      toast.success('Setting updated')
    } catch (e) { toast.error(e.message) }
  }

  const handleSafeDisableMode = async (statusName, fallback) => {
    try {
      if (fallback !== 'none') {
        await reassignStatusTasks(statusName, fallback);
      }
      const updated = await updateSettings({ [disableModeContext.field]: false });
      setSettings(updated);
      setDisableModeContext(null);
      load();
      toast.success(fallback === 'none' ? `${disableModeContext.modeName} disabled (tasks hidden)` : `Tasks moved and ${disableModeContext.modeName} disabled`);
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
      const st = statuses.find(s => s.name === name)
      if (!st || st.label === editLabel) { setEditingName(null); return }
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

  const boardColumns = statuses.filter((s) => {
    if (s.system_name === 'done') return false;
    if (s.system_name === 'inbox' && !settings?.inbox_mode) return false;
    if (s.system_name === 'delegated' && !settings?.manager_mode) return false;
    return true;
  })

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = boardColumns.findIndex((col) => col.name === active.id)
    const newIndex = boardColumns.findIndex((col) => col.name === over.id)

    const reordered = arrayMove(boardColumns, oldIndex, newIndex)
    const newStatuses = [...reordered, statuses.find(s => s.system_name === 'done')]
    setStatuses(newStatuses) // Optimistic update

    const items = reordered.map((s, i) => ({ name: s.name, display_order: i }))
    try {
      const updated = await reorderStatuses(items)
      setStatuses(updated)
      toast.success('Column order updated')
    } catch (e) {
      toast.error(e.message)
      load() // Revert on error
    }
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={boardColumns.map(s => s.name)} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>Column Name</TableHead>
                  <TableHead className="hidden md:table-cell">Internal Key</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boardColumns.map((s) => (
                  <SortableRow
                    key={s.name}
                    status={s}
                    editingName={editingName}
                    editLabel={editLabel}
                    setEditingName={setEditingName}
                    setEditLabel={setEditLabel}
                    handleSaveRename={handleSaveRename}
                    handleDeleteClick={handleDeleteClick}
                  />
                ))}
                {/* Done row — informational only */}
                <TableRow className="opacity-50 pointer-events-none">
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
          </SortableContext>
        </DndContext>

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

      <SafeDisableModeModal
        open={!!disableModeContext}
        onOpenChange={(v) => !v && setDisableModeContext(null)}
        {...(disableModeContext || {})}
        allStatuses={statuses}
        onConfirm={handleSafeDisableMode}
      />
    </div>
  )
}
