import type { IpcChannel } from '../shared/ipcChannels'

export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof window.electronAPI?.invoke === 'function'
}

export async function ipcInvoke<T>(channel: IpcChannel, ...args: unknown[]): Promise<T> {
  if (!isElectron()) {
    throw new Error('This feature requires the Electron app')
  }
  return window.electronAPI.invoke(channel, ...args) as Promise<T>
}
