import { useState, useCallback, useEffect } from 'react'
import { Button, Spinner, Search, ConfirmationDialog, useToast } from '../../../components/ui'
import PageHeader from '../../../components/shared/PageHeader'
import Tabs from '../../../components/shared/Tabs'
import SettingsSection from '../components/SettingsSection'
import StoreInfoForm from '../components/StoreInfoForm'
import ReceiptSettingsForm from '../components/ReceiptSettingsForm'
import RegionalSettingsForm from '../components/RegionalSettingsForm'
import ThemeSettingsForm from '../components/ThemeSettingsForm'
import AuthSettingsForm from '../components/AuthSettingsForm'
import CommunicationSettingsForm from '../components/CommunicationSettingsForm'
import UserTable from '../components/UserTable'
import AddUserDialog from '../components/AddUserDialog'
import EditUserDialog from '../components/EditUserDialog'
import RolesPermissionsPanel from '../components/RolesPermissionsPanel'
import DatabasePanel from '../components/DatabasePanel'
import { useSettings, useUpdateSettings, useUsers, useDeleteUser } from '../hooks/useSettings'
import { applyTheme } from '../api/settingsApi'
import type { SafeUser } from '../api/settingsApi'
import type {
  StoreInfoFormData,
  ReceiptFormData,
  RegionalFormData,
  ThemeFormData,
  AuthSettingsFormData,
  CommunicationFormData,
} from '../schemas/settingsSchema'

type TabId = 'profile' | 'general' | 'communication' | 'users' | 'roles' | 'auth' | 'database'

const STORE_FORM = 'store-info-form'
const RECEIPT_FORM = 'receipt-form'
const REGIONAL_FORM = 'regional-form'
const THEME_FORM = 'theme-form'
const AUTH_FORM = 'auth-form'
const COMMUNICATION_FORM = 'communication-form'

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('profile')
  const [userSearch, setUserSearch] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<SafeUser | null>(null)

  const { toast } = useToast()
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const { data: users = [], isLoading: usersLoading } = useUsers({ search: userSearch || undefined })
  const deleteUser = useDeleteUser()

  useEffect(() => {
    if (settings?.theme) applyTheme(settings.theme)
  }, [settings?.theme])

  const save = useCallback(async (partial: Record<string, string | number | boolean>) => {
    const payload: Record<string, string> = {}
    for (const [k, v] of Object.entries(partial)) {
      payload[k] = typeof v === 'boolean' ? String(v) : String(v)
    }
    try {
      await updateSettings.mutateAsync(payload)
      toast('Settings saved', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save settings', 'error')
    }
  }, [updateSettings, toast])

  const handleDeleteUser = useCallback(async () => {
    if (!deletingUser) return
    try {
      await deleteUser.mutateAsync(deletingUser.id)
      toast(`"${deletingUser.name}" deleted`, 'success')
      setDeletingUser(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error')
    }
  }, [deletingUser, deleteUser, toast])

  const tabs = [
    { id: 'profile' as const, label: 'Profile' },
    { id: 'general' as const, label: 'General' },
    { id: 'communication' as const, label: 'Communication' },
    { id: 'users' as const, label: 'Users' },
    { id: 'roles' as const, label: 'Roles & Permissions' },
    { id: 'auth' as const, label: 'Authentication' },
    { id: 'database' as const, label: 'Database' },
  ]

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & Settings"
        description="Your account, store configuration, users, and system preferences"
      />

      <Tabs tabs={tabs} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'profile' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface-raised p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-white">
                {(settings.storeName || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-h3 text-text-primary">Admin</p>
                <p className="text-body text-text-secondary">
                  {settings.storeEmail || 'admin@store.com'}
                </p>
                <p className="text-caption text-text-muted">
                  Store: {settings.storeName || 'Not set'} · Role: Administrator
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
                <p className="text-caption text-text-muted">Phone</p>
                <p className="mt-0.5 text-body text-text-primary">
                  {settings.storePhone || '—'}
                </p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
                <p className="text-caption text-text-muted">Address</p>
                <p className="mt-0.5 text-body text-text-primary">
                  {settings.storeAddress || '—'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setTab('general')}>
                Edit store details
              </Button>
              <Button variant="secondary" onClick={() => setTab('users')}>
                Manage users
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'general' && (
        <div className="space-y-6">
          <SettingsSection title="Store Information" description="Business details and logo" formId={STORE_FORM} loading={updateSettings.isPending}>
            <StoreInfoForm
              id={STORE_FORM}
              initialValues={{
                storeName: settings.storeName,
                storeAddress: settings.storeAddress,
                storePhone: settings.storePhone,
                storeEmail: settings.storeEmail,
                storeLogo: settings.storeLogo,
              }}
              onSubmit={(data: StoreInfoFormData) => save(data)}
            />
          </SettingsSection>

          <SettingsSection title="Receipt" description="Thermal printing, ESC/POS, and footer" formId={RECEIPT_FORM} loading={updateSettings.isPending}>
            <ReceiptSettingsForm
              id={RECEIPT_FORM}
              initialValues={{
                receiptFooter: settings.receiptFooter,
                receiptPaperWidth: (settings.receiptPaperWidth === '58' ? '58' : '80') as '58' | '80',
                receiptAutoPrint: settings.receiptAutoPrint === 'true',
                receiptPrinterName: settings.receiptPrinterName,
                receiptPrintMode: (settings.receiptPrintMode === 'escpos' ? 'escpos' : 'html') as 'html' | 'escpos',
              }}
              onSubmit={(data: ReceiptFormData) => save(data)}
            />
          </SettingsSection>

          <SettingsSection title="Currency & Tax" description="Regional and tax settings" formId={REGIONAL_FORM} loading={updateSettings.isPending}>
            <RegionalSettingsForm
              id={REGIONAL_FORM}
              initialValues={{
                currency: settings.currency as RegionalFormData['currency'],
                taxRate: parseFloat(settings.taxRate) || 0,
                taxEnabled: settings.taxEnabled === 'true',
                lowStockThreshold: parseInt(settings.lowStockThreshold, 10) || 5,
              }}
              onSubmit={(data: RegionalFormData) => save(data)}
            />
          </SettingsSection>

          <SettingsSection title="Theme" description="Application appearance" formId={THEME_FORM} loading={updateSettings.isPending}>
            <ThemeSettingsForm
              id={THEME_FORM}
              initialValues={{ theme: settings.theme as ThemeFormData['theme'] }}
              onSubmit={(data: ThemeFormData) => save(data)}
            />
          </SettingsSection>
        </div>
      )}

      {tab === 'communication' && (
        <SettingsSection
          title="Communication"
          description="SMTP email (nodemailer) for digital invoices"
          formId={COMMUNICATION_FORM}
          loading={updateSettings.isPending}
        >
          <CommunicationSettingsForm
            id={COMMUNICATION_FORM}
            initialValues={{
              smtpHost: settings.smtpHost,
              smtpPort: parseInt(settings.smtpPort, 10) || 587,
              smtpSecure: settings.smtpSecure === 'true',
              smtpUser: settings.smtpUser,
              smtpPassword: settings.smtpPassword,
              smtpFrom: settings.smtpFrom,
              greenApiIdInstance: settings.greenApiIdInstance,
              greenApiTokenInstance: settings.greenApiTokenInstance,
              greenApiUrl: settings.greenApiUrl || 'https://api.green-api.com',
              greenApiMediaUrl: settings.greenApiMediaUrl || 'https://media.green-api.com',
            }}
            onSubmit={(data: CommunicationFormData) =>
              save({
                smtpHost: data.smtpHost ?? '',
                smtpPort: data.smtpPort,
                smtpSecure: data.smtpSecure,
                smtpUser: data.smtpUser ?? '',
                smtpPassword: data.smtpPassword ?? '',
                smtpFrom: data.smtpFrom ?? '',
                greenApiIdInstance: data.greenApiIdInstance ?? '',
                greenApiTokenInstance: data.greenApiTokenInstance ?? '',
                greenApiUrl: data.greenApiUrl || 'https://api.green-api.com',
                greenApiMediaUrl: data.greenApiMediaUrl || 'https://media.green-api.com',
              })
            }
          />
        </SettingsSection>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Search
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button onClick={() => setShowAddUser(true)}>Add User</Button>
          </div>
          {usersLoading ? <div className="flex justify-center py-12"><Spinner /></div> : (
            <UserTable users={users} onEdit={setEditingUser} onDelete={setDeletingUser} />
          )}
        </div>
      )}

      {tab === 'roles' && <RolesPermissionsPanel />}

      {tab === 'auth' && (
        <SettingsSection title="Authentication Settings" description="Security and session configuration" formId={AUTH_FORM} loading={updateSettings.isPending}>
          <AuthSettingsForm
            id={AUTH_FORM}
            initialValues={{
              authSessionTimeout: parseInt(settings.authSessionTimeout, 10) || 480,
              authMinPasswordLength: parseInt(settings.authMinPasswordLength, 10) || 6,
            }}
            onSubmit={(data: AuthSettingsFormData) => save(data)}
          />
        </SettingsSection>
      )}

      {tab === 'database' && <DatabasePanel />}

      <AddUserDialog open={showAddUser} onClose={() => setShowAddUser(false)} />
      {editingUser && <EditUserDialog open user={editingUser} onClose={() => setEditingUser(null)} />}

      <ConfirmationDialog
        open={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description={`Delete "${deletingUser?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteUser.isPending}
      />
    </div>
  )
}
