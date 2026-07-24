import { NavLink } from 'react-router'
import simplePosIcon from '../../assets/simplepos-icon.png'

const navItems = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/products', label: 'Products', icon: ProductsIcon },
  { to: '/categories', label: 'Categories', icon: CategoriesIcon },
  { to: '/checkout', label: 'Checkout', icon: CheckoutIcon },
  { to: '/sales', label: 'Sales', icon: SalesIcon },
  { to: '/inventory', label: 'Inventory', icon: InventoryIcon },
  { to: '/customers', label: 'Customers', icon: CustomersIcon },
  { to: '/reports', label: 'Reports', icon: ReportsIcon },
]

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-sticky flex w-sidebar flex-col bg-sidebar border-r border-border-subtle">
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-border-subtle">
        <img
          src={simplePosIcon}
          alt="SimplePOS"
          className="h-8 w-8 rounded-md object-contain bg-white"
        />
        <span className="text-body-medium text-text-primary tracking-tight">
          SimplePOS
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-styled px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-body font-medium transition-default transition-colors ${
                    isActive
                      ? 'bg-sidebar-active text-text-primary'
                      : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary'
                  }`
                }
              >
                <Icon />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border-subtle px-3 py-3">
        <NavLink
          to="/settings"
          aria-label="Open profile and settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 transition-default transition-colors ${
              isActive
                ? 'bg-sidebar-active text-text-primary'
                : 'text-text-secondary hover:bg-sidebar-hover hover:text-text-primary'
            }`
          }
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-caption-medium text-text-secondary">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-medium text-text-primary">Profile</p>
            <p className="truncate text-overline text-text-muted normal-case tracking-normal">
              Settings & account
            </p>
          </div>
          <SettingsIcon />
        </NavLink>
      </div>
    </aside>
  )
}

function DashboardIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
    </svg>
  )
}

function ProductsIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function CategoriesIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z" />
      <path d="M6 9.01V9" />
      <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" />
    </svg>
  )
}

function CheckoutIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}

function SalesIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function InventoryIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" x2="12" y1="22.08" y2="12" />
    </svg>
  )
}

function CustomersIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ReportsIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
