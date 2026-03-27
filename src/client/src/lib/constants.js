export const COLUMNS = [
  { key: 'Active', label: 'Active', statusNames: ['Active'] },
  { key: 'Delegated/Waiting', label: 'Delegated / Waiting', statusNames: ['Delegated/Waiting'] },
]

export const STATUSES = ['Active', 'Delegated/Waiting', 'Done']

export const PRIORITY_STYLES = {
  Low: 'bg-priority-low text-priority-low-foreground',
  Medium: 'bg-priority-medium text-priority-medium-foreground',
  High: 'bg-priority-high text-priority-high-foreground',
  Critical: 'bg-priority-critical text-priority-critical-foreground',
}
