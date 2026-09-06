import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Hiring } from './Hiring';
import { WorkEntry } from './WorkEntry';

export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED_APPROVED = 'RESOLVED_APPROVED',
  RESOLVED_REJECTED = 'RESOLVED_REJECTED'
}

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contractId: string;

  @ManyToOne(() => Hiring, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract: Hiring;

  @Column({ type: 'uuid', nullable: true })
  workEntryId: string | null;

  @ManyToOne(() => WorkEntry, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'workEntryId' })
  workEntry: WorkEntry | null;

  @Column({ type: 'uuid' })
  raisedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raisedByUserId' })
  raisedByUser: User;

  @Column({ type: 'uuid' })
  againstUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'againstUserId' })
  againstUser: User;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status: DisputeStatus;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string | null;

  @Column({ type: 'uuid', nullable: true })
  resolvedByAdminId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolvedByAdminId' })
  resolvedByAdmin: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
