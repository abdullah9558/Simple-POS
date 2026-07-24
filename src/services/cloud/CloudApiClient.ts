import { SettingsService } from '../SettingsService.ts'

export interface CloudAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface SyncPushItem {
  clientMutationId: string
  entityType: string
  entityId: string
  operation: string
  payload: unknown
}

export interface SyncPushResult {
  accepted: string[]
  conflicts: Array<{ clientMutationId: string; reason: string; serverPayload?: unknown }>
  rejected: Array<{ clientMutationId: string; reason: string }>
}

/**
 * HTTPS REST client for the cloud API. Electron never talks to PostgreSQL.
 */
export class CloudApiClient {
  constructor(private settings = new SettingsService()) {}

  async getBaseUrl(): Promise<string | null> {
    const fromEnv = process.env.CLOUD_API_BASE_URL?.trim()
    if (fromEnv) return fromEnv.replace(/\/$/, '')
    const all = await this.settings.getAll()
    const url = all.cloudApiBaseUrl?.trim()
    return url ? url.replace(/\/$/, '') : null
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(await this.getBaseUrl())
  }

  async login(email: string, password: string): Promise<CloudAuthTokens> {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })
  }

  async refresh(refreshToken: string): Promise<CloudAuthTokens> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      auth: false,
    })
  }

  async pushSync(items: SyncPushItem[], accessToken: string): Promise<SyncPushResult> {
    return this.request('/sync/push', {
      method: 'POST',
      body: { items },
      accessToken,
    })
  }

  async pullSync(since: string | null, storeId: string, accessToken: string) {
    const qs = new URLSearchParams()
    if (since) qs.set('since', since)
    qs.set('storeId', storeId)
    return this.request(`/sync/pull?${qs.toString()}`, {
      method: 'GET',
      accessToken,
    })
  }

  private async request<T>(
    path: string,
    options: {
      method: string
      body?: unknown
      accessToken?: string
      auth?: boolean
    },
  ): Promise<T> {
    const base = await this.getBaseUrl()
    if (!base) {
      throw new Error('Cloud API is not configured')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (options.accessToken) {
      headers.Authorization = `Bearer ${options.accessToken}`
    }

    const res = await fetch(`${base}${path}`, {
      method: options.method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Cloud API ${options.method} ${path} failed (${res.status}): ${text.slice(0, 300)}`)
    }

    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }
}
