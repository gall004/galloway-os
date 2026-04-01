import { useState, useEffect, useCallback, Fragment } from 'react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { fetchTasks, deleteTask, fetchConfig } from '@/lib/api'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import RecurringTaskModal from '@/components/RecurringTaskModal'
import { Edit2, Trash2, Zap } from 'lucide-react'

export default function RecurringSettings() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [config, setConfig] = useState({})

  const load = useCallback(async () => {
    try {
      const [allRules, customers, projects, statuses] = await Promise.all([
        fetchTasks('is_template=true'), fetchConfig('customers'), fetchConfig('projects'), fetchConfig('statuses')
      ])
      setData(allRules)
      setConfig({ customers, projects, statuses })
      setLoading(false)
    } catch { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditingRule(null); setModalOpen(true) }
  const openEdit = (rule) => { setEditingRule(rule); setModalOpen(true) }

  const handleDelete = async (rule) => {
    try {
      await deleteTask(rule.id)
      setData((prev) => prev.filter((r) => r.id !== rule.id))
      toast.success('Template deleted')
    } catch (e) { toast.error(e.message) }
  }

  const [expandedRow, setExpandedRow] = useState(null)

  if (loading) return <div className="text-center p-8 text-muted-foreground animate-pulse">Loading templates...</div>

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Recurring Task Templates</h3>
        <Button size="sm" onClick={openCreate}>+ Add Template</Button>
      </div>
      
      {data.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/10 text-muted-foreground flex flex-col items-center justify-center space-y-3">
          <Zap className="w-8 h-8 opacity-50" />
          <p>No recurring tasks set up yet.</p>
          <p className="text-sm">Create a blueprint to have tasks automatically spawn based on a schedule.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Title</TableHead>
              <TableHead className="hidden md:table-cell">Frequency</TableHead>
              <TableHead className="hidden md:table-cell">Next Run</TableHead>
              <TableHead className="hidden md:table-cell">Active</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((rule) => {
              const isExpanded = expandedRow === rule.id
              return (
                <Fragment key={rule.id}>
                  <TableRow 
                    onClick={() => setExpandedRow(isExpanded ? null : rule.id)}
                    className="cursor-pointer md:cursor-default transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium truncate">{rule.title}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize">{rule.frequency}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{rule.next_run_date || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell">{rule.is_active_template ? <span className="text-green-500 font-medium">Yes</span> : <span className="text-muted-foreground">No</span>}</TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-foreground" onClick={(e) => { e.stopPropagation(); openEdit(rule) }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog title="Delete Template?" description={`Permanently delete "${rule.title}"? Automatic tasks will no longer trigger.`} onConfirm={() => handleDelete(rule)}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="md:hidden bg-muted/20 border-b">
                      <TableCell colSpan={2} className="px-5 py-3 border-l-2 border-primary/50">
                        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                           <div className="flex gap-2"><strong className="text-foreground min-w-16">Status:</strong> <span className={rule.is_active_template ? "text-green-500 font-medium" : ""}>{rule.is_active_template ? 'Active' : 'Inactive'}</span></div>
                           <div className="flex gap-2"><strong className="text-foreground min-w-16">Freq:</strong> <span className="capitalize">{rule.frequency}</span></div>
                           <div className="flex gap-2"><strong className="text-foreground min-w-16">Next:</strong> <span>{rule.next_run_date || 'N/A'}</span></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      )}

      <RecurringTaskModal open={modalOpen} onOpenChange={setModalOpen} rule={editingRule} onSave={() => { setModalOpen(false); load() }} config={config} onConfigChange={setConfig} />
    </div>
  )
}
