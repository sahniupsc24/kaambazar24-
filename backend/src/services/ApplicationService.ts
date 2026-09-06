import { AppDataSource } from '../config/data-source';
import { Application } from '../entities/Application';
import { Job } from '../entities/Job';
import { WorkerProfile } from '../entities/WorkerProfile';
import { ApplicationStatus, JobStatus } from '../entities/enums';
import { OwnershipService } from './OwnershipService';
import { ApiError } from '../utils/ApiError';
import { HiringService } from './HiringService';
import { AuditService } from './AuditService';
import { JobService } from './JobService';

export class ApplicationService {
  static async apply(userId: string, jobId: string, coverNote?: string, aadhaarNumber?: string) {
    const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
    return AppDataSource.transaction(async (manager) => {
      const jobRepo = manager.getRepository(Job);
      const job = await jobRepo.findOne({ where: { id: jobId } });
      if (!job) throw ApiError.notFound('Job not found');
      if (job.status !== JobStatus.OPEN) {
        throw ApiError.badRequest('This job is not currently accepting applications');
      }

      // Aadhaar gate: resolved from the job's effective rule (buyer's
      // preference, unless Admin has overridden it — see JobService).
      if (JobService.isAadhaarRequired(job)) {
        const workerRepo = manager.getRepository(WorkerProfile);
        const fullWorkerProfile = await workerRepo
          .createQueryBuilder('wp')
          .addSelect('wp.aadhaarNumber')
          .where('wp.id = :id', { id: workerProfile.id })
          .getOne();

        const existingAadhaar = fullWorkerProfile?.aadhaarNumber;
        if (!existingAadhaar) {
          if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
            throw ApiError.badRequest(
              'This job requires Aadhaar verification. Provide a valid 12-digit Aadhaar number to apply.',
              { requiresAadhaar: true }
            );
          }
          await workerRepo.update({ id: workerProfile.id }, { aadhaarNumber });
        }
      }

      const appRepo = manager.getRepository(Application);
      const existing = await appRepo.findOne({ where: { jobId, workerProfileId: workerProfile.id } });
      if (existing) {
        throw ApiError.conflict('You have already applied to this job');
      }

      const application = appRepo.create({
        jobId,
        workerProfileId: workerProfile.id,
        coverNote: coverNote ?? null,
        status: ApplicationStatus.SUBMITTED,
      });
      const saved = await appRepo.save(application);

      await AuditService.log({
        actorUserId: userId,
        actorRole: 'WORKER',
        action: 'APPLICATION_SUBMITTED',
        entityType: 'Application',
        entityId: saved.id,
      });

      return saved;
    });
  }

  static async withdraw(userId: string, applicationId: string) {
    const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
    const repo = AppDataSource.getRepository(Application);
    const application = await repo.findOne({ where: { id: applicationId } });
    if (!application) throw ApiError.notFound('Application not found');

    OwnershipService.assertOwns(application.workerProfileId, workerProfile.id, 'application');

    if (application.status !== ApplicationStatus.SUBMITTED && application.status !== ApplicationStatus.UNDER_REVIEW) {
      throw ApiError.badRequest('Only pending applications can be withdrawn');
    }

    application.status = ApplicationStatus.WITHDRAWN;
    return repo.save(application);
  }

  static async getMyApplications(userId: string) {
    const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
    const repo = AppDataSource.getRepository(Application);
    return repo.find({
      where: { workerProfileId: workerProfile.id },
      relations: ['job', 'job.category', 'job.location'],
      order: { createdAt: 'DESC' },
    });
  }

  // Employer reviewing applications for one of their own jobs.
  static async getApplicationsForJob(userId: string, jobId: string) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const jobRepo = AppDataSource.getRepository(Job);
    const job = await jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');

    OwnershipService.assertOwns(job.employerProfileId, employerProfile.id, 'job');

    const repo = AppDataSource.getRepository(Application);
    return repo.find({
      where: { jobId },
      relations: ['workerProfile'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * The mandatory cross-module integration point (spec section 12/45):
   * Application ACCEPTED -> Hiring CREATED, atomically in one transaction
   * so the two records can never become inconsistent with each other.
   */
  static async accept(userId: string, applicationId: string, reviewNote?: string) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);

    return AppDataSource.transaction(async (manager) => {
      const appRepo = manager.getRepository(Application);
      const jobRepo = manager.getRepository(Job);

      const application = await appRepo.findOne({ where: { id: applicationId } });
      if (!application) throw ApiError.notFound('Application not found');

      const job = await jobRepo.findOne({ where: { id: application.jobId } });
      if (!job) throw ApiError.notFound('Job not found');

      OwnershipService.assertOwns(job.employerProfileId, employerProfile.id, 'application');

      if (application.status !== ApplicationStatus.SUBMITTED && application.status !== ApplicationStatus.UNDER_REVIEW) {
        throw ApiError.badRequest(`Cannot accept an application in status ${application.status}`);
      }

      application.status = ApplicationStatus.ACCEPTED;
      application.employerReviewNote = reviewNote ?? null;
      application.reviewedAt = new Date();
      await appRepo.save(application);

      const hiring = await HiringService.createFromAcceptedApplication(manager, application, job);

      await AuditService.log({
        actorUserId: userId,
        actorRole: 'EMPLOYER',
        action: 'APPLICATION_ACCEPTED',
        entityType: 'Application',
        entityId: application.id,
        metadata: { hiringId: hiring.id },
      });

      return { application, hiring };
    });
  }

  static async reject(userId: string, applicationId: string, reviewNote?: string) {
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    const appRepo = AppDataSource.getRepository(Application);
    const jobRepo = AppDataSource.getRepository(Job);

    const application = await appRepo.findOne({ where: { id: applicationId } });
    if (!application) throw ApiError.notFound('Application not found');

    const job = await jobRepo.findOne({ where: { id: application.jobId } });
    if (!job) throw ApiError.notFound('Job not found');

    OwnershipService.assertOwns(job.employerProfileId, employerProfile.id, 'application');

    if (application.status !== ApplicationStatus.SUBMITTED && application.status !== ApplicationStatus.UNDER_REVIEW) {
      throw ApiError.badRequest(`Cannot reject an application in status ${application.status}`);
    }

    application.status = ApplicationStatus.REJECTED;
    application.employerReviewNote = reviewNote ?? null;
    application.reviewedAt = new Date();
    return appRepo.save(application);
  }
}
