import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { Job } from '../entities/Job';
import { Application } from '../entities/Application';
import { Hiring } from '../entities/Hiring';
import { WorkContract } from '../entities/WorkContract';
import { WorkEntry } from '../entities/WorkEntry';
import { Payment } from '../entities/Payment';
import { ContractRating } from '../entities/ContractRating';
import { AuditLog } from '../entities/AuditLog';
import { ApiError } from '../utils/ApiError';
import { AuditService } from './AuditService';

export class AdminService {
  // Never selects passwordHash — the User entity already defaults that
  // column to select:false, so a plain find() is safe by construction.
  static async listUsers(page = 1, pageSize = 25) {
    const repo = AppDataSource.getRepository(User);
    const [items, total] = await repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: Math.min(pageSize, 100),
    });
    return { items, total, page, pageSize };
  }

  static async getUserById(id: string) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id } });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async setUserActiveStatus(adminUserId: string, targetUserId: string, isActive: boolean) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: targetUserId } });
    if (!user) throw ApiError.notFound('User not found');

    user.isActive = isActive;
    const saved = await repo.save(user);

    await AuditService.log({
      actorUserId: adminUserId,
      actorRole: 'ADMIN',
      action: isActive ? 'ADMIN_USER_REACTIVATED' : 'ADMIN_USER_DEACTIVATED',
      entityType: 'User',
      entityId: user.id,
    });

    return saved;
  }

  static async deleteUser(adminUserId: string, targetUserId: string) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: targetUserId } });
    if (!user) throw ApiError.notFound('User not found');
    if (user.id === adminUserId) throw ApiError.badRequest('Cannot delete your own account');
    await repo.remove(user);
    await AuditService.log({ actorUserId: adminUserId, actorRole: 'ADMIN', action: 'ADMIN_USER_DELETED', entityType: 'User', entityId: targetUserId });
  }

  static async resetUserPassword(adminUserId: string, targetUserId: string, newPassword: string) {
    const { hashPassword } = await import('../utils/password');
    const repo = AppDataSource.getRepository(User);
    const user = await repo.createQueryBuilder('u').addSelect('u.passwordHash').where('u.id = :id', { id: targetUserId }).getOne();
    if (!user) throw ApiError.notFound('User not found');
    user.passwordHash = await hashPassword(newPassword);
    await repo.save(user);
    await AuditService.log({ actorUserId: adminUserId, actorRole: 'ADMIN', action: 'ADMIN_PASSWORD_RESET', entityType: 'User', entityId: targetUserId });
  }

  static async updateUserAndProfile(adminUserId: string, targetUserId: string, updates: any) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw ApiError.notFound('User not found');

    if (updates.email) user.email = updates.email;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.role) user.role = updates.role;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;

    await userRepo.save(user);

    const { WorkerProfile } = await import('../entities/WorkerProfile');
    const { EmployerProfile } = await import('../entities/EmployerProfile');
    const wpRepo = AppDataSource.getRepository(WorkerProfile);
    const epRepo = AppDataSource.getRepository(EmployerProfile);

    const workerProfile = await wpRepo.findOne({ where: { userId: targetUserId } });
    if (workerProfile && updates.workerProfile) {
      Object.assign(workerProfile, updates.workerProfile);
      await wpRepo.save(workerProfile);
    }

    const employerProfile = await epRepo.findOne({ where: { userId: targetUserId } });
    if (employerProfile && updates.employerProfile) {
      Object.assign(employerProfile, updates.employerProfile);
      await epRepo.save(employerProfile);
    }

    await AuditService.log({
      actorUserId: adminUserId,
      actorRole: 'ADMIN',
      action: 'ADMIN_USER_EDITED',
      entityType: 'User',
      entityId: user.id,
    });

    return AdminService.getUserById(targetUserId);
  }



  static async getJobById(id: string) {
    const repo = AppDataSource.getRepository(Job);
    const job = await repo.findOne({
      where: { id },
      relations: ['employerProfile', 'category', 'location', 'applications', 'applications.workerProfile'],
    });
    if (!job) throw ApiError.notFound('Job not found');
    return job;
  }

  static async deleteJob(adminUserId: string, jobId: string) {
    const repo = AppDataSource.getRepository(Job);
    const job = await repo.findOne({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    await repo.remove(job);
    await AuditService.log({ actorUserId: adminUserId, actorRole: 'ADMIN', action: 'ADMIN_JOB_DELETED', entityType: 'Job', entityId: jobId });
  }

  static async getContactUnlocks(page = 1, pageSize = 50) {
    const { ContactUnlock } = await import('../entities/ContactUnlock');
    return AdminService.paginate(ContactUnlock, page, pageSize, ['employer', 'worker']);
  }

  // Monitoring endpoints — read-only oversight across every core entity.
  static async monitorJobs(page = 1, pageSize = 25) {
    return AdminService.paginate(Job, page, pageSize, ['employerProfile', 'category', 'location']);
  }
  static async monitorApplications(page = 1, pageSize = 25) {
    return AdminService.paginate(Application, page, pageSize, ['job', 'workerProfile']);
  }
  static async monitorHirings(page = 1, pageSize = 25) {
    return AdminService.paginate(Hiring, page, pageSize, ['job', 'workerProfile', 'employerProfile']);
  }
  static async monitorContracts(page = 1, pageSize = 25) {
    return AdminService.paginate(WorkContract, page, pageSize, ['workerProfile', 'employerProfile']);
  }
  static async monitorWorkEntries(page = 1, pageSize = 25) {
    return AdminService.paginate(WorkEntry, page, pageSize, ['contract']);
  }
  static async monitorPayments(page = 1, pageSize = 25) {
    return AdminService.paginate(Payment, page, pageSize, ['contract']);
  }
  static async monitorRatings(page = 1, pageSize = 25) {
    return AdminService.paginate(ContractRating, page, pageSize, ['contract']);
  }

  static async listWorkers(page = 1, pageSize = 25) {
    const { WorkerProfile } = await import('../entities/WorkerProfile');
    return AdminService.paginate(WorkerProfile, page, pageSize, ['user', 'primaryCategory', 'location']);
  }

  static async listBuyers(page = 1, pageSize = 25) {
    const { EmployerProfile } = await import('../entities/EmployerProfile');
    return AdminService.paginate(EmployerProfile, page, pageSize, ['user', 'primaryCategory', 'location']);
  }

  static async getDashboardStats() {
    const userRepo = AppDataSource.getRepository(User);
    const jobRepo = AppDataSource.getRepository(Job);
    const contractRepo = AppDataSource.getRepository(WorkContract);
    const paymentRepo = AppDataSource.getRepository(Payment);
    const { WorkerProfile } = await import('../entities/WorkerProfile');
    const { EmployerProfile } = await import('../entities/EmployerProfile');

    const totalUsers = await userRepo.count();
    const totalWorkers = await AppDataSource.getRepository(WorkerProfile).count();
    const totalEmployers = await AppDataSource.getRepository(EmployerProfile).count();
    const totalJobs = await jobRepo.count();
    const activeJobs = await jobRepo.count({ where: { status: 'OPEN' as any } });
    const activeContracts = await contractRepo.count({ where: { status: 'ACTIVE' as any } });

    const payments = await paymentRepo.find({ where: { status: 'PAID' as any } });
    const totalRevenue = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

    return {
      totalUsers,
      totalWorkers,
      totalEmployers,
      totalJobs,
      activeJobs,
      activeContracts,
      totalRevenue: totalRevenue.toFixed(2),
    };
  }

  static async getAuditLogs(page = 1, pageSize = 50) {
    const repo = AppDataSource.getRepository(AuditLog);
    const [items, total] = await repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: Math.min(pageSize, 200),
    });
    return { items, total, page, pageSize };
  }

  private static async paginate<T extends object>(
    entity: new () => T,
    page: number,
    pageSize: number,
    relations: string[]
  ) {
    const repo = AppDataSource.getRepository(entity);
    const [items, total] = await repo.findAndCount({
      order: { createdAt: 'DESC' } as any,
      skip: (page - 1) * pageSize,
      take: Math.min(pageSize, 100),
      relations,
    });
    return { items, total, page, pageSize };
  }
}
