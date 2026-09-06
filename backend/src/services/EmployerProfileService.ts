import { AppDataSource } from '../config/data-source';
import { EmployerProfile } from '../entities/EmployerProfile';
import { OwnershipService } from './OwnershipService';

import { User } from '../entities/User';

export interface UpdateEmployerProfileInput {
  businessName?: string;
  businessDescription?: string;
  contactPersonName?: string;
  contactPhone?: string;
  primaryCategoryId?: string | null;
  locationId?: string | null;
  address?: string;
}

function computeIsComplete(p: EmployerProfile): boolean {
  return Boolean(p.businessName && p.primaryCategoryId && p.locationId && p.contactPhone);
}

export class EmployerProfileService {
  static async getMyProfile(userId: string) {
    return OwnershipService.resolveEmployerProfile(userId);
  }

  static async updateMyProfile(userId: string, updates: UpdateEmployerProfileInput & { email?: string; avatarUrl?: string }) {
    const repo = AppDataSource.getRepository(EmployerProfile);
    const profile = await OwnershipService.resolveEmployerProfile(userId);

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

    return repo.save(profile);
  }

  // Public-safe view — excludes anything not meant to be shown to job seekers.
  static async getPublicById(id: string) {
    const repo = AppDataSource.getRepository(EmployerProfile);
    const profile = await repo.findOne({ where: { id }, relations: ['primaryCategory', 'location'] });
    if (!profile) return null;
    const { businessName, businessDescription, primaryCategory, location, isVerified } = profile;
    return { id: profile.id, businessName, businessDescription, primaryCategory, location, isVerified };
  }
}
