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
import { fetchTasks, updateTask, deleteTask } from '@/lib/api'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'

export default function RetroactiveDashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState([{ id: 'date_completed', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')

  const load = useCallback(async () => {
    try {
      const allTasks = await fetchTasks()
      // Only show completed tasks
      setData(allTasks.filter((t) => t.status_name === 'done'))
      setLoading(false)
    } catch { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleReopen = async (task) => {
    try {
      await updateTask(task.id, { status_name: 'active' }) // date_completed cleared by backend
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

  const columns = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.title}
          {row.original.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{row.original.description}</p>}
        </div>
      ),
      filterFn: 'includesString',
    },
    {
      accessorKey: 'customer',
      header: ({ column }) => <Button variant="ghost" className="px-0 font-medium" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Customer {column.getIsSorted() === 'asc' ? '↑' : column.getIsSorted() === 'desc' ? '↓' : '↕'}</Button>,
      cell: ({ row }) => row.getValue('customer') || '—',
      filterFn: 'includesString',
    },
    {
      accessorKey: 'project',
      header: ({ column }) => <Button variant="ghost" className="px-0 font-medium" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Project {column.getIsSorted() === 'asc' ? '↑' : column.getIsSorted() === 'desc' ? '↓' : '↕'}</Button>,
      cell: ({ row }) => row.getValue('project') || '—',
      filterFn: 'includesString',
    },
    {
      accessorKey: 'date_completed',
      header: ({ column }) => <Button variant="ghost" className="px-0 font-medium" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Completed {column.getIsSorted() === 'asc' ? '↑' : column.getIsSorted() === 'desc' ? '↓' : '↕'}</Button>,
      cell: ({ row }) => {
        const val = row.getValue('date_completed')
        return val ? new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleReopen(row.original)} title="Reopen Task">↩️</Button>
          <DeleteConfirmDialog title="Delete task?" description={`This will permanently delete "${row.original.title}". This cannot be undone.`} onConfirm={() => handleDelete(row.original)}>
            <Button variant="ghost" size="sm" title="Delete Task">🗑️</Button>
          </DeleteConfirmDialog>
        </div>
      ),
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
    globalFilterFn: (row, columnId, filterValue) => {
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
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>
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
    </div>
  )
}
