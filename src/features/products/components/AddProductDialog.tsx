import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import ProductForm from './ProductForm'
import type { ProductFormData } from '../schemas/productSchema'
import { useAddProduct } from '../hooks/useProducts'

interface Props {
  open: boolean
  onClose: () => void
}

const FORM_ID = 'add-product-form'

export default function AddProductDialog({ open, onClose }: Props) {
  const addProduct = useAddProduct()
  const { toast } = useToast()

  const handleSubmit = useCallback(
    async (data: ProductFormData) => {
      try {
        await addProduct.mutateAsync(data)
        toast(`"${data.name}" added successfully`, 'success')
        onClose()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add product'
        toast(message, 'error')
      }
    },
    [addProduct, toast, onClose],
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Product"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={addProduct.isPending}>
            Add Product
          </Button>
        </>
      }
    >
      <ProductForm id={FORM_ID} onSubmit={handleSubmit} focusBarcode />
    </Modal>
  )
}
