import { contextBridge, ipcRenderer } from 'electron'
import { ALL_CHANNELS, type IpcChannel } from '../src/shared/ipcChannels.ts'

function assertChannel(channel: string): asserts channel is IpcChannel {
  if (!ALL_CHANNELS.includes(channel)) {
    throw new Error(`IPC channel "${channel}" is not allowed`)
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
  },
  invoke: (channel: string, ...args: unknown[]) => {
    assertChannel(channel)
    return ipcRenderer.invoke(channel, ...args)
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    assertChannel(channel)
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },
})
