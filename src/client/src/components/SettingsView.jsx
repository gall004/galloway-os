import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ConfigTable from '@/components/ConfigTable'
import RecurringSettings from '@/components/RecurringSettings'
import WorkflowSettings from '@/components/WorkflowSettings'
import AppearanceSettings from '@/components/AppearanceSettings'

const TAB_LABELS = {
  workflow: 'Workflow',
  customers: 'Customers',
  projects: 'Projects',
  recurring: 'Recurring Tasks',
  appearance: 'Appearance',
}

const TABS = [
  { key: 'workflow', label: 'Workflow', pluralLabel: 'Workflow' },
  { key: 'customers', label: 'Customer', pluralLabel: 'Customers' },
  { key: 'projects', label: 'Project', pluralLabel: 'Projects', parentEntity: 'customers', parentLabel: 'Customer' },
  { key: 'recurring', label: 'Recurring', pluralLabel: 'Recurring Tasks' },
  { key: 'appearance', label: 'Appearance', pluralLabel: 'Appearance' },
]

/**
 * @description Settings view — tabbed config management with Workflow, data, recurring, and appearance tabs.
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
      ) : tab?.key === 'appearance' ? (
        <AppearanceSettings key="appearance" />
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
