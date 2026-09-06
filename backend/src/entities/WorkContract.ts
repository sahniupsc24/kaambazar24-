import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { Hiring } from './Hiring';
import { WorkerProfile } from './WorkerProfile';
import { EmployerProfile } from './EmployerProfile';
import { ContractStatus, CompensationType } from './enums';

@Entity('work_contracts')
export class WorkContract extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  hiringId!: string;

  @ManyToOne(() => Hiring, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'hiringId' })
  hiring!: Hiring;

  @Index()
  @Column({ type: 'uuid' })
  workerProfileId!: string;

  @ManyToOne(() => WorkerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workerProfileId' })
  workerProfile!: WorkerProfile;

  @Index()
  @Column({ type: 'uuid' })
  employerProfileId!: string;

  @ManyToOne(() => EmployerProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employerProfileId' })
  employerProfile!: EmployerProfile;

  @Column({ type: 'enum', enum: CompensationType })
  compensationType!: CompensationType;

  // The rate used by PaymentService for HOURLY calculations
  // (approvedHours * agreementRate). Snapshotted from the Job at contract
  // creation time so later Job edits never retroactively change signed terms.
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  agreementRate!: string;

  @Column({ type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ type: 'date', nullable: true })
  endDate!: string | null;

  @Index()
  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.DRAFT })
  status!: ContractStatus;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  workerAcceptedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  terminatedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  terminationReason!: string | null;
}
