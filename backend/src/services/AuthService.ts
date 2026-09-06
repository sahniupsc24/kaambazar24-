import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { WorkerProfile } from '../entities/WorkerProfile';
import { EmployerProfile } from '../entities/EmployerProfile';
import { UserRole } from '../entities/enums';
import { OtpPurpose } from '../entities/OtpRecord';
import { ApiError } from '../utils/ApiError';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuditService } from './AuditService';
import { OtpService } from './OtpService';

export interface RegisterInput {
  email: string;
  password: string;
  phone?: string;
  role: UserRole.WORKER | UserRole.EMPLOYER; // admins are never self-registered
  fullNameOrBusinessName: string;
}

export class AuthService {
  static async register(input: RegisterInput) {
    return AppDataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);

      const existing = await userRepo.findOne({ where: { email: input.email } });
      if (existing) {
        throw ApiError.conflict('An account with this email already exists');
      }

      const passwordHash = await hashPassword(input.password);

      const user = userRepo.create({
        email: input.email,
        phone: input.phone ?? null,
        passwordHash,
        role: input.role, // Only ever WORKER or EMPLOYER from public registration
        isActive: true,
      });
      await userRepo.save(user);

      // Every WORKER/EMPLOYER user gets exactly one corresponding profile
      // row created atomically with the account — this is what makes
      // OwnershipService.resolveWorkerProfile/resolveEmployerProfile safe
      // to assume "exists" once past onboarding.
      if (input.role === UserRole.WORKER) {
        const workerRepo = manager.getRepository(WorkerProfile);
        await workerRepo.save(
          workerRepo.create({ userId: user.id, fullName: input.fullNameOrBusinessName })
        );
      } else {
        const employerRepo = manager.getRepository(EmployerProfile);
        await employerRepo.save(
          employerRepo.create({ userId: user.id, businessName: input.fullNameOrBusinessName })
        );
      }

      await AuditService.log({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user.id,
      });

      return AuthService.issueTokens(user);
    });
  }

  /**
   * Password login for all accounts (WORKER, EMPLOYER, ADMIN, SUPER_ADMIN).
   * `identifier` may be an email, phone number, or username.
   */
  static async login(identifier: string, password: string) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :identifier OR user.phone = :identifier OR user.username = :identifier', { identifier })
      .getOne();

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('This account has been deactivated');
    }

    user.lastLoginAt = new Date();
    await userRepo.save(user);

    await AuditService.log({
      actorUserId: user.id, actorRole: user.role, action: 'USER_LOGIN_PASSWORD',
      entityType: 'User', entityId: user.id,
    });

    return AuthService.issueTokens(user);
  }

  /**
   * Admin/Super Admin password login — deliberately a separate code path
   * (and a separate frontend route/page) from worker/employer login.
   * Accepts a username or email as the identifier. Never accepts OTP.
   */
  static async adminLogin(identifier: string, password: string) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('(user.email = :identifier OR user.username = :identifier)', { identifier })
      .andWhere('user.role IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
      .getOne();

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw ApiError.unauthorized('Invalid admin credentials');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('This admin account has been deactivated');
    }

    user.lastLoginAt = new Date();
    await userRepo.save(user);

    await AuditService.log({
      actorUserId: user.id, actorRole: user.role, action: 'ADMIN_LOGIN',
      entityType: 'User', entityId: user.id,
    });

    return AuthService.issueTokens(user);
  }

  /** Step 1 of OTP login: send a code to an already-registered phone number. */
  static async requestLoginOtp(phone: string) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { phone } });
    if (!user) throw ApiError.notFound('No account found with this phone number');
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      throw ApiError.forbidden('Admin accounts must use the admin login page');
    }
    if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

    const code = await OtpService.requestOtp(phone, OtpPurpose.LOGIN);
    return { phone, mockCode: code };
  }

  /** Step 2 of OTP login: verify the code and issue tokens. */
  static async verifyLoginOtp(phone: string, code: string) {
    await OtpService.verifyOtp(phone, OtpPurpose.LOGIN, code);

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { phone } });
    if (!user) throw ApiError.notFound('No account found with this phone number');

    user.isPhoneVerified = true;
    user.lastLoginAt = new Date();
    await userRepo.save(user);

    await AuditService.log({
      actorUserId: user.id, actorRole: user.role, action: 'USER_LOGIN_OTP',
      entityType: 'User', entityId: user.id,
    });

    return AuthService.issueTokens(user);
  }

  /** Forgot Password Step 1: Request Password Reset OTP */
  static async requestPasswordResetOtp(identifier: string) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: [{ email: identifier }, { phone: identifier }, { username: identifier }],
    });
    if (!user) throw ApiError.notFound('Account not found with this email or phone');
    if (!user.isActive) throw ApiError.forbidden('This account is deactivated');

    const target = user.phone || user.email;
    const code = await OtpService.requestOtp(target, OtpPurpose.PASSWORD_RESET);
    return { target, mockCode: code };
  }

  /** Forgot Password Step 2: Verify OTP & Update Password */
  static async resetPasswordWithOtp(identifier: string, code: string, newPassword: string) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: [{ email: identifier }, { phone: identifier }, { username: identifier }],
    });
    if (!user) throw ApiError.notFound('Account not found');

    const target = user.phone || user.email;
    await OtpService.verifyOtp(target, OtpPurpose.PASSWORD_RESET, code);

    user.passwordHash = await hashPassword(newPassword);
    await userRepo.save(user);

    await AuditService.log({
      actorUserId: user.id, actorRole: user.role, action: 'PASSWORD_RESET_SUCCESS',
      entityType: 'User', entityId: user.id,
    });

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }

  static async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Account not found or inactive');
    }
    // Re-derive role from DB on every refresh, same discipline as login.
    return AuthService.issueTokens(user);
  }

  private static issueTokens(user: User) {
    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}
