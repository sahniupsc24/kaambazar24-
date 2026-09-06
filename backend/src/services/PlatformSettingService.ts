import { AppDataSource } from '../config/data-source';
import { PlatformSetting } from '../entities/PlatformSetting';

const DEFAULTS: Record<string, string> = {
  FEATURED_LISTING_PRICE: '149',
  FEATURED_LISTING_DAYS: '7',
  GA4_MEASUREMENT_ID: '',
  META_PIXEL_ID: '',
  GOOGLE_SITE_VERIFICATION: '',
  SITE_NAME: 'Kaam Bazar (काम बाज़ार)',
  DEFAULT_META_DESCRIPTION: "India's premier blue-collar job & labour marketplace. Find skilled workers or get hired near you.",
  RAZORPAY_KEY_ID: '',
  RAZORPAY_ENABLED: 'false',
  STRIPE_KEY_ID: '',
  STRIPE_ENABLED: 'false',
  PAYPAL_CLIENT_ID: '',
  PAYPAL_ENABLED: 'false',
  PHONEPE_MERCHANT_ID: '',
  PHONEPE_ENABLED: 'false',
  PAYTM_MID: '',
  PAYTM_ENABLED: 'false',
  FREE_JOB_QUOTA: '2',
  JOB_QUOTA_ENFORCEMENT: 'true',
  WORKER_FREE_CONTACT_LIMIT: '3',
  CONTACT_LIMIT_ENFORCEMENT: 'true',
};

export class PlatformSettingService {
  static async get(key: string): Promise<string> {
    const repo = AppDataSource.getRepository(PlatformSetting);
    const row = await repo.findOne({ where: { key } });
    return row?.value ?? DEFAULTS[key] ?? '';
  }

  static async set(key: string, value: string) {
    const repo = AppDataSource.getRepository(PlatformSetting);
    let row = await repo.findOne({ where: { key } });
    if (!row) row = repo.create({ key, value });
    else row.value = value;
    return repo.save(row);
  }

  static async getAll(): Promise<Record<string, string>> {
    const repo = AppDataSource.getRepository(PlatformSetting);
    const rows = await repo.find();
    const result = { ...DEFAULTS };
    rows.forEach((r) => { result[r.key] = r.value; });
    return result;
  }
}
