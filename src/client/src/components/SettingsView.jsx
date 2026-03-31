import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ConfigTable from '@/components/ConfigTable'
import RecurringSettings from '@/components/RecurringSettings'
import WorkflowSettings from '@/components/WorkflowSettings'

const TAB_LABELS = {
  workflow: 'Workflow',
  statuses: 'Statuses',
  customers: 'Customers',
  projects: 'Projects',
  recurring: 'Recurring Tasks',
}

const TABS = [
  { key: 'workflow', label: 'Workflow', pluralLabel: 'Workflow' },
  { key: 'statuses', label: 'Status', pluralLabel: 'Statuses', readOnly: true, nameField: 'name' },
  { key: 'customers', label: 'Customer', pluralLabel: 'Customers' },
  { key: 'projects', label: 'Project', pluralLabel: 'Projects', parentEntity: 'customers', parentLabel: 'Customer' },
  { key: 'recurring', label: 'Recurring', pluralLabel: 'Recurring Tasks' },
]

/**
 * @description Settings view — tabbed config CRUD management with Workflow engine tab.
 */
export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('workflow')
  const tab = TABS.find((t) => t.key === activeTab)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h2 className="text-lg font-bold text-foreground">Configuration</h2>
      <div className="flex gap-1 border-b border-border pb-2 overflow-x-auto">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={activeTab === t.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(t.key)}
          >
            {TAB_LABELS[t.key]}
          </Button>
        ))}
      </div>
      {tab?.key === 'workflow' ? (
        <WorkflowSettings key="workflow" />
      ) : tab?.key === 'recurring' ? (
        <RecurringSettings key="recurring" />
      ) : tab ? (
        <ConfigTable
          key={tab.key}
          entity={tab.key}
          label={tab.label}
          pluralLabel={tab.pluralLabel}
          parentEntity={tab.parentEntity}
          parentLabel={tab.parentLabel}
          readOnly={tab.readOnly}
          nameField={tab.nameField}
        />
      ) : null}
    </div>
  )
}
