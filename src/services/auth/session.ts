/**
 * Local + cloud auth session helpers (JWT-ready).
 * Desktop POS continues offline without cloud tokens.
 */

export interface JwtPayload {
  sub: string
  email: string
  role: string
  businessId?: string
  storeIds?: string[]
  exp: number
  iat: number
}

export interface AuthSession {
  userId: string
  email: string
  name: string
  role: string
  businessId: string | null
  storeIds: string[]
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

let currentSession: AuthSession | null = null

export function getAuthSession(): AuthSession | null {
  return currentSession
}

export function setAuthSession(session: AuthSession | null) {
  currentSession = session
}

/** Minimal base64url JWT payload decode (no signature verify — cloud verifies). */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}
