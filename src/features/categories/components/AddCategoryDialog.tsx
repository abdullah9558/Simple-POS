import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import CategoryForm from './CategoryForm'
import type { CategoryFormData } from '../schemas/categorySchema'
import { useAddCategory } from '../hooks/useCategories'

interface Props {
  open: boolean
  onClose: () => void
}

const FORM_ID = 'add-category-form'

export default function AddCategoryDialog({ open, onClose }: Props) {
  const addCategory = useAddCategory()
  const { toast } = useToast()

  const handleSubmit = useCallback(
    async (data: CategoryFormData) => {
      try {
        await addCategory.mutateAsync(data)
        toast(`"${data.name}" created successfully`, 'success')
        onClose()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create category'
        toast(message, 'error')
      }
    },
    [addCategory, toast, onClose],
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Category"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form={FORM_ID} loading={addCategory.isPending}>Add Category</Button>
        </>
      }
    >
      <CategoryForm id={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  )
}
