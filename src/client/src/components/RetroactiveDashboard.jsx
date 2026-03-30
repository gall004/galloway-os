import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchTasks, updateTask, deleteTask, fetchConfig } from '@/lib/api'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import TaskModal from '@/components/TaskModal'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, RotateCcw, Edit2, Trash2 } from 'lucide-react'

/**
 * @description Completed tasks ledger with overflow-safe table and dropdown actions.
 */
export default function RetroactiveDashboard() {
  const [data, setData] = useState([])
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState([{ id: 'date_completed', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    try {
      const [allTasks, customers, projects, statuses] = await Promise.all([
        fetchTasks(), fetchConfig('customers'), fetchConfig('projects'), fetchConfig('statuses'),
      ])
      setData(allTasks.filter((t) => t.status_name === 'done'))
      setConfig({ customers, projects, statuses })
      setLoading(false)
    } catch { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleReopen = async (task) => {
    try {
      await updateTask(task.id, { status_name: 'active' })
      setData((prev) => prev.filter((t) => t.id !== task.id))
      toast.success('Task reopened')
    } catch (e) { toast.error(e.message) }
  }

  const handleDelete = async (task) => {
    try {
      await deleteTask(task.id)
      setData((prev) => prev.filter((t) => t.id !== task.id))
      toast.success('Task deleted')
    } catch (e) { toast.error(e.message) }
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  const handleSaveTask = async (taskData) => {
    try {
      const updated = await updateTask(editingTask.id, taskData)
      setData((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      toast.success('Task updated')
      setModalOpen(false)
      setEditingTask(null)
    } catch (e) { toast.error(e.message) }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Task',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{row.original.title}</p>
          {row.original.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{row.original.description}</p>}
          {row.original.impact_statement && <p className="text-xs text-primary/80 italic truncate mt-0.5">↳ {row.original.impact_statement}</p>}
        </div>
      ),
      filterFn: 'includesString',
    },
    {
      accessorKey: 'customer',
      header: ({ column }) => <Button variant="ghost" className="px-0 font-medium whitespace-nowrap" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Customer {column.getIsSorted() === 'asc' ? '↑' : column.getIsSorted() === 'desc' ? '↓' : '↕'}</Button>,
      cell: ({ row }) => <span className="whitespace-nowrap">{row.getValue('customer') || '—'}</span>,
      filterFn: 'includesString',
      size: 120,
    },
    {
      accessorKey: 'project',
      header: ({ column }) => <Button variant="ghost" className="px-0 font-medium whitespace-nowrap" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Project {column.getIsSorted() === 'asc' ? '↑' : column.getIsSorted() === 'desc' ? '↓' : '↕'}</Button>,
      cell: ({ row }) => <span className="whitespace-nowrap">{row.getValue('project') || '—'}</span>,
      filterFn: 'includesString',
      size: 140,
    },
    {
      accessorKey: 'date_completed',
      header: ({ column }) => <Button variant="ghost" className="px-0 font-medium whitespace-nowrap" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Completed {column.getIsSorted() === 'asc' ? '↑' : column.getIsSorted() === 'desc' ? '↓' : '↕'}</Button>,
      cell: ({ row }) => {
        const val = row.getValue('date_completed')
        return <span className="whitespace-nowrap">{val ? new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span>
      },
      size: 120,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => handleEdit(row.original)} className="cursor-pointer">
              <Edit2 className="w-4 h-4 mr-2" /> Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleReopen(row.original)} className="cursor-pointer">
              <RotateCcw className="w-4 h-4 mr-2" /> Reopen Task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setDeleteTarget(row.original)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 48,
    },
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
    globalFilterFn: (row, _columnId, filterValue) => {
      const safeLower = (val) => String(val || '').toLowerCase()
      const term = filterValue.toLowerCase()
      return safeLower(row.original.title).includes(term) ||
             safeLower(row.original.customer).includes(term) ||
             safeLower(row.original.project).includes(term)
    },
  })

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground animate-pulse">Loading…</p></div>

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Completed Tasks ({data.length})</h2>
        <Input
          placeholder="Filter by title, customer, or project…"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="rounded-md border bg-card overflow-hidden">
        <Table className="table-fixed w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.getSize() !== 150 ? header.column.getSize() : undefined }}
                    className={header.id === 'title' ? 'w-full' : 'w-auto'}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="truncate">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No completed tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} entry(s)
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>

      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={editingTask} onSave={handleSaveTask} onDelete={handleDelete} config={config} onConfigChange={setConfig} />
      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} title="Delete task?" description={`Permanently delete "${deleteTarget?.title}"?`} onConfirm={() => { handleDelete(deleteTarget); setDeleteTarget(null) }} />
    </div>
  )
}
