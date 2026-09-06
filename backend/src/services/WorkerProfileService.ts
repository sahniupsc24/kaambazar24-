import { AppDataSource } from '../config/data-source';
import { WorkerProfile } from '../entities/WorkerProfile';
import { User } from '../entities/User';
import { OwnershipService } from './OwnershipService';

export interface UpdateWorkerProfileInput {
  fullName?: string;
  bio?: string;
  experienceYears?: number;
  skills?: string[];
  primaryCategoryId?: string | null;
  locationId?: string | null;
  isAvailable?: boolean;
  aadhaarNumber?: string | null;
  aadhaarFrontUrl?: string | null;
  aadhaarBackUrl?: string | null;
}

function computeIsComplete(p: WorkerProfile): boolean {
  return Boolean(p.fullName && p.primaryCategoryId && p.locationId && p.skills?.length > 0);
}

export interface WorkerSearchFilters {
  categoryId?: string;
  locationId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export class WorkerProfileService {
  static async getMyProfile(userId: string) {
    return OwnershipService.resolveWorkerProfile(userId);
  }

  // No workerId is ever accepted from the client here — the profile row to
  // mutate is resolved strictly from the authenticated user's id.
  static async updateMyProfile(userId: string, updates: UpdateWorkerProfileInput & { email?: string; avatarUrl?: string }) {
    const repo = AppDataSource.getRepository(WorkerProfile);
    const profile = await OwnershipService.resolveWorkerProfile(userId);

    const { email, avatarUrl, ...profileUpdates } = updates as any;

    if (email || avatarUrl !== undefined) {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: userId } });
      if (user) {
        if (email) user.email = email;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
        await userRepo.save(user);
      }
    }

    Object.assign(profile, profileUpdates);
    profile.isProfileComplete = computeIsComplete(profile);

    await repo.save(profile);
    return OwnershipService.resolveWorkerProfile(userId);
  }

  static async submitAadhaar(userId: string, data: { aadhaarNumber: string; aadhaarFrontUrl: string; aadhaarBackUrl: string }) {
    const repo = AppDataSource.getRepository(WorkerProfile);
    const profile = await OwnershipService.resolveWorkerProfile(userId);

    profile.aadhaarNumber = data.aadhaarNumber;
    profile.aadhaarFrontUrl = data.aadhaarFrontUrl;
    profile.aadhaarBackUrl = data.aadhaarBackUrl;
    profile.aadhaarStatus = 'PENDING';
    profile.aadhaarSubmittedAt = new Date();

    return repo.save(profile);
  }

  // Used by admin/public views only — never used to authorize a write.
  static async getById(id: string) {
    const repo = AppDataSource.getRepository(WorkerProfile);
    return repo.findOne({ where: { id }, relations: ['primaryCategory', 'location'] });
  }

  /**
   * Buyer-facing worker directory search. Never returns the worker's
   * phone number directly — the caller (controller) is responsible for
   * separately checking ContactUnlockService and attaching the number
   * only if the requesting buyer has actually unlocked it.
   */
  static async search(filters: WorkerSearchFilters) {
    const repo = AppDataSource.getRepository(WorkerProfile);
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 20, 50);

    const qb = repo
      .createQueryBuilder('worker')
      .leftJoinAndSelect('worker.primaryCategory', 'category')
      .leftJoinAndSelect('worker.location', 'location')
      .where('worker.isProfileComplete = true');

    if (filters.categoryId) qb.andWhere('worker.primaryCategoryId = :categoryId', { categoryId: filters.categoryId });
    if (filters.locationId) qb.andWhere('worker.locationId = :locationId', { locationId: filters.locationId });
    if (filters.q) {
      qb.andWhere('(worker.fullName ILIKE :q OR worker.skills::text ILIKE :q)', { q: `%${filters.q}%` });
    }

    qb.orderBy('worker.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }
}
