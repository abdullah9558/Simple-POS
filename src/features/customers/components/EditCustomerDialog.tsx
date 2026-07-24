import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import CustomerForm from './CustomerForm'
import { useUpdateCustomer } from '../hooks/useCustomers'
import type { Customer } from '../api/customerApi'
import type { CustomerFormData } from '../schemas/customerSchema'

interface Props {
  open: boolean
  customer: Customer
  onClose: () => void
}

const FORM_ID = 'edit-customer-form'

export default function EditCustomerDialog({ open, customer, onClose }: Props) {
  const updateCustomer = useUpdateCustomer()
  const { toast } = useToast()

  const handleSubmit = useCallback(async (data: CustomerFormData) => {
    try {
      await updateCustomer.mutateAsync({ id: customer.id, data })
      toast(`"${data.name}" updated successfully`, 'success')
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update customer', 'error')
    }
  }, [updateCustomer, customer.id, toast, onClose])

  return (
    <Modal open={open} onClose={onClose} title="Edit Customer" size="lg" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form={FORM_ID} loading={updateCustomer.isPending}>Save Changes</Button>
      </>
    }>
      <CustomerForm
        id={FORM_ID}
        initialValues={{
          name: customer.name,
          email: customer.email ?? '',
          phone: customer.phone ?? '',
          whatsapp: customer.whatsapp ?? '',
          address: customer.address ?? '',
          creditBalance: customer.creditBalance,
          outstandingBalance: customer.outstandingBalance,
        }}
        onSubmit={handleSubmit}
      />
    </Modal>
  )
}
