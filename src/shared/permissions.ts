export type Permission =
  | 'checkout'
  | 'products:read'
  | 'products:write'
  | 'sales:read'
  | 'sales:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'customers:read'
  | 'customers:write'
  | 'reports:read'
  | 'settings:read'
  | 'settings:write'
  | 'users:manage'
  | 'stores:manage'
  | 'stores:transfer'
  | 'sync:manage'

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    'checkout', 'products:read', 'products:write', 'sales:read', 'sales:write',
    'inventory:read', 'inventory:write', 'customers:read', 'customers:write',
    'reports:read', 'settings:read', 'settings:write', 'users:manage',
    'stores:manage', 'stores:transfer', 'sync:manage',
  ],
  ADMIN: [
    'checkout', 'products:read', 'products:write', 'sales:read', 'sales:write',
    'inventory:read', 'inventory:write', 'customers:read', 'customers:write',
    'reports:read', 'settings:read', 'settings:write', 'users:manage',
    'stores:manage', 'stores:transfer', 'sync:manage',
  ],
  MANAGER: [
    'checkout', 'products:read', 'products:write', 'sales:read', 'sales:write',
    'inventory:read', 'inventory:write', 'customers:read', 'customers:write',
    'reports:read', 'stores:transfer',
  ],
  CASHIER: ['checkout', 'sales:read', 'products:read', 'customers:read'],
}

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: 'checkout', label: 'Process Checkout', group: 'Sales' },
  { key: 'sales:read', label: 'View Sales', group: 'Sales' },
  { key: 'sales:write', label: 'Manage Sales', group: 'Sales' },
  { key: 'products:read', label: 'View Products', group: 'Catalog' },
  { key: 'products:write', label: 'Manage Products', group: 'Catalog' },
  { key: 'inventory:read', label: 'View Inventory', group: 'Inventory' },
  { key: 'inventory:write', label: 'Manage Inventory', group: 'Inventory' },
  { key: 'stores:transfer', label: 'Transfer Stock', group: 'Inventory' },
  { key: 'customers:read', label: 'View Customers', group: 'Customers' },
  { key: 'customers:write', label: 'Manage Customers', group: 'Customers' },
  { key: 'reports:read', label: 'View Reports', group: 'Reports' },
  { key: 'settings:read', label: 'View Settings', group: 'Settings' },
  { key: 'settings:write', label: 'Manage Settings', group: 'Settings' },
  { key: 'users:manage', label: 'Manage Users', group: 'Users' },
  { key: 'stores:manage', label: 'Manage Stores', group: 'Stores' },
  { key: 'sync:manage', label: 'Manage Sync', group: 'Sync' },
]
