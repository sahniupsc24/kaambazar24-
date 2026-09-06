import { Entity, Column, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';

@Entity('categories')
export class Category extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
