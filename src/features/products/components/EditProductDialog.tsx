import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import ProductForm from './ProductForm'
import type { ProductFormData } from '../schemas/productSchema'
import type { Product } from '../api/productApi'
import { useEditProduct } from '../hooks/useProducts'

interface Props {
  open: boolean
  product: Product
  onClose: () => void
}

const FORM_ID = 'edit-product-form'

export default function EditProductDialog({ open, product, onClose }: Props) {
  const editProduct = useEditProduct()
  const { toast } = useToast()

  const initialValues: Partial<ProductFormData> = {
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    minStock: product.minStock,
    categoryId: product.category?.id ?? '',
    supplierId: product.supplier?.id ?? '',
  }

  const handleSubmit = useCallback(
    async (data: ProductFormData) => {
      try {
        await editProduct.mutateAsync({ id: product.id, data })
        toast(`"${data.name}" updated successfully`, 'success')
        onClose()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update product'
        toast(message, 'error')
      }
    },
    [editProduct, product.id, toast, onClose],
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Product"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={editProduct.isPending}>
            Save Changes
          </Button>
        </>
      }
    >
      <ProductForm id={FORM_ID} initialValues={initialValues} onSubmit={handleSubmit} />
    </Modal>
  )
}
