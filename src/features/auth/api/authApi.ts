import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'

export interface AuthUser {
  userId: string
  email: string
  name: string
  role: string
  businessId: string | null
  storeIds: string[]
}

export async function login(email: string, password: string): Promise<AuthUser> {
  if (!isElectron()) {
    throw new Error('Sign in requires the SimplePOS desktop app')
  }
  return ipcInvoke<AuthUser>(IPC.AUTH_LOGIN, { email, password })
}

export async function logout(): Promise<void> {
  if (!isElectron()) return
  await ipcInvoke(IPC.AUTH_LOGOUT)
}

export async function fetchSession(): Promise<AuthUser | null> {
  if (!isElectron()) return null
  return ipcInvoke<AuthUser | null>(IPC.AUTH_ME)
}
