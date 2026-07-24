import { BrowserWindow, ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '../../src/shared/ipcChannels.ts'
import { buildEscPosReceipt, buildReceiptHtml } from '../../src/shared/receiptTemplate.ts'
import type { PrinterInfo } from '../../src/shared/receipt.ts'
import { parseIpcArg } from '../../src/shared/ipcValidation.ts'
import { receiptDataSchema } from '../../src/shared/ipcSchemas.ts'

async function listPrintersAsync(): Promise<PrinterInfo[]> {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  if (!win) return []
  try {
    const printers = await win.webContents.getPrintersAsync()
    return printers.map((p) => ({
      name: p.name,
      displayName: p.displayName || p.name,
      description: p.description || '',
      isDefault: Boolean((p as { isDefault?: boolean }).isDefault),
    }))
  } catch {
    return []
  }
}

const printOptionsSchema = z.object({
  silent: z.boolean().optional(),
  deviceName: z.string().max(200).optional(),
  copies: z.number().int().min(1).max(10).optional(),
  mode: z.enum(['html', 'escpos']).optional(),
}).optional()

function noPrinterMessage(): string {
  if (process.platform === 'darwin') {
    return 'No printer is available. Add a printer in System Settings → Printers & Scanners, or use Save as PDF.'
  }
  if (process.platform === 'win32') {
    return 'No printer is installed. Add a printer or enable Microsoft Print to PDF in Windows Settings.'
  }
  return 'No printer is available. Add a system printer and try again.'
}

function invalidPrinterSettingsMessage(): string {
  if (process.platform === 'darwin') {
    return 'macOS rejected the printer settings. Check that a default printer is online in System Settings.'
  }
  if (process.platform === 'win32') {
    return 'Windows rejected the printer settings. Check that a default printer is installed and online.'
  }
  return 'The printer rejected the print settings. Check that a default printer is installed and online.'
}

function printHtml(html: string, options: { silent?: boolean; deviceName?: string; copies?: number } = {}): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const silent = options.silent === true
    const printWindow = new BrowserWindow({
      // Windows (and some macOS setups) cannot reliably show the native print
      // dialog from a hidden webContents; showing the window avoids that failure.
      show: !silent,
      width: 520,
      height: 760,
      title: 'Print Receipt',
      autoHideMenuBar: true,
      backgroundColor: '#ffffff',
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    const cleanup = () => {
      if (!printWindow.isDestroyed()) printWindow.destroy()
    }

    printWindow.webContents.on('did-finish-load', async () => {
      if (!silent) {
        printWindow.show()
        printWindow.focus()
      }

      const printers = await printWindow.webContents.getPrintersAsync().catch(() => [])
      if (printers.length === 0) {
        cleanup()
        reject(new Error(noPrinterMessage()))
        return
      }

      if (silent && options.deviceName && !printers.some((printer) => printer.name === options.deviceName)) {
        cleanup()
        reject(new Error(`Configured printer "${options.deviceName}" is not available.`))
        return
      }

      // Let the native window become active before Chromium opens the print dialog.
      await new Promise((done) => setTimeout(done, silent ? 50 : 350))

      const printOptions: Electron.WebContentsPrintOptions = {
        silent,
        printBackground: true,
      }
      if (silent && options.deviceName) printOptions.deviceName = options.deviceName
      if (options.copies && options.copies > 1) printOptions.copies = options.copies

      printWindow.webContents.print(
        printOptions,
        (success, failureReason) => {
          cleanup()
          if (!success && failureReason) {
            const detail =
              failureReason === 'Invalid printer settings'
                ? invalidPrinterSettingsMessage()
                : failureReason
            reject(new Error(detail))
            return
          }
          resolve(success)
        },
      )
    })

    printWindow.webContents.on('did-fail-load', (_e, _code, desc) => {
      cleanup()
      reject(new Error(desc || 'Failed to load receipt for printing'))
    })

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  })
}

export function registerPrintHandlers() {
  ipcMain.handle(IPC.PRINT_LIST_PRINTERS, async () => listPrintersAsync())

  ipcMain.handle(IPC.PRINT_RECEIPT, async (_e, raw, options) => {
    const data = parseIpcArg(receiptDataSchema, raw, 'receipt')
    const opts = parseIpcArg(printOptionsSchema, options, 'options')
    return printHtml(buildReceiptHtml(sanitizeReceiptForPrint(data)), {
      silent: opts?.silent ?? false,
      deviceName: opts?.deviceName || undefined,
      copies: opts?.copies,
    })
  })

  ipcMain.handle(IPC.PRINT_RECEIPT_PREVIEW_HTML, async (_e, raw) => {
    const data = parseIpcArg(receiptDataSchema, raw, 'receipt')
    return buildReceiptHtml(sanitizeReceiptForPrint(data))
  })

  ipcMain.handle(IPC.PRINT_RECEIPT_ESCPOS, async (_e, raw) => {
    const data = parseIpcArg(receiptDataSchema, raw, 'receipt')
    return {
      base64: buildEscPosReceipt(data),
      paperWidth: data.paperWidth,
      encoding: 'escpos-raw',
    }
  })

  ipcMain.handle(IPC.PRINT_RECEIPT_THERMAL, async (_e, raw, options) => {
    const data = parseIpcArg(receiptDataSchema, raw, 'receipt')
    const opts = parseIpcArg(printOptionsSchema, options, 'options')
    const mode = opts?.mode ?? 'html'
    if (mode === 'escpos') {
      return {
        printed: false,
        escpos: buildEscPosReceipt(data),
        message:
          'ESC/POS payload generated. Connect a raw USB thermal printer driver or use HTML thermal print mode.',
      }
    }
    const printed = await printHtml(buildReceiptHtml(sanitizeReceiptForPrint(data)), {
      silent: opts?.silent ?? false,
      deviceName: opts?.deviceName || undefined,
    })
    return { printed, escpos: buildEscPosReceipt(data), message: 'Thermal receipt sent to printer' }
  })
}

function sanitizeReceiptForPrint(data: import('../../src/shared/receipt.ts').ReceiptData) {
  const logo = data.store.logo || ''
  // Huge base64 logos blow up data: URLs and break Electron print windows.
  if (logo.length > 120_000) {
    return {
      ...data,
      store: { ...data.store, logo: '' },
    }
  }
  return data
}
