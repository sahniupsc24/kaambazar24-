import { AppDataSource } from '../config/data-source';
import { OtpRecord, OtpPurpose } from '../entities/OtpRecord';
import { ApiError } from '../utils/ApiError';
import { hashPassword, comparePassword } from '../utils/password';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, OTP_LENGTH);
}

export class OtpService {
  /**
   * "Sends" an OTP for the given phone number. No real SMS gateway is
   * wired up yet — this logs the code to the server console so the flow
   * is fully testable locally. Swap the console.log line for a real
   * provider (MSG91, Twilio, etc.) when one is chosen; nothing else in
   * the auth flow needs to change.
   */
  static async requestOtp(identifier: string, purpose: OtpPurpose): Promise<string> {
    const repo = AppDataSource.getRepository(OtpRecord);
    const code = generateOtp();
    const codeHash = await hashPassword(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await repo.save(
      repo.create({ identifier, codeHash, purpose, expiresAt, attemptCount: 0, isUsed: false })
    );

    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MOCK SMS] OTP for ${identifier}: ${code} (expires in ${OTP_TTL_MINUTES} min)`);
    }
    return code;
  }

  static async verifyOtp(identifier: string, purpose: OtpPurpose, code: string): Promise<void> {
    const repo = AppDataSource.getRepository(OtpRecord);
    const record = await repo
      .createQueryBuilder('otp')
      .addSelect('otp.codeHash')
      .where('otp.identifier = :identifier', { identifier })
      .andWhere('otp.purpose = :purpose', { purpose })
      .andWhere('otp.isUsed = false')
      .orderBy('otp.createdAt', 'DESC')
      .getOne();

    if (!record) throw ApiError.badRequest('No pending OTP for this number. Please request a new one.');
    if (record.expiresAt < new Date()) throw ApiError.badRequest('This OTP has expired. Please request a new one.');
    if (record.attemptCount >= MAX_ATTEMPTS) throw ApiError.badRequest('Too many incorrect attempts. Please request a new OTP.');

    const isValid = await comparePassword(code, record.codeHash);
    if (!isValid) {
      record.attemptCount += 1;
      await repo.save(record);
      throw ApiError.badRequest('Incorrect OTP');
    }

    record.isUsed = true;
    await repo.save(record);
  }
}
