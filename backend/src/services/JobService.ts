import { AppDataSource } from '../config/data-source';
import { Job } from '../entities/Job';
import { JobStatus, AadhaarPreference, AadhaarOverride } from '../entities/enums';
import { PlatformSettingService } from './PlatformSettingService';
import { OwnershipService } from './OwnershipService';
import { ApiError } from '../utils/ApiError';
import { AuditService } from './AuditService';

export interface CreateJobInput {
  title: string;
  description: string;
  requirements?: string;
  categoryId: string;
  locationId: string;
  workType: string;
  compensationType: string;
  compensationRate: string;
  openings?: number;
  applicationDeadline?: string;
  aadhaarRequired?: boolean; // buyer's preference at post time
  wantsFeatured?: boolean;
}

export interface JobSearchFilters {
  categoryId?: string;
  locationId?: string;
  workType?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export class JobService {
  /**
   * Resolves whether Aadhaar is actually required for a job, applying
   * admin's final say over the buyer's own preference (spec: buyer
   * proposes Yes/No at post time, but Admin can force MANDATORY or
   * OPTIONAL on any specific job at any time — even after the buyer's
   * choice was already saved).
   */
  static isAadhaarRequired(job: Job): boolean {
    if (job.aadhaarAdminOverride === AadhaarOverride.MANDATORY) return true;
    if (job.aadhaarAdminOverride === AadhaarOverride.OPTIONAL) return false;
    return job.aadhaarBuyerPreference === AadhaarPreference.REQUIRED;
  }

  static async create(userId: string, input: CreateJobInput) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const repo = AppDataSource.getRepository(Job);

    // --- Enforce Job Quota ---
    const enforceQuota = await PlatformSettingService.get('JOB_QUOTA_ENFORCEMENT');
    if (enforceQuota === 'true') {
      const isSubscribed = employerProfile.subscriptionExpiresAt && employerProfile.subscriptionExpiresAt.getTime() > Date.now();
      if (!isSubscribed) {
        const quotaStr = await PlatformSettingService.get('FREE_JOB_QUOTA');
        const quota = parseInt(quotaStr, 10) || 2;
        const jobCount = await repo.count({ where: { employerProfileId: employerProfile.id } });
        if (jobCount >= quota) {
          throw ApiError.forbidden(`You have reached your free limit of ${quota} jobs. Please upgrade to Premium to post more jobs.`);
        }
      }
    }

    const { aadhaarRequired, wantsFeatured, ...jobFields } = input;

    const job = repo.create({
      ...jobFields,
      employerProfileId: employerProfile.id,
      status: JobStatus.OPEN,
      aadhaarBuyerPreference: aadhaarRequired ? AadhaarPreference.REQUIRED : AadhaarPreference.NOT_REQUIRED,
    } as Partial<Job>);

    if (wantsFeatured) {
      const days = parseInt(await PlatformSettingService.get('FEATURED_LISTING_DAYS'), 10) || 7;
      const until = new Date();
      until.setDate(until.getDate() + days);
      job.isFeatured = true;
      job.featuredUntil = until;
      // Charge simulated/real spend to the buyer's running total.
      const { EmployerProfile } = await import('../entities/EmployerProfile');
      const employerRepo = AppDataSource.getRepository(EmployerProfile);
      const price = parseFloat(await PlatformSettingService.get('FEATURED_LISTING_PRICE'));
      employerProfile.totalSpend = (parseFloat(employerProfile.totalSpend || '0') + price).toFixed(2);
      await employerRepo.save(employerProfile);
    }

    const saved = await repo.save(job);

    await AuditService.log({
      actorUserId: userId,
      actorRole: 'EMPLOYER',
      action: 'JOB_CREATED',
      entityType: 'Job',
      entityId: saved.id,
      metadata: { featured: !!wantsFeatured },
    });

    return saved;
  }

  // Admin-only: force a specific job's Aadhaar rule regardless of the
  // buyer's own preference. Pass null to defer back to the buyer's choice.
  static async setAadhaarOverride(adminUserId: string, jobId: string, override: AadhaarOverride | null) {
    const repo = AppDataSource.getRepository(Job);
    const job = await repo.findOne({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    job.aadhaarAdminOverride = override;
    const saved = await repo.save(job);
    await AuditService.log({
      actorUserId: adminUserId,
      actorRole: 'ADMIN',
      action: 'JOB_AADHAAR_OVERRIDE_SET',
      entityType: 'Job',
      entityId: job.id,
      metadata: { override },
    });
    return saved;
  }

  /** Admin-only: edit any job without ownership check. */
  static async adminUpdateJob(adminUserId: string, jobId: string, updates: Partial<CreateJobInput> & { status?: string; isFeatured?: boolean }) {
    const repo = AppDataSource.getRepository(Job);
    const job = await repo.findOne({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');

    const { aadhaarRequired, wantsFeatured, ...rest } = updates as any;
    Object.assign(job, rest);
    if (aadhaarRequired !== undefined) {
      job.aadhaarBuyerPreference = aadhaarRequired ? AadhaarPreference.REQUIRED : AadhaarPreference.NOT_REQUIRED;
    }
    if (updates.isFeatured !== undefined) {
      job.isFeatured = updates.isFeatured;
    }

    const saved = await repo.save(job);

    await AuditService.log({
      actorUserId: adminUserId,
      actorRole: 'ADMIN',
      action: 'ADMIN_JOB_EDITED',
      entityType: 'Job',
      entityId: job.id,
      metadata: { updatedFields: Object.keys(updates) },
    });

    return saved;
  }

  static async update(userId: string, jobId: string, updates: Partial<CreateJobInput>) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const repo = AppDataSource.getRepository(Job);
    const job = await repo.findOne({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');

    OwnershipService.assertOwns(job.employerProfileId, employerProfile.id, 'job');

    Object.assign(job, updates);
    return repo.save(job);
  }

  static async close(userId: string, jobId: string) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const repo = AppDataSource.getRepository(Job);
    const job = await repo.findOne({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');

    OwnershipService.assertOwns(job.employerProfileId, employerProfile.id, 'job');

    job.status = JobStatus.CLOSED;
    return repo.save(job);
  }

  static async getMyJobs(userId: string) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const repo = AppDataSource.getRepository(Job);
    return repo.find({
      where: { employerProfileId: employerProfile.id },
      order: { createdAt: 'DESC' },
      relations: ['category', 'location'],
    });
  }

  static async getPublicById(jobId: string) {
    const repo = AppDataSource.getRepository(Job);
    const job = await repo.findOne({
      where: { id: jobId },
      relations: ['category', 'location', 'employerProfile'],
    });
    if (!job) throw ApiError.notFound('Job not found');
    return JobService.toPublicJson(job);
  }

  // Strips the employer's phone number (a monetized field revealed only
  // via ContactUnlockService) and adds the resolved Aadhaar requirement
  // flag so the frontend never has to duplicate the override logic.
  static toPublicJson(job: Job) {
    const { employerProfile, ...rest } = job as any;
    const publicEmployer = employerProfile
      ? {
          id: employerProfile.id,
          businessName: employerProfile.businessName,
          businessDescription: employerProfile.businessDescription,
          isVerified: employerProfile.isVerified,
          userId: employerProfile.userId, // needed by the frontend to call /api/contacts/unlock
        }
      : undefined;
    return { ...rest, employerProfile: publicEmployer, aadhaarRequired: JobService.isAadhaarRequired(job) };
  }

  static async search(filters: JobSearchFilters) {
    const repo = AppDataSource.getRepository(Job);
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 20, 50);

    const qb = repo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.location', 'location')
      .leftJoinAndSelect('job.employerProfile', 'employerProfile')
      .where('job.status = :status', { status: JobStatus.OPEN });

    if (filters.categoryId) qb.andWhere('job.categoryId = :categoryId', { categoryId: filters.categoryId });
    if (filters.locationId) qb.andWhere('job.locationId = :locationId', { locationId: filters.locationId });
    if (filters.workType) qb.andWhere('job.workType = :workType', { workType: filters.workType });
    if (filters.q) {
      qb.andWhere('(job.title ILIKE :q OR job.description ILIKE :q)', { q: `%${filters.q}%` });
    }

    qb.orderBy('job.isFeatured', 'DESC')
      .addOrderBy('job.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((j) => JobService.toPublicJson(j)), total, page, pageSize };
  }
}
