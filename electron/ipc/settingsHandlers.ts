import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { SettingsService } from '../../src/services/SettingsService.ts'
import { SETTINGS_KEYS, type SettingsKey } from '../../src/shared/settings.ts'
import { parseIpcArg } from '../../src/shared/ipcValidation.ts'

const settingsKeySchema = z.enum(SETTINGS_KEYS as [SettingsKey, ...SettingsKey[]])
const settingsPatchSchema = z.record(z.string(), z.string())

export function registerSettingsHandlers() {
  const service = new SettingsService()

  ipcMain.handle(IPC.SETTINGS_GET, (_e, key) =>
    service.get(parseIpcArg(settingsKeySchema, key, 'key')),
  )
  ipcMain.handle(IPC.SETTINGS_SET, (_e, key, value) =>
    service.set(
      parseIpcArg(settingsKeySchema, key, 'key'),
      parseIpcArg(z.string(), value, 'value'),
    ),
  )
  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => service.getAll())
  ipcMain.handle(IPC.SETTINGS_UPDATE_ALL, (_e, settings) =>
    service.updateAll(parseIpcArg(settingsPatchSchema, settings, 'settings')),
  )
}
