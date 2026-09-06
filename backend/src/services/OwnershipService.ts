import { AppDataSource } from '../config/data-source';
import { WorkerProfile } from '../entities/WorkerProfile';
import { EmployerProfile } from '../entities/EmployerProfile';
import { ApiError } from '../utils/ApiError';

/**
 * Every controller/service that needs "the current worker's profile" or
 * "the current employer's profile" MUST go through these functions.
 * Never accept a workerProfileId / employerProfileId from the request body
 * or query string as the acting identity — only as a target to be
 * cross-checked against the value resolved here.
 */
export class OwnershipService {
  static async resolveWorkerProfile(userId: string): Promise<WorkerProfile> {
    const repo = AppDataSource.getRepository(WorkerProfile);
    const profile = await repo.findOne({ where: { userId }, relations: ['user', 'primaryCategory', 'location'] });
    if (!profile) {
      throw ApiError.notFound('Worker profile not found for the current account');
    }
    return profile;
  }

  static async resolveEmployerProfile(userId: string): Promise<EmployerProfile> {
    const repo = AppDataSource.getRepository(EmployerProfile);
    const profile = await repo.findOne({ where: { userId }, relations: ['user', 'primaryCategory', 'location'] });
    if (!profile) {
      throw ApiError.notFound('Employer profile not found for the current account');
    }
    return profile;
  }

  /** Throws 403 if the resource's owning profile id doesn't match the caller's own profile id. */
  static assertOwns(ownerProfileId: string, callerProfileId: string, resourceName = 'resource') {
    if (ownerProfileId !== callerProfileId) {
      throw ApiError.forbidden(`You do not have access to this ${resourceName}`);
    }
  }
}
