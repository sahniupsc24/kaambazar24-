import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { EmployerProfile } from './EmployerProfile';
import { Category } from './Category';
import { Location } from './Location';
import { JobStatus, WorkType, CompensationType, AadhaarPreference, AadhaarOverride } from './enums';

@Entity('jobs')
export class Job extends AppBaseEntity {
  // Ownership anchor for all "is this my job" checks.
  @Index()
  @Column({ type: 'uuid' })
  employerProfileId!: string;

  @ManyToOne(() => EmployerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employerProfileId' })
  employerProfile!: EmployerProfile;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  requirements!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Index()
  @Column({ type: 'uuid' })
  locationId!: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'locationId' })
  location!: Location;

  @Column({ type: 'enum', enum: WorkType, default: WorkType.GIG })
  workType!: WorkType;

  @Column({ type: 'enum', enum: CompensationType, default: CompensationType.DAILY })
  compensationType!: CompensationType;

  // Rate is the agreed unit rate used later for HOURLY payment calc
  // (approvedHours * agreementRate). For non-hourly jobs it's advisory/display.
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  compensationRate!: string;

  @Column({ type: 'int', default: 1 })
  openings!: number;

  @Index()
  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.OPEN })
  status!: JobStatus;

  @Column({ type: 'timestamptz', nullable: true })
  applicationDeadline!: Date | null;

  // --- Featured listing (admin-priced, buyer-purchased) ---
  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  featuredUntil!: Date | null;

  // --- Aadhaar requirement: buyer sets a preference at post time; admin
  // can force MANDATORY or OPTIONAL on any specific job regardless of what
  // the buyer chose (spec: buyer proposes, admin has final control and can
  // change it later even after the job is live). NULL override = defer to
  // the buyer's preference. See JobService.isAadhaarRequired for the
  // resolution logic used everywhere else in the app. ---
  @Column({ type: 'enum', enum: AadhaarPreference, default: AadhaarPreference.NOT_REQUIRED })
  aadhaarBuyerPreference!: AadhaarPreference;

  @Column({ type: 'enum', enum: AadhaarOverride, nullable: true })
  aadhaarAdminOverride!: AadhaarOverride | null;
}
