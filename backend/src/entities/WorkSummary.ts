import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { WorkContract } from './WorkContract';

/**
 * Denormalized per-contract rollup, recomputed by WorkEntryService whenever
 * an entry is approved/rejected. Exists purely to make dashboard queries
 * (worker "My Work" totals, employer "Work Review" totals) O(1) instead of
 * aggregating work_entries on every page load.
 */
@Entity('work_summaries')
export class WorkSummary extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  contractId!: string;

  @OneToOne(() => WorkContract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract!: WorkContract;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalHoursSubmitted!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalHoursApproved!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalHoursRejected!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalHoursSettled!: string;

  @Column({ type: 'int', default: 0 })
  pendingEntryCount!: number;
}
