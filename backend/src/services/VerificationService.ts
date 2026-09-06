import { AppDataSource } from '../config/data-source';
import { WorkerProfile } from '../entities/WorkerProfile';
import { EmployerProfile } from '../entities/EmployerProfile';
import { Application } from '../entities/Application';
import { WorkContract } from '../entities/WorkContract';
import { ContractRating } from '../entities/ContractRating';
import { Job } from '../entities/Job';
import { ApiError } from '../utils/ApiError';
import { AuditService } from './AuditService';

export class VerificationService {
  static async getWorkerDetail(workerProfileId: string) {
    const repo = AppDataSource.getRepository(WorkerProfile);
    const profile = await repo.findOne({
      where: { id: workerProfileId },
      relations: ['user', 'primaryCategory', 'location'],
    });
    if (!profile) throw ApiError.notFound('Worker not found');

    const appRepo = AppDataSource.getRepository(Application);
    const contractRepo = AppDataSource.getRepository(WorkContract);
    const ratingRepo = AppDataSource.getRepository(ContractRating);

    const [applicationCount, contracts, ratingsReceived] = await Promise.all([
      appRepo.count({ where: { workerProfileId: profile.id } }),
      contractRepo.find({ where: { workerProfileId: profile.id } }),
      ratingRepo.find({ where: { ratedUserId: profile.userId } }),
    ]);

    return {
      profile,
      stats: {
        applicationCount,
        contractCount: contracts.length,
        activeContracts: contracts.filter((c) => c.status === 'ACTIVE').length,
        ratingsReceivedCount: ratingsReceived.length,
        timesContacted: profile.timesContacted,
      },
    };
  }

  static async getEmployerDetail(employerProfileId: string) {
    const repo = AppDataSource.getRepository(EmployerProfile);
    const profile = await repo.findOne({
      where: { id: employerProfileId },
      relations: ['user', 'primaryCategory', 'location'],
    });
    if (!profile) throw ApiError.notFound('Buyer not found');

    const jobRepo = AppDataSource.getRepository(Job);
    const jobs = await jobRepo.find({ where: { employerProfileId: profile.id } });

    return {
      profile,
      stats: {
        jobsPostedCount: jobs.length,
        featuredJobsCount: jobs.filter((j) => j.isFeatured).length,
        totalSpend: profile.totalSpend,
      },
    };
  }

  static async approveWorker(adminUserId: string, workerProfileId: string) {
    const repo = AppDataSource.getRepository(WorkerProfile);
    const profile = await repo.findOne({ where: { id: workerProfileId } });
    if (!profile) throw ApiError.notFound('Worker not found');
    profile.isVerified = true;
    profile.aadhaarStatus = 'VERIFIED';
    profile.verificationNote = null;
    await repo.save(profile);
    await AuditService.log({
      actorUserId: adminUserId, actorRole: 'ADMIN', action: 'WORKER_VERIFIED',
      entityType: 'WorkerProfile', entityId: profile.id,
    });
    return profile;
  }

  static async removeWorkerVerification(adminUserId: string, workerProfileId: string, reason: string) {
    const repo = AppDataSource.getRepository(WorkerProfile);
    const profile = await repo.findOne({ where: { id: workerProfileId } });
    if (!profile) throw ApiError.notFound('Worker not found');
    profile.isVerified = false;
    profile.aadhaarStatus = 'REJECTED';
    profile.verificationNote = reason;
    await repo.save(profile);
    await AuditService.log({
      actorUserId: adminUserId, actorRole: 'ADMIN', action: 'WORKER_VERIFICATION_REMOVED',
      entityType: 'WorkerProfile', entityId: profile.id, metadata: { reason },
    });
    return profile;
  }

  static async approveEmployer(adminUserId: string, employerProfileId: string) {
    const repo = AppDataSource.getRepository(EmployerProfile);
    const profile = await repo.findOne({ where: { id: employerProfileId } });
    if (!profile) throw ApiError.notFound('Buyer not found');
    profile.isVerified = true;
    profile.verificationNote = null;
    await repo.save(profile);
    await AuditService.log({
      actorUserId: adminUserId, actorRole: 'ADMIN', action: 'EMPLOYER_VERIFIED',
      entityType: 'EmployerProfile', entityId: profile.id,
    });
    return profile;
  }

  static async removeEmployerVerification(adminUserId: string, employerProfileId: string, reason: string) {
    const repo = AppDataSource.getRepository(EmployerProfile);
    const profile = await repo.findOne({ where: { id: employerProfileId } });
    if (!profile) throw ApiError.notFound('Buyer not found');
    profile.isVerified = false;
    profile.verificationNote = reason;
    await repo.save(profile);
    await AuditService.log({
      actorUserId: adminUserId, actorRole: 'ADMIN', action: 'EMPLOYER_VERIFICATION_REMOVED',
      entityType: 'EmployerProfile', entityId: profile.id, metadata: { reason },
    });
    return profile;
  }

  static async editWorker(adminUserId: string, workerProfileId: string, updates: Partial<WorkerProfile>) {
    const repo = AppDataSource.getRepository(WorkerProfile);
    const profile = await repo.findOne({ where: { id: workerProfileId } });
    if (!profile) throw ApiError.notFound('Worker not found');
    Object.assign(profile, updates);
    const saved = await repo.save(profile);
    await AuditService.log({
      actorUserId: adminUserId, actorRole: 'ADMIN', action: 'ADMIN_EDITED_WORKER',
      entityType: 'WorkerProfile', entityId: profile.id,
    });
    return saved;
  }

  static async editEmployer(adminUserId: string, employerProfileId: string, updates: Partial<EmployerProfile>) {
    const repo = AppDataSource.getRepository(EmployerProfile);
    const profile = await repo.findOne({ where: { id: employerProfileId } });
    if (!profile) throw ApiError.notFound('Buyer not found');
    Object.assign(profile, updates);
    const saved = await repo.save(profile);
    await AuditService.log({
      actorUserId: adminUserId, actorRole: 'ADMIN', action: 'ADMIN_EDITED_EMPLOYER',
      entityType: 'EmployerProfile', entityId: profile.id,
    });
    return saved;
  }
}
