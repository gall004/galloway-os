import { useState, useEffect, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchTasks } from '@/lib/api'
import { WORKSTREAMS, PRIORITY_STYLES } from '@/lib/constants'

/**
 * @description RetroactiveDashboard — data table of completed tasks.
 * Supports sorting by date_completed and filtering by project/workstream
 * for performance review retrieval.
 */
export default function RetroactiveDashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('date_completed')
  const [sortDir, setSortDir] = useState('desc')
  const [filterProject, setFilterProject] = useState('')
  const [filterWorkstream, setFilterWorkstream] = useState('All')

  useEffect(() => {
    fetchTasks()
      .then((data) => {
        setTasks(data.filter((t) => t.status === 'Done'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const projects = useMemo(() => {
    const items = [...new Set(tasks.map((t) => t.associated_project).filter(Boolean))]
    return items.sort()
  }, [tasks])

  const filtered = useMemo(() => {
    let result = [...tasks]
    if (filterProject) {
      result = result.filter((t) => t.associated_project === filterProject)
    }
    if (filterWorkstream !== 'All') {
      result = result.filter((t) => t.workstream === filterWorkstream)
    }
    result.sort((a, b) => {
      const aVal = a[sortField] || ''
      const bVal = b[sortField] || ''
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
    return result
  }, [tasks, filterProject, filterWorkstream, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortIcon = (field) => {
    if (sortField !== field) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground animate-pulse">Loading achievements…</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground mr-auto">
          Completed Tasks ({filtered.length})
        </h2>
        <Select value={filterWorkstream} onValueChange={setFilterWorkstream}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Workstream" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Workstreams</SelectItem>
            {WORKSTREAMS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterProject || '_all'} onValueChange={(v) => setFilterProject(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Projects</SelectItem>
            {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search titles…"
          className="w-[200px]"
          onChange={(e) => {
            const q = e.target.value.toLowerCase()
            if (!q) {
              fetchTasks().then((d) => setTasks(d.filter((t) => t.status === 'Done')))
            } else {
              setTasks((prev) => prev.filter((t) => t.title.toLowerCase().includes(q)))
            }
          }}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="px-0 font-medium" onClick={() => toggleSort('date_completed')}>
                  Completed {sortIcon('date_completed')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="px-0 font-medium" onClick={() => toggleSort('associated_project')}>
                  Project {sortIcon('associated_project')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="px-0 font-medium" onClick={() => toggleSort('workstream')}>
                  Workstream {sortIcon('workstream')}
                </Button>
              </TableHead>
              <TableHead>Delegated To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                  No completed tasks match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    {task.title}
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${PRIORITY_STYLES[task.priority] || ''}`}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(task.date_completed)}</TableCell>
                  <TableCell className="text-sm">{task.associated_project || '—'}</TableCell>
                  <TableCell className="text-sm">{task.workstream === 'None' ? '—' : task.workstream}</TableCell>
                  <TableCell className="text-sm">{task.delegated_to || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
