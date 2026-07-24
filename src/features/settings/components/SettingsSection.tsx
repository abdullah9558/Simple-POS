import type { ReactNode } from 'react'
import { Card, CardContent } from '../../../components/ui'
import { Button } from '../../../components/ui'

interface Props {
  title: string
  description?: string
  formId: string
  loading?: boolean
  children: ReactNode
  onSave?: () => void
}

export default function SettingsSection({ title, description, formId, loading, children, onSave }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-body-medium text-text-primary">{title}</h3>
            {description && <p className="mt-1 text-caption text-text-muted">{description}</p>}
          </div>
          <Button type="submit" form={formId} loading={loading} size="sm" onClick={onSave}>
            Save
          </Button>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
