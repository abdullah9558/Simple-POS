import { useState } from 'react'
import { Button, Input, useToast } from '../../../components/ui'
import { useForm } from '../../../hooks/useForm'
import { communicationSchema, type CommunicationFormData } from '../schemas/settingsSchema'
import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'
import { isSmtpConfigured } from '../../../shared/settings'
// import { isSmtpConfigured, isGreenApiConfigured } from '../../../shared/settings'

interface Props {
  initialValues: CommunicationFormData
  onSubmit: (data: CommunicationFormData) => void | Promise<void>
  id?: string
}

export default function CommunicationSettingsForm({ initialValues, onSubmit, id = 'communication-form' }: Props) {
  const form = useForm({ schema: communicationSchema, initialValues, onSubmit })
  const { toast } = useToast()
  const [testEmailTo, setTestEmailTo] = useState(initialValues.smtpFrom || '')
  // WhatsApp temporarily disabled
  // const [testWhatsAppTo, setTestWhatsAppTo] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)
  // const [testingWhatsApp, setTestingWhatsApp] = useState(false)

  const emailReady = isSmtpConfigured({
    smtpHost: form.values.smtpHost ?? '',
    smtpUser: form.values.smtpUser ?? '',
    smtpPassword: form.values.smtpPassword ?? '',
    smtpFrom: form.values.smtpFrom ?? '',
  })
  // WhatsApp temporarily disabled
  // const waReady = isGreenApiConfigured({
  //   greenApiIdInstance: form.values.greenApiIdInstance ?? '',
  //   greenApiTokenInstance: form.values.greenApiTokenInstance ?? '',
  // })
  // void isGreenApiConfigured // keep import used until WhatsApp UI is restored

  const runTestEmail = async () => {
    if (!isElectron()) {
      toast('Tests only work inside the desktop app', 'error')
      return
    }
    if (!testEmailTo.trim()) {
      toast('Enter a recipient email for the test', 'error')
      return
    }
    setTestingEmail(true)
    try {
      const result = await ipcInvoke<{ success: boolean; message: string }>(
        IPC.COMMUNICATION_TEST_EMAIL,
        { to: testEmailTo.trim() },
      )
      toast(result.message, result.success ? 'success' : 'error')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Email test failed', 'error')
    } finally {
      setTestingEmail(false)
    }
  }

  // WhatsApp temporarily disabled
  // const runTestWhatsApp = async () => {
  //   if (!isElectron()) {
  //     toast('Tests only work inside the desktop app', 'error')
  //     return
  //   }
  //   if (!testWhatsAppTo.trim()) {
  //     toast('Enter a WhatsApp number with country code', 'error')
  //     return
  //   }
  //   setTestingWhatsApp(true)
  //   try {
  //     const result = await ipcInvoke<{ success: boolean; message: string }>(
  //       IPC.COMMUNICATION_TEST_WHATSAPP,
  //       { to: testWhatsAppTo.trim() },
  //     )
  //     toast(result.message, result.success ? 'success' : 'error')
  //   } catch (err) {
  //     toast(err instanceof Error ? err.message : 'WhatsApp test failed', 'error')
  //   } finally {
  //     setTestingWhatsApp(false)
  //   }
  // }

  return (
    <form id={id} onSubmit={form.handleSubmit} noValidate className="space-y-8">
      <div className="rounded-lg border border-border-subtle bg-surface-inset p-4 space-y-2">
        <h4 className="text-body-medium text-text-primary">Digital invoice delivery</h4>
        <p className="text-caption text-text-muted">
          Email via SMTP (nodemailer). Save, then use Test Email.
          {/* WhatsApp via Green API temporarily disabled */}
        </p>
        <div className="flex flex-wrap gap-3 pt-1 text-caption">
          <span className={emailReady ? 'text-success' : 'text-warning'}>
            SMTP: {emailReady ? 'ready (after Save)' : 'incomplete'}
          </span>
          {/* <span className={waReady ? 'text-success' : 'text-warning'}>
            Green API: {waReady ? 'ready (after Save)' : 'incomplete'}
          </span> */}
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-body-medium text-text-primary">Email (SMTP / nodemailer)</h3>
        <p className="text-caption text-text-muted">
          Gmail: host <code className="text-text-secondary">smtp.gmail.com</code>, port{' '}
          <code className="text-text-secondary">587</code>, TLS unchecked, use an{' '}
          <strong className="font-medium text-text-secondary">App Password</strong>.
          Brevo: <code className="text-text-secondary">smtp-relay.brevo.com</code> with your SMTP login;
          From must be a verified sender in Brevo.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="SMTP Host" placeholder="smtp.gmail.com" {...form.getFieldProps('smtpHost')} />
          <Input label="SMTP Port" type="number" min={1} max={65535} {...form.getFieldProps('smtpPort', 'number')} />
        </div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-[var(--color-accent)]"
            checked={form.values.smtpSecure}
            onChange={(e) => form.setValue('smtpSecure', e.target.checked)}
          />
          <span className="text-body text-text-secondary">Use TLS/SSL (only for port 465)</span>
        </label>
        <Input label="SMTP Username" placeholder="you@gmail.com" {...form.getFieldProps('smtpUser')} autoComplete="off" />
        <Input
          label="SMTP Password / App Password"
          type="password"
          placeholder="••••••••"
          {...form.getFieldProps('smtpPassword')}
          autoComplete="new-password"
        />
        <Input label="From Address" type="email" placeholder="you@gmail.com" {...form.getFieldProps('smtpFrom')} />

        <div className="flex flex-col gap-2 rounded-lg border border-border-subtle p-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Test recipient email"
              type="email"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="button" variant="secondary" loading={testingEmail} onClick={() => void runTestEmail()}>
            Test Email
          </Button>
        </div>
      </section>

      {/* WhatsApp receipt option temporarily disabled
      <section className="space-y-4">
        <h3 className="text-body-medium text-text-primary">WhatsApp (Green API — free)</h3>
        <p className="text-caption text-text-muted">
          Sign up at green-api.com, create an instance, scan the QR with WhatsApp, then copy
          idInstance and apiTokenInstance.
        </p>
        <Input
          label="Instance ID (idInstance)"
          placeholder="1101xxxxxx"
          {...form.getFieldProps('greenApiIdInstance')}
          autoComplete="off"
        />
        <Input
          label="API Token (apiTokenInstance)"
          type="password"
          placeholder="••••••••"
          {...form.getFieldProps('greenApiTokenInstance')}
          autoComplete="new-password"
        />
        <Input
          label="API URL (optional)"
          placeholder="https://api.green-api.com"
          {...form.getFieldProps('greenApiUrl')}
        />
        <Input
          label="Media URL (optional)"
          placeholder="https://media.green-api.com"
          {...form.getFieldProps('greenApiMediaUrl')}
        />

        <div className="flex flex-col gap-2 rounded-lg border border-border-subtle p-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Test WhatsApp number"
              value={testWhatsAppTo}
              onChange={(e) => setTestWhatsAppTo(e.target.value)}
              placeholder="923001234567"
            />
          </div>
          <Button type="button" variant="secondary" loading={testingWhatsApp} onClick={() => void runTestWhatsApp()}>
            Test WhatsApp
          </Button>
        </div>
      </section>
      */}
    </form>
  )
}
