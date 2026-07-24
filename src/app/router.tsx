import { createHashRouter } from 'react-router'
import App from './App'
import {
  categoriesRoute,
  checkoutRoute,
  customersRoute,
  dashboardRoute,
  inventoryRoute,
  productsRoute,
  reportsRoute,
  salesRoute,
  settingsRoute,
} from './lazyRoutes'

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: dashboardRoute },
      { path: 'products', element: productsRoute },
      { path: 'categories', element: categoriesRoute },
      { path: 'checkout', element: checkoutRoute },
      { path: 'sales', element: salesRoute },
      { path: 'inventory', element: inventoryRoute },
      { path: 'customers', element: customersRoute },
      { path: 'reports', element: reportsRoute },
      { path: 'settings', element: settingsRoute },
    ],
  },
])
