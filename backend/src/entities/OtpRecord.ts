import { Entity, Column, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';

export enum OtpPurpose {
  REGISTRATION = 'REGISTRATION',
  LOGIN = 'LOGIN',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
}

@Entity('otp_records')
export class OtpRecord extends AppBaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255 })
  identifier!: string; // email or phone the OTP was issued for

  // Never store the raw OTP — only a bcrypt/HMAC hash, same discipline as
  // passwords. Never selected by default; never returned in API responses.
  @Column({ type: 'varchar', length: 255, select: false })
  codeHash!: string;

  @Column({ type: 'enum', enum: OtpPurpose })
  purpose!: OtpPurpose;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'int', default: 0 })
  attemptCount!: number;

  @Column({ type: 'boolean', default: false })
  isUsed!: boolean;
}
