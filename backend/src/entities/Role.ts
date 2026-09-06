import { Entity, Column, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { UserRole } from './enums';

/**
 * IMPORTANT: This table is descriptive metadata for the admin panel
 * (display name, description) — it is NOT the source of truth for access
 * control. RBAC decisions are always made against the `User.role` enum
 * column, which is a fixed Postgres enum. This keeps authorization
 * type-safe and prevents privilege escalation via editing a "roles" table.
 * Admins may edit `description`/`isActive` display metadata here, but the
 * fixed four roles (WORKER, EMPLOYER, ADMIN, SUPER_ADMIN) cannot be
 * renamed or added to without a code change + migration.
 */
@Entity('roles')
export class Role extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'enum', enum: UserRole, unique: true })
  name!: UserRole;

  @Column({ type: 'varchar', length: 100 })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
