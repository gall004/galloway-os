import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ConfigTable from '@/components/ConfigTable'

const TABS = [
  { key: 'customers', label: 'Customer' },
  { key: 'projects', label: 'Project', parentEntity: 'customers', parentLabel: 'Customer' },
  { key: 'workstreams', label: 'Workstream' },
  { key: 'statuses', label: 'Status' },
  { key: 'priorities', label: 'Priority' },
]

/**
 * @description Settings view — tabbed config CRUD management.
 */
export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('customers')
  const tab = TABS.find((t) => t.key === activeTab)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h2 className="text-lg font-bold text-foreground">Configuration</h2>
      <div className="flex gap-1 border-b border-border pb-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={activeTab === t.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}s
          </Button>
        ))}
      </div>
      {tab && (
        <ConfigTable
          key={tab.key}
          entity={tab.key}
          label={tab.label}
          parentEntity={tab.parentEntity}
          parentLabel={tab.parentLabel}
        />
      )}
    </div>
  )
}
