export const COLUMNS = [
  { key: 'My Tasks', label: 'My Tasks', statusNames: ['Backlog', 'Next Up', 'In Progress'] },
  { key: 'Delegated/Waiting', label: 'Delegated / Waiting', statusNames: ['Delegated/Waiting'] },
]

export const PRIORITY_STYLES = {
  Low: 'bg-priority-low text-priority-low-foreground',
  Medium: 'bg-priority-medium text-priority-medium-foreground',
  High: 'bg-priority-high text-priority-high-foreground',
  Critical: 'bg-priority-critical text-priority-critical-foreground',
}

export const WORKSTREAM_STYLES = {
  'N/A': '',
  'Mark Eichten': 'bg-workstream-a text-workstream-a-foreground',
  'Garrett Stuart': 'bg-workstream-b text-workstream-b-foreground',
  'Caleb Johnson': 'bg-workstream-c text-workstream-c-foreground',
}
