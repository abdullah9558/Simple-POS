import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import CustomerForm from './CustomerForm'
import { useAddCustomer } from '../hooks/useCustomers'
import type { CustomerFormData } from '../schemas/customerSchema'

interface Props {
  open: boolean
  onClose: () => void
}

const FORM_ID = 'add-customer-form'

export default function AddCustomerDialog({ open, onClose }: Props) {
  const addCustomer = useAddCustomer()
  const { toast } = useToast()

  const handleSubmit = useCallback(async (data: CustomerFormData) => {
    try {
      await addCustomer.mutateAsync(data)
      toast(`"${data.name}" added successfully`, 'success')
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add customer', 'error')
    }
  }, [addCustomer, toast, onClose])

  return (
    <Modal open={open} onClose={onClose} title="Add Customer" size="lg" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form={FORM_ID} loading={addCustomer.isPending}>Add Customer</Button>
      </>
    }>
      <CustomerForm id={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  )
}
