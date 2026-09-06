import { Entity, Column, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';

@Entity('platform_settings')
export class PlatformSetting extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  key!: string; // e.g. 'FEATURED_LISTING_PRICE'

  @Column({ type: 'text' })
  value!: string; // stored as text, parsed by the consuming service
}
