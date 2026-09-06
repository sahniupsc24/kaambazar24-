import { AppDataSource } from '../config/data-source';
import { Category } from '../entities/Category';
import { ApiError } from '../utils/ApiError';

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class CategoryService {
  static async list(activeOnly = true) {
    const repo = AppDataSource.getRepository(Category);
    return repo.find({ where: activeOnly ? { isActive: true } : {}, order: { name: 'ASC' } });
  }

  static async create(name: string, description?: string) {
    const repo = AppDataSource.getRepository(Category);
    const slug = slugify(name);
    const existing = await repo.findOne({ where: { slug } });
    if (existing) throw ApiError.conflict('A category with this name already exists');
    return repo.save(repo.create({ name, slug, description: description ?? null }));
  }

  static async update(id: string, updates: { name?: string; description?: string; isActive?: boolean }) {
    const repo = AppDataSource.getRepository(Category);
    const category = await repo.findOne({ where: { id } });
    if (!category) throw ApiError.notFound('Category not found');
    if (updates.name) {
      category.name = updates.name;
      category.slug = slugify(updates.name);
    }
    if (updates.description !== undefined) category.description = updates.description;
    if (updates.isActive !== undefined) category.isActive = updates.isActive;
    return repo.save(category);
  }
}
