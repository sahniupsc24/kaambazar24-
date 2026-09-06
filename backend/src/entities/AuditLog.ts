import { Entity, Column, Index, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  actorRole!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  action!: string; // e.g. 'APPLICATION_ACCEPTED', 'PAYMENT_PROCESSED', 'RATING_REMOVED'

  @Index()
  @Column({ type: 'varchar', length: 100 })
  entityType!: string; // e.g. 'Job', 'Application', 'Payment'

  @Index()
  @Column({ type: 'uuid', nullable: true })
  entityId!: string | null;

  // Free-form structured context. MUST NEVER contain passwords, OTP
  // secrets, or JWTs — enforced by convention in AuditService, which
  // strips known-sensitive keys before persisting.
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
