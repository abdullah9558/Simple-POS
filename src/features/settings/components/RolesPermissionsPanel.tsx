import { Badge } from '../../../components/ui'
import { Fragment } from 'react'
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, ROLE_LABELS, type UserRole } from '../../../shared/permissions'

export default function RolesPermissionsPanel() {
  const roles: UserRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER']
  const groups = [...new Set(ALL_PERMISSIONS.map((p) => p.group))]

  return (
    <div className="space-y-6">
      <p className="text-body text-text-muted">
        Role-based access control defines what each user role can do in the system.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full text-body">
          <thead className="border-b border-border-subtle bg-surface-inset">
            <tr>
              <th className="px-4 py-3 text-left text-overline text-text-muted">Permission</th>
              {roles.map((role) => (
                <th key={role} className="px-4 py-3 text-center text-overline text-text-muted">{ROLE_LABELS[role]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {groups.map((group) => (
              <Fragment key={group}>
                <tr className="bg-surface-raised/50">
                  <td colSpan={4} className="px-4 py-2 text-caption-medium text-text-muted uppercase tracking-wider">{group}</td>
                </tr>
                {ALL_PERMISSIONS.filter((p) => p.group === group).map((perm) => (
                  <tr key={perm.key} className="hover:bg-surface-raised/30">
                    <td className="px-4 py-2.5 text-text-secondary">{perm.label}</td>
                    {roles.map((role) => (
                      <td key={role} className="px-4 py-2.5 text-center">
                        {ROLE_PERMISSIONS[role].includes(perm.key) ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
                          </span>
                        ) : (
                          <span className="inline-block h-5 w-5 rounded-full bg-surface-inset" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <Badge key={role} variant={role === 'ADMIN' ? 'danger' : role === 'MANAGER' ? 'warning' : 'default'}>
            {ROLE_LABELS[role]} — {ROLE_PERMISSIONS[role].length} permissions
          </Badge>
        ))}
      </div>
    </div>
  )
}
