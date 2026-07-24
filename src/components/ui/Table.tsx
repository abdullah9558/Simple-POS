import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes, HTMLAttributes } from 'react'

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode
}

export default function Table({ className = '', children, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle">
      <table className={`w-full text-body ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`border-b border-border-subtle bg-surface-inset ${className}`} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-border-subtle ${className}`} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ className = '', children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`transition-fast transition-colors hover:bg-surface-raised/50 ${className}`} {...props}>
      {children}
    </tr>
  )
}

export function TableHead({ className = '', children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3 text-left text-overline text-text-muted ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ className = '', children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 text-text-secondary ${className}`} {...props}>
      {children}
    </td>
  )
}
