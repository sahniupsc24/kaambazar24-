import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { WorkContract } from './WorkContract';
import { PaymentStatus } from './enums';
import { PaymentWorkEntry } from './PaymentWorkEntry';

@Entity('payments')
export class Payment extends AppBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  contractId!: string;

  @ManyToOne(() => WorkContract, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contractId' })
  contract!: WorkContract;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @Index()
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference!: string | null;

  @Column({ type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @Column({ type: 'uuid' })
  createdByUserId!: string;

  @OneToMany(() => PaymentWorkEntry, (pwe) => pwe.payment)
  workEntryLinks!: PaymentWorkEntry[];
}
