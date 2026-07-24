import { app, BrowserWindow, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { registerAllIpcHandlers } from './ipc/index.ts'
import { disconnectPrisma, ensureDatabaseReady } from '../src/services/prisma.ts'
import { getSyncService } from '../src/services/sync/SyncService.ts'
import { initMainLogging, logger } from './logging.ts'

const electronDir = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(electronDir, '..')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
const BUILD_RESOURCES = path.join(process.env.APP_ROOT, 'build')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

if (app.isPackaged) {
  process.env.POS_DB_PATH = path.join(app.getPath('userData'), 'pos.db')
}

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null
let isQuitting = false

function resolveIcon(): string | undefined {
  const candidates = [
    path.join(BUILD_RESOURCES, 'icon.ico'),
    path.join(BUILD_RESOURCES, 'icon.png'),
    path.join(process.resourcesPath, 'icon.ico'),
    path.join(process.resourcesPath, 'icon.png'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return undefined
}

function resolveBrandPng(): string | undefined {
  const candidates = [
    path.join(BUILD_RESOURCES, 'icon.png'),
    path.join(process.resourcesPath, 'icon.png'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return undefined
}

function closeSplash(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close()
  }
  splashWindow = null
}

function createSplashWindow(): void {
  const icon = resolveIcon()
  splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    transparent: false,
    resizable: false,
    movable: true,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: true,
    icon,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const splashHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
html,body{margin:0;height:100%;overflow:hidden;font-family:Segoe UI,system-ui,sans-serif}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(160deg,#0f172a 0%,#1e293b 55%,#0ea5e9 160%);color:#f8fafc}
.mark{width:72px;height:72px;border-radius:16px;background:#fff;display:grid;place-items:center;box-shadow:0 12px 40px rgba(14,165,233,.35);margin-bottom:18px;overflow:hidden}
.mark img{width:100%;height:100%;object-fit:contain}
h1{margin:0;font-size:22px;font-weight:700;letter-spacing:-.02em}
p{margin:8px 0 0;opacity:.72;font-size:13px}
.bar{margin-top:28px;width:160px;height:3px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.bar i{display:block;height:100%;width:40%;background:#38bdf8;animation:slide 1.1s ease-in-out infinite}
@keyframes slide{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
</style></head>
<body>
  <div class="mark"><img src="data:image/png;base64,SPLASH_ICON_B64" alt="SimplePOS" /></div>
  <h1>SimplePOS</h1>
  <p>Starting register…</p>
  <div class="bar"><i></i></div>
</body></html>`

  const iconPng = resolveBrandPng()
  let splash = splashHtml
  try {
    if (!iconPng) throw new Error('missing brand png')
    const b64 = fs.readFileSync(iconPng).toString('base64')
    splash = splashHtml.replace('SPLASH_ICON_B64', b64)
  } catch {
    splash = splashHtml
      .replace('<img src="data:image/png;base64,SPLASH_ICON_B64" alt="SimplePOS" />', '<span style="font-weight:800;font-size:18px;color:#0284c7">SP</span>')
  }

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splash)}`)
}

function createWindow(): void {
  const icon = resolveIcon()
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    icon,
    title: 'SimplePOS',
    webPreferences: {
      preload: path.join(electronDir, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    closeSplash()
    mainWindow?.show()
    mainWindow?.focus()
    logger.info('Main window ready', 'main')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error('Renderer process gone', 'main', details)
    if (isQuitting) return
    const choice = dialog.showMessageBoxSync({
      type: 'error',
      title: 'SimplePOS crashed',
      message: 'The application window stopped unexpectedly.',
      detail: details.reason ? `Reason: ${details.reason}` : undefined,
      buttons: ['Restart', 'Quit'],
      defaultId: 0,
      cancelId: 1,
    })
    if (choice === 0) {
      createSplashWindow()
      createWindow()
    } else {
      app.quit()
    }
  })

  mainWindow.webContents.on('unresponsive', () => {
    logger.warn('Main window unresponsive', 'main')
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function installProcessHandlers(): void {
  process.on('uncaughtException', (error) => {
    logger.error(error.message, 'uncaughtException', error)
    try {
      dialog.showErrorBox('Unexpected error', error.message)
    } catch {
      // ignore
    }
  })

  process.on('unhandledRejection', (reason) => {
    logger.error(
      reason instanceof Error ? reason.message : 'Unhandled rejection',
      'unhandledRejection',
      reason,
    )
  })
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    } else {
      createWindow()
    }
  })

  app.on('before-quit', () => {
    isQuitting = true
    getSyncService().stop()
  })

  app.on('window-all-closed', async () => {
    await disconnectPrisma()
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashWindow()
      createWindow()
    }
  })

  app.whenReady().then(async () => {
    initMainLogging()
    installProcessHandlers()
    createSplashWindow()

    try {
      await ensureDatabaseReady()
      logger.info('Database ready', 'main')
    } catch (err) {
      logger.error('Database bootstrap failed', 'main', err)
      closeSplash()
      dialog.showErrorBox(
        'Database error',
        err instanceof Error ? err.message : 'Failed to initialize the local database.',
      )
      app.quit()
      return
    }

    registerAllIpcHandlers()

    getSyncService().start(30_000)
    logger.info('Sync service started', 'main')

    createWindow()
  })
}
