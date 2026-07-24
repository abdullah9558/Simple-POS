export interface ExportColumn {
  key: string
  label: string
}

export function exportToCsv(columns: ExportColumn[], rows: Record<string, unknown>[], filename: string) {
  const header = columns.map((c) => c.label).join(',')
  const body = rows.map((row) =>
    columns.map((c) => {
      const val = row[c.key]
      const str = val === null || val === undefined ? '' : String(val)
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
    }).join(','),
  ).join('\n')

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportToPdf(title: string, columns: ExportColumn[], rows: Record<string, unknown>[], filename: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  doc.setFontSize(14)
  doc.text(title, 14, 20)
  doc.setFontSize(9)

  let y = 32
  const colWidth = (doc.internal.pageSize.getWidth() - 28) / columns.length

  doc.setFont('helvetica', 'bold')
  columns.forEach((col, i) => doc.text(col.label, 14 + i * colWidth, y))
  doc.setFont('helvetica', 'normal')
  y += 8

  for (const row of rows) {
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      y = 20
    }
    columns.forEach((col, i) => {
      const val = row[col.key]
      doc.text(String(val ?? ''), 14 + i * colWidth, y)
    })
    y += 7
  }

  doc.save(`${filename}.pdf`)
}
