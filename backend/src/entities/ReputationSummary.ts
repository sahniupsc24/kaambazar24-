import { Entity, Column, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';

@Entity('reputation_summaries')
export class ReputationSummary extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
  averageScore!: string;

  @Column({ type: 'int', default: 0 })
  totalRatings!: number;

  @Column({ type: 'int', default: 0 })
  fiveStarCount!: number;

  @Column({ type: 'int', default: 0 })
  fourStarCount!: number;

  @Column({ type: 'int', default: 0 })
  threeStarCount!: number;

  @Column({ type: 'int', default: 0 })
  twoStarCount!: number;

  @Column({ type: 'int', default: 0 })
  oneStarCount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastRecalculatedAt!: Date | null;
}
