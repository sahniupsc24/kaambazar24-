import { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { ContactUnlock } from '../entities/ContactUnlock';
import { WorkerProfile } from '../entities/WorkerProfile';
import { EmployerProfile } from '../entities/EmployerProfile';
import { User } from '../entities/User';
import { PlanAudience, UnlockMethod } from '../entities/enums';
import { ApiError } from '../utils/ApiError';
import { AuditService } from './AuditService';
import { PlatformSettingService } from './PlatformSettingService';
import { QueryFailedError } from 'typeorm';

function isSubscriptionActive(expiresAt: Date | null): boolean {
  return !!expiresAt && expiresAt.getTime() > Date.now();
}

export interface UnlockResult {
  unlocked: true;
  method: UnlockMethod;
  mobile: string;
}
export interface UnlockNeedsPlan {
  unlocked: false;
  reason: 'PLAN_REQUIRED';
}

async function getTargetMobile(manager: EntityManager, targetUserId: string): Promise<string> {
  // Both WorkerProfile and EmployerProfile derive their contact number from
  // the linked User.phone (worker) or their own contactPhone (employer).
  const userRepo = manager.getRepository(User);
  const user = await userRepo.findOne({ where: { id: targetUserId } });
  if (user?.phone) return user.phone;

  const employerRepo = manager.getRepository(EmployerProfile);
  const employer = await employerRepo.findOne({ where: { userId: targetUserId } });
  return employer?.contactPhone ?? '';
}

export class ContactUnlockService {
  /**
   * Attempts to unlock `targetUserId`'s contact for `viewerUserId`.
   * Resolution order: already-unlocked -> free unlock -> active
   * subscription -> spare credit -> needs a plan purchase.
   *
   * The DB unique constraint on (viewerUserId, targetUserId) is the
   * authoritative guard against double-charging for the same contact,
   * mirroring the double-payment protection used elsewhere in this app.
   */
  static async unlock(
    viewerUserId: string,
    viewerRole: PlanAudience,
    targetUserId: string
  ): Promise<UnlockResult | UnlockNeedsPlan> {
    return AppDataSource.transaction(async (manager) => {
      const unlockRepo = manager.getRepository(ContactUnlock);

      const existing = await unlockRepo.findOne({ where: { viewerUserId, targetUserId } });
      if (existing) {
        const mobile = await getTargetMobile(manager, targetUserId);
        return { unlocked: true, method: existing.method, mobile };
      }

      const profileRepo =
        viewerRole === PlanAudience.WORKER
          ? manager.getRepository(WorkerProfile)
          : manager.getRepository(EmployerProfile);
      const profile = await profileRepo.findOne({ where: { userId: viewerUserId } });
      if (!profile) throw ApiError.notFound('Profile not found for the current account');

      let method: UnlockMethod | null = null;
      const amountCharged = '0';

      const enforceLimit = await PlatformSettingService.get('CONTACT_LIMIT_ENFORCEMENT') === 'true';
      const freeLimitStr = await PlatformSettingService.get('WORKER_FREE_CONTACT_LIMIT');
      const freeLimit = parseInt(freeLimitStr, 10) || 3;

      // Count existing FREE unlocks by this user
      const freeUnlocksUsed = await unlockRepo.count({
        where: { viewerUserId, method: UnlockMethod.FREE }
      });

      if (!enforceLimit || freeUnlocksUsed < freeLimit) {
        profile.usedFreeContactUnlock = true; // Kept for backwards compatibility
        method = UnlockMethod.FREE;
      } else if (isSubscriptionActive(profile.subscriptionExpiresAt)) {
        method = UnlockMethod.SUBSCRIPTION;
      } else if (profile.contactCredits > 0) {
        profile.contactCredits -= 1;
        method = UnlockMethod.CREDIT;
      }

      if (!method) {
        return { unlocked: false, reason: 'PLAN_REQUIRED' };
      }

      await (profileRepo as any).save(profile);

      try {
        await unlockRepo.save(
          unlockRepo.create({ viewerUserId, viewerRole, targetUserId, method, amountCharged })
        );
      } catch (err) {
        if (err instanceof QueryFailedError) {
          const mobile = await getTargetMobile(manager, targetUserId);
          return { unlocked: true, method, mobile };
        }
        throw err;
      }

      if (viewerRole === PlanAudience.EMPLOYER) {
        const workerRepo = manager.getRepository(WorkerProfile);
        const targetWorker = await workerRepo.findOne({ where: { userId: targetUserId } });
        if (targetWorker) {
          targetWorker.timesContacted += 1;
          await workerRepo.save(targetWorker);
        }
      }

      await AuditService.log({
        actorUserId: viewerUserId,
        actorRole: viewerRole,
        action: 'CONTACT_UNLOCKED',
        entityType: 'ContactUnlock',
        entityId: targetUserId,
        metadata: { method },
      });

      const mobile = await getTargetMobile(manager, targetUserId);
      return { unlocked: true, method, mobile };
    });
  }

  static async isUnlocked(viewerUserId: string, targetUserId: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(ContactUnlock);
    const existing = await repo.findOne({ where: { viewerUserId, targetUserId } });
    return !!existing;
  }
}
