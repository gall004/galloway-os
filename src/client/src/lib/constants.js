export const COLUMNS = [
  { key: 'Backlog', label: 'Backlog', color: 'border-slate-300 dark:border-slate-700' },
  { key: 'Next Up', label: 'Next Up', color: 'border-blue-400 dark:border-blue-600' },
  { key: 'In Progress', label: 'In Progress', color: 'border-amber-400 dark:border-amber-600' },
  { key: 'Delegated/Waiting', label: 'Delegated / Waiting', color: 'border-orange-400 dark:border-orange-600' },
  { key: 'Done', label: 'Done', color: 'border-emerald-400 dark:border-emerald-600' },
]

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
export const STATUSES = ['Backlog', 'Next Up', 'In Progress', 'Delegated/Waiting', 'Done']
export const WORKSTREAMS = ['None', 'Mark Eichten', 'Garrett Stuart', 'Caleb Johnson']

export const PRIORITY_STYLES = {
  Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  High: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export const WORKSTREAM_STYLES = {
  None: '',
  'Mark Eichten': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'Garrett Stuart': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'Caleb Johnson': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
}
