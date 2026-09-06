import { Entity, Column } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';
import { PlanAudience, PlanType } from './enums';

@Entity('subscription_plans')
export class SubscriptionPlan extends AppBaseEntity {
  @Column({ type: 'enum', enum: PlanAudience })
  audience!: PlanAudience; // which side of the marketplace this plan is for

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'enum', enum: PlanType })
  type!: PlanType;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  // Only meaningful for ONE_TIME plans.
  @Column({ type: 'int', nullable: true })
  contactsIncluded!: number | null;

  // Only meaningful for SUBSCRIPTION plans.
  @Column({ type: 'int', nullable: true })
  durationDays!: number | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
