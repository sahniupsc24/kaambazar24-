import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { WorkContract } from './WorkContract';
import { RaterRole } from './enums';

@Entity('contract_ratings')
// MANDATORY per spec section 23 — a user cannot submit more than one
// rating for the same contract in the same rater role.
@Unique('UQ_contract_ratings_contract_rater', ['contractId', 'raterUserId'])
export class ContractRating extends AppBaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  contractId!: string;

  @ManyToOne(() => WorkContract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract!: WorkContract;

  @Column({ type: 'uuid' })
  raterUserId!: string;

  @Column({ type: 'enum', enum: RaterRole })
  raterRole!: RaterRole;

  // The user being rated (the counterparty on the same contract).
  @Column({ type: 'uuid' })
  ratedUserId!: string;

  @Column({ type: 'int' })
  score!: number; // 1-5, validated in service layer + CHECK constraint

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ type: 'boolean', default: false })
  isRemovedByAdmin!: boolean;

  @Column({ type: 'text', nullable: true })
  adminRemovalReason!: string | null;
}
