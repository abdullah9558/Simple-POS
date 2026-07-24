import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Button, Input, useToast } from '../../../components/ui'
import { useAuth } from '../AuthContext'
import simplePosIcon from '../../../assets/simplepos-icon.png'

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('admin@simplepos.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter email and password')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      toast(`Signed in as ${email.trim()}`, 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setError(message)
      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={simplePosIcon}
            alt="SimplePOS"
            className="h-16 w-16 rounded-2xl bg-white object-contain shadow-sm"
          />
          <div>
            <h1 className="text-heading text-text-primary">SimplePOS</h1>
            <p className="mt-1 text-caption text-text-muted">Sign in to continue</p>
          </div>
        </div>

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-4 rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-sm"
          noValidate
        >
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="admin@simplepos.com"
            disabled={loading}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            error={error || undefined}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-caption text-text-muted">
          Admin · Manager · Cashier accounts use password <span className="text-text-secondary">Test@123</span>
        </p>
      </div>
    </div>
  )
}
