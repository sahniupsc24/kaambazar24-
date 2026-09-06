import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { Payment } from './Payment';
import { WorkEntry } from './WorkEntry';

@Entity('payment_work_entries')
// MANDATORY per spec section 18 — a work entry may only ever be linked to
// one payment record. This is the actual enforcement point; the
// "only unsettled approved work entries can be selected" check in the
// service layer is a defense-in-depth application-level guard, not the
// source of truth.
@Unique('UQ_payment_work_entries_workEntryId', ['workEntryId'])
export class PaymentWorkEntry extends AppBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  paymentId!: string;

  @ManyToOne(() => Payment, (p) => p.workEntryLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment!: Payment;

  @Column({ type: 'uuid' })
  workEntryId!: string;

  @ManyToOne(() => WorkEntry, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workEntryId' })
  workEntry!: WorkEntry;

  // Snapshot of the amount attributed to this specific entry at settlement
  // time, so a payment covering multiple entries can show a breakdown.
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amountForEntry!: string;
}
