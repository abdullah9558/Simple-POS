import { CategoryRepository, type CategoryFilters } from './repositories/index.ts'

export interface CreateCategoryInput {
  name: string
  description?: string
}

export interface UpdateCategoryInput {
  name?: string
  description?: string
}

export class CategoryService {
  private repo = new CategoryRepository()

  async getAll(filters?: CategoryFilters) {
    return this.repo.findAll(filters)
  }

  async getById(id: string) {
    const category = await this.repo.findById(id)
    if (!category) throw new Error(`Category not found: ${id}`)
    return category
  }

  async create(input: CreateCategoryInput) {
    if (!input.name.trim()) throw new Error('Category name is required')

    const existing = await this.repo.findByName(input.name)
    if (existing) throw new Error(`Category "${input.name}" already exists`)

    return this.repo.create({ name: input.name, description: input.description })
  }

  async update(id: string, input: UpdateCategoryInput) {
    await this.getById(id)

    if (input.name) {
      const existing = await this.repo.findByName(input.name)
      if (existing && existing.id !== id) {
        throw new Error(`Category "${input.name}" already exists`)
      }
    }

    return this.repo.update(id, input)
  }

  async delete(id: string) {
    const category = await this.getById(id)
    if (category._count.products > 0) {
      throw new Error(`Cannot delete category with ${category._count.products} products`)
    }
    return this.repo.delete(id)
  }

  async count(filters?: CategoryFilters) {
    return this.repo.count(filters)
  }
}
