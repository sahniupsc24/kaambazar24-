import { Entity, Column, Index, Unique } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { UnlockMethod, PlanAudience } from './enums';

@Entity('contact_unlocks')
// A viewer only ever needs to unlock a given target once — re-unlocking
// the same target must never charge again. This constraint is the
// authoritative guard; ContactUnlockService checks it before charging.
@Unique('UQ_contact_unlocks_viewer_target', ['viewerUserId', 'targetUserId'])
export class ContactUnlock extends AppBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  viewerUserId!: string;

  @Column({ type: 'enum', enum: PlanAudience })
  viewerRole!: PlanAudience;

  @Index()
  @Column({ type: 'uuid' })
  targetUserId!: string;

  @Column({ type: 'enum', enum: UnlockMethod })
  method!: UnlockMethod;

  // Snapshot of what it cost, if anything (0 for FREE).
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  amountCharged!: string;
}
