import { CustomerRepository, type CustomerFilters } from './repositories/index.ts'
import type { CheckoutContactInput } from '../shared/invoice.ts'

export interface CreateCustomerInput {
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  creditBalance?: number
  outstandingBalance?: number
}

export interface UpdateCustomerInput {
  name?: string
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  address?: string | null
  creditBalance?: number
  outstandingBalance?: number
}

function normalizeOptional(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Customer domain service — CRUD plus checkout contact capture / upsert.
 */
export class CustomerService {
  private repo = new CustomerRepository()

  async getAll(filters?: CustomerFilters) {
    return this.repo.findAll(filters)
  }

  async getById(id: string) {
    const customer = await this.repo.findById(id)
    if (!customer) throw new Error(`Customer not found: ${id}`)
    return customer
  }

  async getPurchaseHistory(id: string) {
    await this.getById(id)
    return this.repo.getPurchaseHistory(id)
  }

  async create(input: CreateCustomerInput) {
    if (!input.name.trim()) throw new Error('Customer name is required')
    if ((input.creditBalance ?? 0) < 0) throw new Error('Credit balance cannot be negative')
    if ((input.outstandingBalance ?? 0) < 0) throw new Error('Outstanding balance cannot be negative')
    return this.repo.create({
      name: input.name.trim(),
      email: normalizeOptional(input.email),
      phone: normalizeOptional(input.phone),
      whatsapp: normalizeOptional(input.whatsapp),
      address: normalizeOptional(input.address),
      creditBalance: input.creditBalance ?? 0,
      outstandingBalance: input.outstandingBalance ?? 0,
    })
  }

  async update(id: string, input: UpdateCustomerInput) {
    await this.getById(id)
    if (input.creditBalance !== undefined && input.creditBalance < 0) {
      throw new Error('Credit balance cannot be negative')
    }
    if (input.outstandingBalance !== undefined && input.outstandingBalance < 0) {
      throw new Error('Outstanding balance cannot be negative')
    }
    return this.repo.update(id, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.whatsapp !== undefined ? { whatsapp: input.whatsapp?.trim() || null } : {}),
      ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
      ...(input.creditBalance !== undefined ? { creditBalance: input.creditBalance } : {}),
      ...(input.outstandingBalance !== undefined ? { outstandingBalance: input.outstandingBalance } : {}),
    })
  }

  async delete(id: string) {
    const customer = await this.getById(id)
    if (customer._count.sales > 0) {
      throw new Error(`Cannot delete customer with ${customer._count.sales} sales`)
    }
    return this.repo.delete(id)
  }

  async count(filters?: CustomerFilters) {
    return this.repo.count(filters)
  }

  /**
   * Resolves a customer for checkout contact capture.
   * Matches by email, WhatsApp, or mobile; creates a new record when needed.
   * Returns null when no contact details were provided (walk-in).
   */
  async findOrCreateFromCheckoutContact(contact?: CheckoutContactInput | null) {
    if (!contact) return null

    const email = normalizeOptional(contact.email)
    const phone = normalizeOptional(contact.phone)
    const whatsapp = normalizeOptional(contact.whatsapp)
    const name = normalizeOptional(contact.name)

    if (!email && !phone && !whatsapp && !name) return null

    let existing = null
    if (email) existing = await this.repo.findByEmail(email)
    if (!existing && whatsapp) existing = await this.repo.findByWhatsapp(whatsapp)
    if (!existing && phone) existing = await this.repo.findByPhone(phone)

    if (existing) {
      return this.repo.update(existing.id, {
        ...(name && name !== existing.name ? { name } : {}),
        ...(email && !existing.email ? { email } : {}),
        ...(phone && !existing.phone ? { phone } : {}),
        ...(whatsapp && !existing.whatsapp ? { whatsapp } : {}),
      })
    }

    return this.repo.create({
      name: name || email || phone || whatsapp || 'Guest Customer',
      email,
      phone,
      whatsapp,
    })
  }
}
