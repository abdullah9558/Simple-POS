import { useCallback } from 'react'
import { Button, Spinner, ConfirmationDialog, useToast } from '../../../components/ui'
import { useDatabaseInfo, useBackupDatabase, useRestoreDatabase } from '../hooks/useSettings'
import { useState } from 'react'

export default function DatabasePanel() {
  const { toast } = useToast()
  const { data: info, isFetching, refetch, isLoading } = useDatabaseInfo()
  const backup = useBackupDatabase()
  const restore = useRestoreDatabase()
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)

  const handleLoadInfo = useCallback(() => refetch(), [refetch])

  const handleBackup = useCallback(async () => {
    try {
      const path = await backup.mutateAsync()
      if (path) toast(`Database backed up to ${path}`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Backup failed', 'error')
    }
  }, [backup, toast])

  const handleRestore = useCallback(async () => {
    try {
      const ok = await restore.mutateAsync()
      if (ok) {
        toast('Database restored. Please restart the application.', 'success')
        setShowRestoreConfirm(false)
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Restore failed', 'error')
    }
  }, [restore, toast])

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
        <p className="text-body text-warning">
          Database operations affect all store data. Always create a backup before restoring.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={handleLoadInfo} loading={isFetching}>
          Load Database Info
        </Button>
        <Button onClick={handleBackup} loading={backup.isPending}>
          Backup Database
        </Button>
        <Button variant="danger" onClick={() => setShowRestoreConfirm(true)} loading={restore.isPending}>
          Restore Database
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

      {info && (
        <div className="rounded-xl border border-border-subtle bg-surface-raised p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-caption text-text-muted">Size</p>
              <p className="mt-1 text-body-medium tabular-nums">{info.sizeFormatted}</p>
            </div>
            <div>
              <p className="text-caption text-text-muted">Last Modified</p>
              <p className="mt-1 text-body-medium">{new Date(info.lastModified).toLocaleString()}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-caption text-text-muted">Path</p>
              <p className="mt-1 text-caption font-mono text-text-secondary truncate" title={info.path}>{info.path}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-caption-medium text-text-muted uppercase tracking-wider">Table Records</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(info.tableCounts).map(([table, count]) => (
                <div key={table} className="rounded-md bg-surface-inset px-3 py-2">
                  <p className="text-overline text-text-muted capitalize">{table}</p>
                  <p className="text-body-medium tabular-nums">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={handleRestore}
        title="Restore Database"
        description="This will replace the current database with a backup file. All unsaved data will be lost. The app should be restarted after restore."
        confirmLabel="Restore"
        variant="danger"
        loading={restore.isPending}
      />
    </div>
  )
}
