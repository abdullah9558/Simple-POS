import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import SupplierForm from './SupplierForm'
import { useUpdateSupplier } from '../hooks/useInventory'
import type { Supplier } from '../api/inventoryApi'
import type { SupplierFormData } from '../schemas/inventorySchema'

interface Props {
  open: boolean
  supplier: Supplier
  onClose: () => void
}

const FORM_ID = 'edit-supplier-form'

export default function EditSupplierDialog({ open, supplier, onClose }: Props) {
  const updateSupplier = useUpdateSupplier()
  const { toast } = useToast()

  const handleSubmit = useCallback(async (data: SupplierFormData) => {
    try {
      await updateSupplier.mutateAsync({ id: supplier.id, data })
      toast(`"${data.name}" updated successfully`, 'success')
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update supplier', 'error')
    }
  }, [updateSupplier, supplier.id, toast, onClose])

  return (
    <Modal open={open} onClose={onClose} title="Edit Supplier" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form={FORM_ID} loading={updateSupplier.isPending}>Save Changes</Button>
      </>
    }>
      <SupplierForm
        id={FORM_ID}
        initialValues={{
          name: supplier.name,
          email: supplier.email ?? '',
          phone: supplier.phone ?? '',
          address: supplier.address ?? '',
          company: supplier.company ?? '',
        }}
        onSubmit={handleSubmit}
      />
    </Modal>
  )
}
