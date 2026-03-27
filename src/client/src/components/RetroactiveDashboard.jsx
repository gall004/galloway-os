import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchTasks, updateTask, fetchConfig } from '@/lib/api'
import { PRIORITY_STYLES } from '@/lib/constants'

/**
 * @description RetroactiveDashboard — data table of completed tasks with Reopen action.
 */
export default function RetroactiveDashboard() {
  const [allTasks, setAllTasks] = useState([])
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('date_completed')
  const [sortDir, setSortDir] = useState('desc')
  const [filterProject, setFilterProject] = useState('_all')
  const [filterWorkstream, setFilterWorkstream] = useState('All')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const [t, statuses] = await Promise.all([fetchTasks(), fetchConfig('statuses')])
      setAllTasks(t)
      setConfig({ statuses })
      setLoading(false)
    } catch { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const doneTasks = useMemo(() => allTasks.filter((t) => t.status === 'Done'), [allTasks])

  const projects = useMemo(() => {
    return [...new Set(doneTasks.map((t) => t.project).filter((p) => p && p !== 'N/A'))].sort()
  }, [doneTasks])

  const workstreams = useMemo(() => {
    return [...new Set(doneTasks.map((t) => t.workstream).filter((w) => w && w !== 'N/A'))].sort()
  }, [doneTasks])

  const filtered = useMemo(() => {
    let result = [...doneTasks]
    if (filterProject !== '_all') result = result.filter((t) => t.project === filterProject)
    if (filterWorkstream !== 'All') result = result.filter((t) => t.workstream === filterWorkstream)
    if (search) result = result.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    result.sort((a, b) => {
      const aVal = a[sortField] || ''
      const bVal = b[sortField] || ''
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
    return result
  }, [doneTasks, filterProject, filterWorkstream, search, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const sortIcon = (field) => sortField !== field ? '↕' : sortDir === 'asc' ? '↑' : '↓'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  const handleReopen = async (task) => {
    const backlogId = config.statuses?.find((s) => s.name === 'Backlog')?.id
    if (!backlogId) return
    try {
      const updated = await updateTask(task.id, { status_id: backlogId, date_completed: null })
      setAllTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t))
      toast.success('Task reopened')
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground animate-pulse">Loading…</p></div>

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground mr-auto">Completed ({filtered.length})</h2>
        <Select value={filterWorkstream} onValueChange={setFilterWorkstream}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Workstream" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Workstreams</SelectItem>
            {workstreams.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Projects</SelectItem>
            {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Search…" className="w-[180px]" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead><Button variant="ghost" size="sm" className="px-0 font-medium" onClick={() => toggleSort('date_completed')}>Completed {sortIcon('date_completed')}</Button></TableHead>
              <TableHead><Button variant="ghost" size="sm" className="px-0 font-medium" onClick={() => toggleSort('project')}>Project {sortIcon('project')}</Button></TableHead>
              <TableHead><Button variant="ghost" size="sm" className="px-0 font-medium" onClick={() => toggleSort('workstream')}>Workstream {sortIcon('workstream')}</Button></TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">No completed tasks.</TableCell></TableRow>
            ) : filtered.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}{task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}</TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] ${PRIORITY_STYLES[task.priority] || ''}`}>{task.priority}</Badge></TableCell>
                <TableCell className="text-sm">{formatDate(task.date_completed)}</TableCell>
                <TableCell className="text-sm">{task.project && task.project !== 'N/A' ? task.project : '—'}</TableCell>
                <TableCell className="text-sm">{task.workstream && task.workstream !== 'N/A' ? task.workstream : '—'}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleReopen(task)} title="Reopen">↩️</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
