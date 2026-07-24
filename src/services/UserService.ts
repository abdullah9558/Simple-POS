import { UserRepository, type UserFilters } from './repositories/UserRepository.ts'
import { hashPassword } from './auth/password.ts'

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER'
}

export interface UpdateUserInput {
  name?: string
  email?: string
  password?: string
  role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER'
  isActive?: boolean
}

export class UserService {
  private repo = new UserRepository()

  async getAll(filters?: UserFilters) {
    return this.repo.findAll(filters)
  }

  async getById(id: string) {
    const user = await this.repo.findById(id)
    if (!user) throw new Error(`User not found: ${id}`)
    return user
  }

  async create(input: CreateUserInput) {
    if (!input.name.trim()) throw new Error('Name is required')
    if (!input.email.trim()) throw new Error('Email is required')
    if (input.password.length < 6) throw new Error('Password must be at least 6 characters')

    const existing = await this.repo.findByEmail(input.email)
    if (existing) throw new Error(`Email "${input.email}" is already in use`)

    return this.repo.create({
      name: input.name,
      email: input.email,
      password: hashPassword(input.password),
      role: input.role,
    })
  }

  async update(id: string, input: UpdateUserInput) {
    await this.getById(id)

    if (input.email) {
      const existing = await this.repo.findByEmail(input.email)
      if (existing && existing.id !== id) throw new Error(`Email "${input.email}" is already in use`)
    }

    const data: Record<string, unknown> = { ...input }
    if (input.password) {
      if (input.password.length < 6) throw new Error('Password must be at least 6 characters')
      data.password = hashPassword(input.password)
    } else {
      delete data.password
    }

    return this.repo.update(id, data)
  }

  async delete(id: string) {
    const user = await this.getById(id)
    if (user._count.sales > 0) {
      throw new Error(`Cannot delete user with ${user._count.sales} sales`)
    }
    return this.repo.delete(id)
  }

  async count() {
    return this.repo.count()
  }
}
