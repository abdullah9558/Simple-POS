import { type ReactNode, useEffect, useRef, useState } from 'react'

export interface DropdownItem {
  label: string
  value: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
}

export interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  onSelect: (value: string) => void
  align?: 'left' | 'right'
}

export default function Dropdown({ trigger, items, onSelect, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>

      {open && (
        <div
          className={`absolute z-dropdown mt-1 min-w-[180px] surface-overlay py-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                onSelect(item.value)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-body transition-fast transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                item.danger
                  ? 'text-danger hover:bg-danger-muted'
                  : 'text-text-secondary hover:bg-surface-inset hover:text-text-primary'
              }`}
            >
              {item.icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
