import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from '../../../components/ui'
import EmptyState from '../../../components/shared/EmptyState'
import type { SafeUser } from '../api/settingsApi'

interface Props {
  users: SafeUser[]
  onEdit: (user: SafeUser) => void
  onDelete: (user: SafeUser) => void
}

const roleVariant = { OWNER: 'danger', ADMIN: 'danger', MANAGER: 'warning', CASHIER: 'default' } as const

export default function UserTable({ users, onEdit, onDelete }: Props) {
  if (users.length === 0) {
    return <EmptyState title="No users found" description="Add a user to get started" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Sales</TableHead>
          <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium text-text-primary">{user.name}</TableCell>
            <TableCell className="text-caption">{user.email}</TableCell>
            <TableCell><Badge variant={roleVariant[user.role]}>{user.role}</Badge></TableCell>
            <TableCell><Badge variant={user.isActive ? 'success' : 'default'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
            <TableCell className="tabular-nums">{user._count.sales}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(user)} aria-label={`Edit ${user.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(user)} className="text-danger hover:text-danger" aria-label={`Delete ${user.name}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
