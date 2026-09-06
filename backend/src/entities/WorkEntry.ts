import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { WorkContract } from './WorkContract';
import { WorkEntryStatus } from './enums';

@Entity('work_entries')
// A worker can only have one entry per contract per calendar day —
// corrections re-use the same row (SUBMITTED -> CORRECTING -> SUBMITTED)
// rather than creating duplicate rows for the same work date.
@Unique('UQ_work_entry_contract_date', ['contractId', 'workDate'])
export class WorkEntry extends AppBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  contractId!: string;

  @ManyToOne(() => WorkContract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract!: WorkContract;

  @Column({ type: 'date' })
  workDate!: string;

  // Validated in the service layer: > 0 and <= 24. Enforced again here via
  // a CHECK constraint added in the migration for defense in depth.
  @Column({ type: 'numeric', precision: 5, scale: 2 })
  hoursWorked!: string;

  @Column({ type: 'text', nullable: true })
  workerNotes!: string | null;

  // Visible to employer/admin only — never returned to the worker in API responses.
  @Column({ type: 'text', nullable: true })
  employerInternalNote!: string | null;

  @Index()
  @Column({ type: 'enum', enum: WorkEntryStatus, default: WorkEntryStatus.SUBMITTED })
  status!: WorkEntryStatus;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId!: string | null;

  // Set true once a Payment successfully links this entry via
  // PaymentWorkEntry — the authoritative double-payment guard is the DB
  // unique constraint on payment_work_entries.workEntryId, this flag is a
  // fast read-path check.
  @Column({ type: 'boolean', default: false })
  isSettled!: boolean;

  // --- Phase 5: GPS Geolocation fields for field-ops check-in tracking ---
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkInLat!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkInLng!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkOutLat!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkOutLng!: number | null;

  @Column({ type: 'float', nullable: true })
  checkInAccuracy!: number | null;

  @Column({ type: 'text', nullable: true })
  checkInAddress!: string | null;
}
