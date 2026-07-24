import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import SupplierForm from './SupplierForm'
import { useAddSupplier } from '../hooks/useInventory'
import type { SupplierFormData } from '../schemas/inventorySchema'

interface Props {
  open: boolean
  onClose: () => void
}

const FORM_ID = 'add-supplier-form'

export default function AddSupplierDialog({ open, onClose }: Props) {
  const addSupplier = useAddSupplier()
  const { toast } = useToast()

  const handleSubmit = useCallback(async (data: SupplierFormData) => {
    try {
      await addSupplier.mutateAsync(data)
      toast(`"${data.name}" added successfully`, 'success')
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add supplier', 'error')
    }
  }, [addSupplier, toast, onClose])

  return (
    <Modal open={open} onClose={onClose} title="Add Supplier" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form={FORM_ID} loading={addSupplier.isPending}>Add Supplier</Button>
      </>
    }>
      <SupplierForm id={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  )
}
