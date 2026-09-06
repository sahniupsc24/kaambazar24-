import { Entity, Column, OneToOne, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { UserRole } from './enums';

@Entity('users')
export class User extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone!: string | null;

  // Only ever set for ADMIN/SUPER_ADMIN accounts, which log in through the
  // separate /auth/admin-login endpoint via username-or-email + password.
  // Workers/Employers never have this set.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  username!: string | null;

  // Never selected by default — see repository queries which explicitly
  // .addSelect('user.passwordHash') only where needed (login/change-password).
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl!: string | null;

  // Reverse relations are declared lazily via string-typed imports in the
  // profile entities themselves (WorkerProfile.user / EmployerProfile.user)
  // to avoid circular import issues at module-load time.
}
