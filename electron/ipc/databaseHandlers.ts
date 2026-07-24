import { ipcMain, dialog } from 'electron'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { DatabaseService } from '../../src/services/DatabaseService.ts'

export function registerDatabaseHandlers() {
  const service = new DatabaseService()

  ipcMain.handle(IPC.DB_INFO, () => service.getInfo())

  ipcMain.handle(IPC.DB_BACKUP, async () => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Backup Database',
      defaultPath: `pos-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    })

    if (canceled || !filePath) return null
    return service.backup(filePath)
  })

  ipcMain.handle(IPC.DB_RESTORE, async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Restore Database',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      properties: ['openFile'],
    })

    if (canceled || filePaths.length === 0) return false
    await service.restore(filePaths[0])
    return true
  })
}
