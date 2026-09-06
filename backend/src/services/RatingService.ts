import { AppDataSource } from '../config/data-source';
import { ContractRating } from '../entities/ContractRating';
import { WorkContract } from '../entities/WorkContract';
import { ReputationSummary } from '../entities/ReputationSummary';
import { WorkerProfile } from '../entities/WorkerProfile';
import { EmployerProfile } from '../entities/EmployerProfile';
import { ContractStatus, RaterRole } from '../entities/enums';
import { OwnershipService } from './OwnershipService';
import { ApiError } from '../utils/ApiError';
import { AuditService } from './AuditService';
import { QueryFailedError } from 'typeorm';

async function recomputeReputation(userId: string) {
  const ratingRepo = AppDataSource.getRepository(ContractRating);
  const summaryRepo = AppDataSource.getRepository(ReputationSummary);

  const ratings = await ratingRepo.find({ where: { ratedUserId: userId, isRemovedByAdmin: false } });

  let summary = await summaryRepo.findOne({ where: { userId } });
  if (!summary) summary = summaryRepo.create({ userId });

  summary.totalRatings = ratings.length;
  summary.fiveStarCount = ratings.filter((r) => r.score === 5).length;
  summary.fourStarCount = ratings.filter((r) => r.score === 4).length;
  summary.threeStarCount = ratings.filter((r) => r.score === 3).length;
  summary.twoStarCount = ratings.filter((r) => r.score === 2).length;
  summary.oneStarCount = ratings.filter((r) => r.score === 1).length;
  summary.averageScore = ratings.length
    ? (ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length).toFixed(2)
    : '0';
  summary.lastRecalculatedAt = new Date();

  await summaryRepo.save(summary);
}

export class RatingService {
  static async submit(
    userId: string,
    role: 'WORKER' | 'EMPLOYER',
    contractId: string,
    score: number,
    comment?: string
  ) {
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw ApiError.badRequest('score must be an integer between 1 and 5');
    }

    const contractRepo = AppDataSource.getRepository(WorkContract);
    const contract = await contractRepo.findOne({ where: { id: contractId } });
    if (!contract) throw ApiError.notFound('Contract not found');

    // Eligibility (spec section 22): only COMPLETED or TERMINATED contracts.
    if (contract.status !== ContractStatus.COMPLETED && contract.status !== ContractStatus.TERMINATED) {
      throw ApiError.badRequest('Ratings are only allowed once a contract is COMPLETED or TERMINATED');
    }

    let ratedUserId: string;
    if (role === 'WORKER') {
      const workerProfile = await OwnershipService.resolveWorkerProfile(userId);
      OwnershipService.assertOwns(contract.workerProfileId, workerProfile.id, 'contract');
      // Rated party is the employer's account owner.
      const employerRepo = AppDataSource.getRepository(EmployerProfile);
      const employer = await employerRepo.findOne({ where: { id: contract.employerProfileId } });
      if (!employer) throw ApiError.notFound('Employer profile not found');
      ratedUserId = employer.userId;
    } else {
      const employerProfile = await OwnershipService.resolveEmployerProfile(userId);
      OwnershipService.assertOwns(contract.employerProfileId, employerProfile.id, 'contract');
      const workerRepo = AppDataSource.getRepository(WorkerProfile);
      const worker = await workerRepo.findOne({ where: { id: contract.workerProfileId } });
      if (!worker) throw ApiError.notFound('Worker profile not found');
      ratedUserId = worker.userId;
    }

    const ratingRepo = AppDataSource.getRepository(ContractRating);
    const rating = ratingRepo.create({
      contractId,
      raterUserId: userId,
      raterRole: role === 'WORKER' ? RaterRole.WORKER : RaterRole.EMPLOYER,
      ratedUserId,
      score,
      comment: comment ?? null,
    });

    let saved: ContractRating;
    try {
      // DB-level UNIQUE(contractId, raterUserId) is the authoritative
      // duplicate-rating guard (spec section 23).
      saved = await ratingRepo.save(rating);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        throw ApiError.conflict('You have already submitted a rating for this contract');
      }
      throw err;
    }

    await recomputeReputation(ratedUserId);

    await AuditService.log({
      actorUserId: userId, actorRole: role, action: 'RATING_SUBMITTED',
      entityType: 'ContractRating', entityId: saved.id,
    });

    return saved;
  }

  static async getForContract(contractId: string) {
    const repo = AppDataSource.getRepository(ContractRating);
    return repo.find({ where: { contractId, isRemovedByAdmin: false } });
  }

  static async getReputation(userId: string) {
    const repo = AppDataSource.getRepository(ReputationSummary);
    return repo.findOne({ where: { userId } });
  }

  // Admin-only moderation action.
  static async adminRemove(ratingId: string, reason: string) {
    const repo = AppDataSource.getRepository(ContractRating);
    const rating = await repo.findOne({ where: { id: ratingId } });
    if (!rating) throw ApiError.notFound('Rating not found');

    rating.isRemovedByAdmin = true;
    rating.adminRemovalReason = reason;
    const saved = await repo.save(rating);
    await recomputeReputation(rating.ratedUserId);
    return saved;
  }
}
