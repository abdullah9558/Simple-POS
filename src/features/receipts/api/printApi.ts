import { IPC } from '../../../shared/ipcChannels'
import { ipcInvoke, isElectron } from '../../../lib/ipc'
import { buildEscPosReceipt, buildReceiptHtml } from '../../../shared/receiptTemplate'
import type { PrinterInfo, ReceiptData } from '../../../shared/receipt'

export async function listPrinters(): Promise<PrinterInfo[]> {
  if (!isElectron()) return []
  return ipcInvoke<PrinterInfo[]>(IPC.PRINT_LIST_PRINTERS)
}

export async function printReceipt(
  data: ReceiptData,
  options?: { silent?: boolean; deviceName?: string },
): Promise<boolean> {
  if (isElectron()) {
    return ipcInvoke<boolean>(IPC.PRINT_RECEIPT, data, options)
  }
  // Browser fallback: open print dialog with receipt HTML
  const html = buildReceiptHtml(data)
  const win = window.open('', '_blank', 'noopener,noreferrer,width=420,height=720')
  if (!win) throw new Error('Unable to open print window — allow popups and try again')
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
  return true
}

export async function printThermalReceipt(
  data: ReceiptData,
  options?: { deviceName?: string; mode?: 'html' | 'escpos'; silent?: boolean },
): Promise<{ printed: boolean; escpos: string; message: string }> {
  if (isElectron()) {
    return ipcInvoke(IPC.PRINT_RECEIPT_THERMAL, data, {
      deviceName: options?.deviceName,
      mode: options?.mode,
      silent: options?.silent ?? false,
    })
  }
  const printed = await printReceipt(data, { silent: false, deviceName: options?.deviceName })
  return {
    printed,
    escpos: buildEscPosReceipt(data),
    message: 'Browser thermal preview printed',
  }
}

export async function getEscPosPayload(data: ReceiptData): Promise<string> {
  if (isElectron()) {
    const result = await ipcInvoke<{ base64: string }>(IPC.PRINT_RECEIPT_ESCPOS, data)
    return result.base64
  }
  return buildEscPosReceipt(data)
}

export function getReceiptPreviewHtml(data: ReceiptData): string {
  return buildReceiptHtml(data)
}
