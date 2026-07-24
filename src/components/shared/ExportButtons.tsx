import { Button } from '../ui'
import { exportToCsv, exportToPdf, type ExportColumn } from '../../lib/export'

interface Props {
  title: string
  filename: string
  columns: ExportColumn[]
  rows: Record<string, unknown>[]
}

export default function ExportButtons({ title, filename, columns, rows }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={rows.length === 0}
        onClick={() => exportToCsv(columns, rows, filename)}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
        CSV
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={rows.length === 0}
        onClick={() => exportToPdf(title, columns, rows, filename)}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
        PDF
      </Button>
    </div>
  )
}
