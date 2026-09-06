import { AppDataSource } from '../config/data-source';
import { PaymentGatewaySetting } from '../entities/PaymentGatewaySetting';

export class PaymentGatewayService {
  private static async getOrCreateRow(): Promise<PaymentGatewaySetting> {
    const repo = AppDataSource.getRepository(PaymentGatewaySetting);
    let row = await repo.findOne({ where: {} });
    if (!row) {
      row = await repo.save(repo.create({ provider: 'razorpay', isEnabled: false }));
    }
    return row;
  }

  /** Admin-facing view — never includes the secret. */
  static async getPublicSettings() {
    const row = await PaymentGatewayService.getOrCreateRow();
    return {
      provider: row.provider,
      keyId: row.keyId,
      isEnabled: row.isEnabled,
      hasSecret: !!row.keySecret, // lets the UI show "secret is set" without revealing it
    };
  }

  static async update(input: { provider?: string; keyId?: string; keySecret?: string; isEnabled?: boolean }) {
    const repo = AppDataSource.getRepository(PaymentGatewaySetting);
    const row = await PaymentGatewayService.getOrCreateRow();
    if (input.provider !== undefined) row.provider = input.provider;
    if (input.keyId !== undefined) row.keyId = input.keyId;
    if (input.keySecret !== undefined) row.keySecret = input.keySecret; // only overwritten when explicitly provided
    if (input.isEnabled !== undefined) row.isEnabled = input.isEnabled;
    await repo.save(row);
    return PaymentGatewayService.getPublicSettings();
  }

  static async isEnabled(): Promise<boolean> {
    const row = await PaymentGatewayService.getOrCreateRow();
    return row.isEnabled;
  }
}
