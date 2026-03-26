export const COLUMNS = [
  { key: 'My Tasks', label: 'My Tasks', statuses: ['Backlog', 'Next Up', 'In Progress'] },
  { key: 'Delegated/Waiting', label: 'Delegated / Waiting', statuses: ['Delegated/Waiting'] },
]

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
export const STATUSES = ['Backlog', 'Next Up', 'In Progress', 'Delegated/Waiting', 'Done']
export const WORKSTREAMS = ['None', 'Mark Eichten', 'Garrett Stuart', 'Caleb Johnson']

export const PRIORITY_STYLES = {
  Low: 'bg-priority-low text-priority-low-foreground',
  Medium: 'bg-priority-medium text-priority-medium-foreground',
  High: 'bg-priority-high text-priority-high-foreground',
  Critical: 'bg-priority-critical text-priority-critical-foreground',
}

export const WORKSTREAM_STYLES = {
  None: '',
  'Mark Eichten': 'bg-workstream-a text-workstream-a-foreground',
  'Garrett Stuart': 'bg-workstream-b text-workstream-b-foreground',
  'Caleb Johnson': 'bg-workstream-c text-workstream-c-foreground',
}
