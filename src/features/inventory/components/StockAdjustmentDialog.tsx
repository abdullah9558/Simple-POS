import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import StockAdjustmentForm from './StockAdjustmentForm'
import { useAdjustStock, useActiveProducts } from '../hooks/useInventory'
import type { StockAdjustmentFormData } from '../schemas/inventorySchema'
import type { Product } from '../../products/api/productApi'

interface Props {
  open: boolean
  product?: Product | null
  onClose: () => void
}

const FORM_ID = 'stock-adjust-dialog-form'

export default function StockAdjustmentDialog({ open, product, onClose }: Props) {
  const adjustStock = useAdjustStock()
  const { data: products = [] } = useActiveProducts()
  const { toast } = useToast()

  const handleSubmit = useCallback(async (data: StockAdjustmentFormData) => {
    try {
      await adjustStock.mutateAsync(data)
      toast('Stock adjusted successfully', 'success')
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Adjustment failed', 'error')
    }
  }, [adjustStock, toast, onClose])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust Stock"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form={FORM_ID} loading={adjustStock.isPending}>Adjust Stock</Button>
        </>
      }
    >
      <StockAdjustmentForm id={FORM_ID} product={product} products={products} onSubmit={handleSubmit} />
    </Modal>
  )
}
