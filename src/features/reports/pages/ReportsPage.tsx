import { useState } from 'react'
import { Card, CardContent, Spinner } from '../../../components/ui'
import PageHeader from '../../../components/shared/PageHeader'
import Tabs from '../../../components/shared/Tabs'
import BarChart from '../../../components/shared/charts/BarChart'
import LineChart from '../../../components/shared/charts/LineChart'
import ReportTable from '../../../components/shared/ReportTable'
import ExportButtons from '../../../components/shared/ExportButtons'
import StockBadge from '../../../components/shared/StockBadge'
import { useCurrency } from '../../../hooks/useCurrency'
import {
  useDailySales,
  useWeeklySales,
  useMonthlySales,
  useProfitReport,
  useInventoryReport,
  useFastMovingProducts,
  useSlowMovingProducts,
} from '../hooks/useReports'

type TabId = 'sales' | 'profit' | 'inventory' | 'products'

export default function ReportsPage() {
  const [tab, setTab] = useState<TabId>('sales')
  const [salesPeriod, setSalesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const { formatCurrency } = useCurrency()

  const { data: daily, isLoading: dailyLoading } = useDailySales()
  const { data: weekly, isLoading: weeklyLoading } = useWeeklySales()
  const { data: monthly, isLoading: monthlyLoading } = useMonthlySales()
  const { data: profit, isLoading: profitLoading } = useProfitReport()
  const { data: inventory, isLoading: inventoryLoading } = useInventoryReport()
  const { data: fast, isLoading: fastLoading } = useFastMovingProducts()
  const { data: slow, isLoading: slowLoading } = useSlowMovingProducts()

  const salesData = salesPeriod === 'daily' ? daily : salesPeriod === 'weekly' ? weekly : monthly
  const salesLoading = salesPeriod === 'daily' ? dailyLoading : salesPeriod === 'weekly' ? weeklyLoading : monthlyLoading

  const salesChartData = (salesData ?? []).map((d) => ({ label: d.label, value: d.revenue }))
  const salesExportRows = (salesData ?? []).map((d) => ({
    label: d.label,
    orders: d.orders,
    revenue: d.revenue.toFixed(2),
    profit: d.profit.toFixed(2),
  }))

  const inventoryExportRows = (inventory ?? []).map((i) => ({
    name: i.name,
    sku: i.sku,
    stock: i.stock,
    minStock: i.minStock,
    cost: i.cost.toFixed(2),
    value: i.value.toFixed(2),
    status: i.status,
  }))

  const tabs = [
    { id: 'sales' as const, label: 'Sales' },
    { id: 'profit' as const, label: 'Profit' },
    { id: 'inventory' as const, label: 'Inventory' },
    { id: 'products' as const, label: 'Product Velocity' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Sales analytics, profit, inventory, and product performance" />

      <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'sales' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setSalesPeriod(p)}
                  className={`rounded-md px-3 py-1.5 text-caption-medium capitalize transition-fast ${
                    salesPeriod === p ? 'bg-accent text-white' : 'bg-surface-raised text-text-muted hover:text-text-primary'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            <ExportButtons
              title={`${salesPeriod.charAt(0).toUpperCase() + salesPeriod.slice(1)} Sales Report`}
              filename={`${salesPeriod}-sales-report`}
              columns={[
                { key: 'label', label: 'Period' },
                { key: 'orders', label: 'Orders' },
                { key: 'revenue', label: 'Revenue' },
                { key: 'profit', label: 'Profit' },
              ]}
              rows={salesExportRows}
            />
          </div>

          {salesLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-body-medium text-text-primary">Revenue Trend</h3>
                  <LineChart data={salesChartData} height={220} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-body-medium text-text-primary">Orders & Revenue</h3>
                  <BarChart data={salesChartData} height={200} formatValue={(v) => formatCurrency(v)} />
                </CardContent>
              </Card>
              <ReportTable
                columns={[
                  { key: 'label', label: 'Period' },
                  { key: 'orders', label: 'Orders', align: 'right' },
                  { key: 'revenue', label: 'Revenue', align: 'right', format: (r) => formatCurrency(r.revenue as number) },
                  { key: 'profit', label: 'Profit', align: 'right', format: (r) => formatCurrency(r.profit as number) },
                ]}
                rows={salesData ?? []}
              />
            </>
          )}
        </div>
      )}

      {tab === 'profit' && (
        <div className="space-y-6">
          {profitLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : profit && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card><CardContent className="p-5"><p className="text-caption text-text-muted">Revenue</p><p className="mt-1 text-h3 tabular-nums">{formatCurrency(profit.revenue)}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-caption text-text-muted">Cost</p><p className="mt-1 text-h3 tabular-nums">{formatCurrency(profit.cost)}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-caption text-text-muted">Profit</p><p className="mt-1 text-h3 tabular-nums text-success">{formatCurrency(profit.profit)}</p></CardContent></Card>
                <Card><CardContent className="p-5"><p className="text-caption text-text-muted">Margin</p><p className="mt-1 text-h3 tabular-nums">{profit.margin.toFixed(1)}%</p></CardContent></Card>
              </div>
              <div className="flex justify-end">
                <ExportButtons
                  title="Profit Report"
                  filename="profit-report"
                  columns={[
                    { key: 'revenue', label: 'Revenue' },
                    { key: 'cost', label: 'Cost' },
                    { key: 'profit', label: 'Profit' },
                    { key: 'orders', label: 'Orders' },
                    { key: 'margin', label: 'Margin %' },
                  ]}
                  rows={[{ revenue: profit.revenue.toFixed(2), cost: profit.cost.toFixed(2), profit: profit.profit.toFixed(2), orders: profit.orders, margin: profit.margin.toFixed(1) }]}
                />
              </div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-body-medium text-text-primary">Profit Breakdown</h3>
                  <BarChart
                    data={[
                      { label: 'Revenue', value: profit.revenue },
                      { label: 'Cost', value: profit.cost },
                      { label: 'Profit', value: profit.profit },
                    ]}
                    color="var(--color-success)"
                    formatValue={(v) => formatCurrency(v)}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <ExportButtons
              title="Inventory Report"
              filename="inventory-report"
              columns={[
                { key: 'name', label: 'Product' },
                { key: 'sku', label: 'SKU' },
                { key: 'stock', label: 'Stock' },
                { key: 'minStock', label: 'Min Stock' },
                { key: 'cost', label: 'Cost' },
                { key: 'value', label: 'Value' },
                { key: 'status', label: 'Status' },
              ]}
              rows={inventoryExportRows}
            />
          </div>
          {inventoryLoading ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : (
            <ReportTable
              columns={[
                { key: 'name', label: 'Product' },
                { key: 'sku', label: 'SKU' },
                { key: 'stock', label: 'Stock', align: 'right' },
                { key: 'minStock', label: 'Min', align: 'right' },
                { key: 'cost', label: 'Cost', align: 'right', format: (r) => formatCurrency(r.cost as number) },
                { key: 'value', label: 'Value', align: 'right', format: (r) => formatCurrency(r.value as number) },
                { key: 'status', label: 'Status', format: (r) => {
                  const s = r as { stock: number; minStock: number }
                  return <StockBadge stock={s.stock} minStock={s.minStock} />
                }},
              ]}
              rows={inventory ?? []}
            />
          )}
        </div>
      )}

      {tab === 'products' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-body-medium text-text-primary">Fast Moving Products</h3>
              <ExportButtons
                title="Fast Moving Products"
                filename="fast-moving-products"
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'sku', label: 'SKU' },
                  { key: 'quantitySold', label: 'Qty Sold' },
                  { key: 'revenue', label: 'Revenue' },
                ]}
                rows={(fast ?? []).map((p) => ({ ...p, revenue: p.revenue.toFixed(2) }))}
              />
            </div>
            {fastLoading ? <Spinner /> : (
              <>
                <BarChart
                  data={(fast ?? []).map((p) => ({ label: p.name.slice(0, 10), value: p.quantitySold }))}
                  height={180}
                />
                <ReportTable
                  columns={[
                    { key: 'name', label: 'Product' },
                    { key: 'sku', label: 'SKU' },
                    { key: 'quantitySold', label: 'Qty Sold', align: 'right' },
                    { key: 'revenue', label: 'Revenue', align: 'right', format: (r) => formatCurrency(r.revenue as number) },
                  ]}
                  rows={fast ?? []}
                  emptyMessage="No sales data yet"
                />
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-body-medium text-text-primary">Slow Moving Products</h3>
              <ExportButtons
                title="Slow Moving Products"
                filename="slow-moving-products"
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'sku', label: 'SKU' },
                  { key: 'quantitySold', label: 'Qty Sold' },
                  { key: 'revenue', label: 'Revenue' },
                ]}
                rows={(slow ?? []).map((p) => ({ ...p, revenue: p.revenue.toFixed(2) }))}
              />
            </div>
            {slowLoading ? <Spinner /> : (
              <ReportTable
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'sku', label: 'SKU' },
                  { key: 'quantitySold', label: 'Qty Sold', align: 'right' },
                  { key: 'revenue', label: 'Revenue', align: 'right', format: (r) => formatCurrency(r.revenue as number) },
                ]}
                rows={slow ?? []}
                emptyMessage="No slow movers identified"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
