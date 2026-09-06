import { AppDataSource } from '../config/data-source';
import { Location } from '../entities/Location';
import { ApiError } from '../utils/ApiError';

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class LocationService {
  static async listTree() {
    const repo = AppDataSource.getTreeRepository(Location);
    return repo.findTrees();
  }

  static async listFlat(activeOnly = true) {
    const repo = AppDataSource.getRepository(Location);
    return repo.find({ where: activeOnly ? { isActive: true } : {}, order: { name: 'ASC' } });
  }

  static async create(name: string, level: string, parentId?: string) {
    const repo = AppDataSource.getTreeRepository(Location);
    const slug = slugify(name) + (parentId ? `-${parentId.slice(0, 8)}` : '');

    let parent: Location | null = null;
    if (parentId) {
      parent = await repo.findOne({ where: { id: parentId } });
      if (!parent) throw ApiError.notFound('Parent location not found');
    }

    const location = repo.create({ name, slug, level: level as any, parent });
    return repo.save(location);
  }

  static async update(id: string, updates: { name?: string; level?: string; parentId?: string | null; isActive?: boolean }) {
    const repo = AppDataSource.getTreeRepository(Location);
    const location = await repo.findOne({ where: { id }, relations: ['parent'] });
    if (!location) throw ApiError.notFound('Location not found');

    if (updates.name !== undefined) {
      location.name = updates.name;
      location.slug = slugify(updates.name) + (location.parent ? `-${location.parent.id.slice(0, 8)}` : '');
    }
    if (updates.level !== undefined) {
      location.level = updates.level as any;
    }
    if (updates.isActive !== undefined) {
      location.isActive = updates.isActive;
    }
    if (updates.parentId !== undefined) {
      if (updates.parentId === null || updates.parentId === '') {
        location.parent = null;
      } else {
        const parent = await repo.findOne({ where: { id: updates.parentId } });
        if (!parent) throw ApiError.notFound('Parent location not found');
        location.parent = parent;
      }
    }
    return repo.save(location);
  }

  static async delete(id: string) {
    const repo = AppDataSource.getRepository(Location);
    const location = await repo.findOne({ where: { id } });
    if (!location) throw ApiError.notFound('Location not found');
    await repo.remove(location);
  }
}

