export const COLUMNS = [
  { key: 'active', label: 'Active', statusNames: ['active'] },
  { key: 'delegated', label: 'Delegated / Waiting', statusNames: ['delegated'] },
]

export const STATUS_KEYS = ['active', 'delegated', 'done']

export const PRIORITY_STYLES = {
  Low: 'bg-priority-low text-priority-low-foreground',
  Medium: 'bg-priority-medium text-priority-medium-foreground',
  High: 'bg-priority-high text-priority-high-foreground',
  Critical: 'bg-priority-critical text-priority-critical-foreground',
}
