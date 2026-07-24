import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { Spinner } from '../components/ui'
import ErrorBoundary from '../components/ErrorBoundary'

function PageFallback() {
  return (
    <div className="flex justify-center py-20">
      <Spinner size="lg" />
    </div>
  )
}

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

function lazyRoute(factory: () => Promise<{ default: ComponentType }>) {
  const Page = lazy(factory)
  return (
    <LazyPage>
      <Page />
    </LazyPage>
  )
}

export const dashboardRoute = lazyRoute(() => import('../features/dashboard/pages/DashboardPage'))
export const productsRoute = lazyRoute(() => import('../features/products/pages/ProductsPage'))
export const categoriesRoute = lazyRoute(() => import('../features/categories/pages/CategoriesPage'))
export const checkoutRoute = lazyRoute(() => import('../features/checkout/pages/CheckoutPage'))
export const salesRoute = lazyRoute(() => import('../features/sales/pages/SalesPage'))
export const inventoryRoute = lazyRoute(() => import('../features/inventory/pages/InventoryPage'))
export const customersRoute = lazyRoute(() => import('../features/customers/pages/CustomersPage'))
export const reportsRoute = lazyRoute(() => import('../features/reports/pages/ReportsPage'))
export const settingsRoute = lazyRoute(() => import('../features/settings/pages/SettingsPage'))
