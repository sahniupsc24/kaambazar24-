import { Entity, Column, OneToOne, JoinColumn, ManyToOne, ManyToMany, JoinTable, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { User } from './User';
import { Category } from './Category';
import { Location } from './Location';

@Entity('worker_profiles')
export class WorkerProfile extends AppBaseEntity {
  // Ownership anchor. Every "is this mine" check in the service layer starts
  // from `WorkerProfile.userId === req.user.id`, never from a client-sent id.
  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'int', default: 0 })
  experienceYears!: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  skills!: string[];

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  primaryCategory!: Category | null;

  @Column({ type: 'uuid', nullable: true })
  primaryCategoryId!: string | null;

  @ManyToOne(() => Location, { nullable: true, onDelete: 'SET NULL' })
  location!: Location | null;

  @Column({ type: 'uuid', nullable: true })
  locationId!: string | null;

  @ManyToMany(() => Category)
  @JoinTable({ name: 'worker_profile_categories' })
  additionalCategories!: Category[];

  @Column({ type: 'boolean', default: false })
  isProfileComplete!: boolean;

  @Column({ type: 'boolean', default: false })
  isAvailable!: boolean;

  // --- Verification (admin-managed, see VerificationService) ---
  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  // Set whenever admin removes a previously-granted verification (e.g. a
  // refund/dispute case) — kept for audit/context, cleared on re-approval.
  @Column({ type: 'text', nullable: true })
  verificationNote!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  aadhaarNumber!: string | null;

  @Column({ type: 'text', nullable: true })
  aadhaarFrontUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  aadhaarBackUrl!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'UNSUBMITTED' })
  aadhaarStatus!: 'UNSUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

  @Column({ type: 'timestamptz', nullable: true })
  aadhaarSubmittedAt!: Date | null;

  // --- Contact-unlock monetization state (mirrors EmployerProfile) ---
  @Column({ type: 'boolean', default: false })
  usedFreeContactUnlock!: boolean;

  @Column({ type: 'int', default: 0 })
  contactCredits!: number;

  @Column({ type: 'timestamptz', nullable: true })
  subscriptionExpiresAt!: Date | null;

  // Denormalized counter: how many buyers have unlocked this worker's
  // contact. Source of truth is the ContactUnlock table; this is a
  // fast-read cache incremented by ContactUnlockService.
  @Column({ type: 'int', default: 0 })
  timesContacted!: number;
}
