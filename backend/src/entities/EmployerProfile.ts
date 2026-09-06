import { Entity, Column, OneToOne, JoinColumn, ManyToOne, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { User } from './User';
import { Category } from './Category';
import { Location } from './Location';

@Entity('employer_profiles')
export class EmployerProfile extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 200 })
  businessName!: string;

  @Column({ type: 'text', nullable: true })
  businessDescription!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactPersonName!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone!: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  primaryCategory!: Category | null;

  @Column({ type: 'uuid', nullable: true })
  primaryCategoryId!: string | null;

  @ManyToOne(() => Location, { nullable: true, onDelete: 'SET NULL' })
  location!: Location | null;

  @Column({ type: 'uuid', nullable: true })
  locationId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'text', nullable: true })
  verificationNote!: string | null;

  @Column({ type: 'boolean', default: false })
  isProfileComplete!: boolean;

  // --- Contact-unlock monetization state (mirrors WorkerProfile) ---
  @Column({ type: 'boolean', default: false })
  usedFreeContactUnlock!: boolean;

  @Column({ type: 'int', default: 0 })
  contactCredits!: number;

  @Column({ type: 'timestamptz', nullable: true })
  subscriptionExpiresAt!: Date | null;

  // Running total of simulated/real spend on plans + featured listings —
  // shown to admin in the verification detail view.
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalSpend!: string;
}
