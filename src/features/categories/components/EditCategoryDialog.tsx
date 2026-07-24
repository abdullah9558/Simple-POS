import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import CategoryForm from './CategoryForm'
import type { CategoryFormData } from '../schemas/categorySchema'
import type { Category } from '../api/categoryApi'
import { useEditCategory } from '../hooks/useCategories'

interface Props {
  open: boolean
  category: Category
  onClose: () => void
}

const FORM_ID = 'edit-category-form'

export default function EditCategoryDialog({ open, category, onClose }: Props) {
  const editCategory = useEditCategory()
  const { toast } = useToast()

  const initialValues: Partial<CategoryFormData> = {
    name: category.name,
    description: category.description,
  }

  const handleSubmit = useCallback(
    async (data: CategoryFormData) => {
      try {
        await editCategory.mutateAsync({ id: category.id, data })
        toast(`"${data.name}" updated successfully`, 'success')
        onClose()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update category'
        toast(message, 'error')
      }
    },
    [editCategory, category.id, toast, onClose],
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Category"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form={FORM_ID} loading={editCategory.isPending}>Save Changes</Button>
        </>
      }
    >
      <CategoryForm id={FORM_ID} initialValues={initialValues} onSubmit={handleSubmit} />
    </Modal>
  )
}
