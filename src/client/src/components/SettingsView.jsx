import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings2, Users, FolderKanban, Repeat, Palette } from 'lucide-react'
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
  { key: 'workflow', label: 'Workflow', pluralLabel: 'Workflow', icon: Settings2 },
  { key: 'customers', label: 'Customer', pluralLabel: 'Customers', icon: Users },
  { key: 'projects', label: 'Project', pluralLabel: 'Projects', parentEntity: 'customers', parentLabel: 'Customer', icon: FolderKanban },
  { key: 'recurring', label: 'Recurring', pluralLabel: 'Recurring Tasks', icon: Repeat },
  { key: 'appearance', label: 'Appearance', pluralLabel: 'Appearance', icon: Palette },
]

/**
 * @description Settings view — tabbed config management with Workflow, data, recurring, and appearance tabs.
 */
export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('workflow')
  const tab = TABS.find((t) => t.key === activeTab)

  return (
    <div className="w-full flex-1 max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your workflow layout, preferences, and data lists.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 lg:w-64 shrink-0">
          {/* Mobile Navigation */}
          <div className="md:hidden mb-2">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {TABS.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    <div className="flex items-center gap-2">
                      {t.icon && <t.icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span>{TAB_LABELS[t.key]}</span>
                    </div>
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
                className={`justify-start shrink-0 ${activeTab === t.key ? 'font-medium bg-muted text-foreground' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.icon && <t.icon className="mr-2 h-4 w-4" />}
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
