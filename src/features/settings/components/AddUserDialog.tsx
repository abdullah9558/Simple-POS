import { useCallback } from 'react'
import { Modal, Button, useToast } from '../../../components/ui'
import UserForm from './UserForm'
import { useCreateUser } from '../hooks/useSettings'
import type { UserFormData } from '../schemas/settingsSchema'

interface Props {
  open: boolean
  onClose: () => void
}

const FORM_ID = 'add-user-form'

export default function AddUserDialog({ open, onClose }: Props) {
  const createUser = useCreateUser()
  const { toast } = useToast()

  const handleSubmit = useCallback(async (data: UserFormData) => {
    if (!data.password || data.password.length < 6) {
      toast('Password must be at least 6 characters', 'error')
      return
    }
    try {
      await createUser.mutateAsync({ ...data, password: data.password })
      toast(`"${data.name}" created successfully`, 'success')
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create user', 'error')
    }
  }, [createUser, toast, onClose])

  return (
    <Modal open={open} onClose={onClose} title="Add User" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form={FORM_ID} loading={createUser.isPending}>Add User</Button>
      </>
    }>
      <UserForm id={FORM_ID} onSubmit={handleSubmit} />
    </Modal>
  )
}
