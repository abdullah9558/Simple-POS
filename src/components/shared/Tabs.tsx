interface Tab {
  id: string
  label: string
  count?: number
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export default function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-border-subtle">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-2.5 text-body-medium transition-fast transition-colors ${
            active === tab.id
              ? 'text-accent after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              active === tab.id ? 'bg-accent/15 text-accent' : 'bg-surface-inset text-text-muted'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
