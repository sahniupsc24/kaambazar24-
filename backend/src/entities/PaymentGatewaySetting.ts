import { Entity, Column } from 'typeorm';
import { AppBaseEntity } from './BaseEntity';

@Entity('payment_gateway_settings')
export class PaymentGatewaySetting extends AppBaseEntity {
  // Single-row table in practice (one active gateway config at a time).
  // Kept as a normal entity rather than a hardcoded config file so admin
  // can change it from the UI without a deployment.
  @Column({ type: 'varchar', length: 50, default: 'razorpay' })
  provider!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  keyId!: string | null;

  // Never selected by default, never returned by any API response.
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  keySecret!: string | null;

  @Column({ type: 'boolean', default: false })
  isEnabled!: boolean;
}
