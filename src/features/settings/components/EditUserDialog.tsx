import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import UserForm from './UserForm'
import { useUpdateUser } from '../hooks/useSettings'
import type { SafeUser } from '../api/settingsApi'
import type { UserFormData } from '../schemas/settingsSchema'

interface Props {
  open: boolean
  user: SafeUser
  onClose: () => void
}

const FORM_ID = 'edit-user-form'

export default function EditUserDialog({ open, user, onClose }: Props) {
  const updateUser = useUpdateUser()
  const { toast } = useToast()

  const handleSubmit = useCallback(async (data: UserFormData) => {
    try {
      await updateUser.mutateAsync({ id: user.id, data })
      toast(`"${data.name}" updated successfully`, 'success')
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update user', 'error')
    }
  }, [updateUser, user.id, toast, onClose])

  return (
    <Modal open={open} onClose={onClose} title="Edit User" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form={FORM_ID} loading={updateUser.isPending}>Save Changes</Button>
      </>
    }>
      <UserForm
        id={FORM_ID}
        isEdit
        initialValues={{ name: user.name, email: user.email, role: user.role, isActive: user.isActive, password: '' }}
        onSubmit={handleSubmit}
      />
    </Modal>
  )
}
