import { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Hiring } from '../entities/Hiring';
import { Application } from '../entities/Application';
import { Job } from '../entities/Job';
import { WorkContract } from '../entities/WorkContract';
import { HiringStatus, ContractStatus } from '../entities/enums';
import { ApiError } from '../utils/ApiError';
import { OwnershipService } from './OwnershipService';

export class HiringService {
  /**
   * Called only from ApplicationService.accept, inside the same DB
   * transaction. Creates the Hiring record AND the initial DRAFT
   * WorkContract in one shot (spec section 13: "Hiring -> DRAFT Work
   * Contract"), so a Hiring can never exist without its contract.
   *
   * All IDs used here are explicitly WorkerProfile.id / EmployerProfile.id
   * — never User.id — per spec rule 46.
   */
  static async createFromAcceptedApplication(
    manager: EntityManager,
    application: Application,
    job: Job
  ): Promise<Hiring> {
    const hiringRepo = manager.getRepository(Hiring);
    const contractRepo = manager.getRepository(WorkContract);

    const existing = await hiringRepo.findOne({ where: { applicationId: application.id } });
    if (existing) {
      throw ApiError.conflict('A hiring record already exists for this application');
    }

    const hiring = hiringRepo.create({
      applicationId: application.id,
      jobId: job.id,
      workerProfileId: application.workerProfileId, // WorkerProfile.id
      employerProfileId: job.employerProfileId, // EmployerProfile.id
      status: HiringStatus.CREATED,
    });
    const savedHiring = await hiringRepo.save(hiring);

    const contract = contractRepo.create({
      hiringId: savedHiring.id,
      workerProfileId: savedHiring.workerProfileId,
      employerProfileId: savedHiring.employerProfileId,
      compensationType: job.compensationType as any,
      // Rate snapshotted from the Job at hiring time so later edits to the
      // job posting never retroactively change an already-drafted contract.
      agreementRate: job.compensationRate,
      status: ContractStatus.DRAFT,
    });
    await contractRepo.save(contract);

    savedHiring.status = HiringStatus.CONTRACT_DRAFTED;
    return hiringRepo.save(savedHiring);
  }

  static async getMyHirings(userId: string, role: 'WORKER' | 'EMPLOYER') {
    const repo = AppDataSource.getRepository(Hiring);
    if (role === 'WORKER') {
      const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
      return repo.find({
        where: { workerProfileId: workerProfile.id },
        relations: ['job', 'employerProfile'],
        order: { createdAt: 'DESC' },
      });
    }
    const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
    return repo.find({
      where: { employerProfileId: employerProfile.id },
      relations: ['job', 'workerProfile'],
      order: { createdAt: 'DESC' },
    });
  }
}
