import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your workflow layout, preferences, and data lists.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 lg:w-64 flex-shrink-0">
          {/* Mobile Navigation */}
          <div className="md:hidden mb-2">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {TABS.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {TAB_LABELS[t.key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-col gap-1">
            {TABS.map((t) => (
              <Button
                key={t.key}
                variant={activeTab === t.key ? 'secondary' : 'ghost'}
                className={`justify-start flex-shrink-0 ${activeTab === t.key ? 'font-medium bg-muted' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {TAB_LABELS[t.key]}
              </Button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
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
        </main>
      </div>
    </div>
  )
}
