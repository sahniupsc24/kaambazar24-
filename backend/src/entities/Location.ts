import { Entity, Column, Tree, TreeChildren, TreeParent, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';

export enum LocationLevel {
  COUNTRY = 'COUNTRY',
  STATE = 'STATE',
  CITY = 'CITY',
  AREA = 'AREA',
}

// TypeORM closure-table tree so we can query full ancestor/descendant
// chains (e.g. "all jobs in Maharashtra" rolling up every city under it)
// without recursive CTEs in application code.
@Entity('locations')
@Tree('closure-table')
export class Location extends AppBaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160, unique: true })
  slug!: string;

  @Column({ type: 'enum', enum: LocationLevel })
  level!: LocationLevel;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @TreeParent()
  parent!: Location | null;

  @TreeChildren()
  children!: Location[];
}
