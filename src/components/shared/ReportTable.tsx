import type { ReactNode } from 'react'

export interface ReportColumn<T> {
  key: keyof T | string
  label: string
  align?: 'left' | 'right'
  format?: (row: T) => ReactNode
}

interface Props<T extends object> {
  columns: ReportColumn<T>[]
  rows: T[]
  emptyMessage?: string
}

export default function ReportTable<T extends object>({ columns, rows, emptyMessage = 'No data' }: Props<T>) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border-subtle bg-surface-raised py-12 text-body text-text-muted">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle">
      <table className="w-full text-body">
        <thead className="border-b border-border-subtle bg-surface-inset">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className={`px-4 py-3 text-overline text-text-muted ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-surface-raised/50 transition-fast">
              {columns.map((col) => (
                <td key={String(col.key)} className={`px-4 py-3 text-text-secondary ${col.align === 'right' ? 'text-right tabular-nums' : ''}`}>
                  {col.format ? col.format(row) : String(row[col.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
