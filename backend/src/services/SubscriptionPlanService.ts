import { AppDataSource } from '../config/data-source';
import { SubscriptionPlan } from '../entities/SubscriptionPlan';
import { WorkerProfile } from '../entities/WorkerProfile';
import { EmployerProfile } from '../entities/EmployerProfile';
import { PlanAudience, PlanType } from '../entities/enums';
import { ApiError } from '../utils/ApiError';
import { AuditService } from './AuditService';
import { PaymentGatewayService } from './PaymentGatewayService';

export interface CreatePlanInput {
  audience: PlanAudience;
  name: string;
  type: PlanType;
  price: string;
  contactsIncluded?: number;
  durationDays?: number;
}

export class SubscriptionPlanService {
  static async list(audience?: PlanAudience) {
    const repo = AppDataSource.getRepository(SubscriptionPlan);
    return repo.find({
      where: { ...(audience ? { audience } : {}), isActive: true },
      order: { price: 'ASC' },
    });
  }

  static async create(input: CreatePlanInput) {
    if (input.type === PlanType.ONE_TIME && !input.contactsIncluded) {
      throw ApiError.badRequest('contactsIncluded is required for ONE_TIME plans');
    }
    if (input.type === PlanType.SUBSCRIPTION && !input.durationDays) {
      throw ApiError.badRequest('durationDays is required for SUBSCRIPTION plans');
    }
    const repo = AppDataSource.getRepository(SubscriptionPlan);
    const plan = repo.create({
      audience: input.audience,
      name: input.name,
      type: input.type,
      price: input.price,
      contactsIncluded: input.contactsIncluded ?? null,
      durationDays: input.durationDays ?? null,
    });
    return repo.save(plan);
  }

  static async deactivate(id: string) {
    const repo = AppDataSource.getRepository(SubscriptionPlan);
    const plan = await repo.findOne({ where: { id } });
    if (!plan) throw ApiError.notFound('Plan not found');
    plan.isActive = false;
    return repo.save(plan);
  }

  static async update(id: string, updates: Partial<CreatePlanInput> & { isActive?: boolean }) {
    const repo = AppDataSource.getRepository(SubscriptionPlan);
    const plan = await repo.findOne({ where: { id } });
    if (!plan) throw ApiError.notFound('Plan not found');

    if (updates.name) plan.name = updates.name;
    if (updates.audience) plan.audience = updates.audience;
    if (updates.type) plan.type = updates.type;
    if (updates.price) plan.price = updates.price;
    if (updates.contactsIncluded !== undefined) plan.contactsIncluded = updates.contactsIncluded;
    if (updates.durationDays !== undefined) plan.durationDays = updates.durationDays;
    if (updates.isActive !== undefined) plan.isActive = updates.isActive;

    return repo.save(plan);
  }


  /**
   * Simulated purchase — actual card/UPI capture happens client-side via
   * the configured gateway (Razorpay) once PaymentGatewaySetting.isEnabled
   * is true; this method just applies the plan's effect once payment is
   * confirmed. Until a real gateway is wired, this always "succeeds" so
   * the rest of the flow (credits/subscription/verification stats) can be
   * built and tested end-to-end today.
   */
  static async purchase(userId: string, role: PlanAudience, planId: string) {
    const planRepo = AppDataSource.getRepository(SubscriptionPlan);
    const plan = await planRepo.findOne({ where: { id: planId, isActive: true } });
    if (!plan) throw ApiError.notFound('Plan not found');

    const gatewayEnabled = await PaymentGatewayService.isEnabled();

    const profileRepo =
      role === PlanAudience.WORKER
        ? AppDataSource.getRepository(WorkerProfile)
        : AppDataSource.getRepository(EmployerProfile);
    const profile = await profileRepo.findOne({ where: { userId } });
    if (!profile) throw ApiError.notFound('Profile not found');

    if (plan.type === PlanType.SUBSCRIPTION) {
      const expires = new Date();
      expires.setDate(expires.getDate() + (plan.durationDays ?? 30));
      profile.subscriptionExpiresAt = expires;
    } else {
      profile.contactCredits += plan.contactsIncluded ?? 0;
    }
    if ('totalSpend' in profile) {
      (profile as EmployerProfile).totalSpend = (
        parseFloat((profile as EmployerProfile).totalSpend || '0') + parseFloat(plan.price)
      ).toFixed(2);
    }
    await (profileRepo as any).save(profile);

    await AuditService.log({
      actorUserId: userId,
      actorRole: role,
      action: 'PLAN_PURCHASED',
      entityType: 'SubscriptionPlan',
      entityId: plan.id,
      metadata: {
        planName: plan.name,
        price: plan.price,
        paymentMode: gatewayEnabled ? 'gateway' : 'simulated',
      },
    });

    return { plan, gatewayEnabled };
  }
}
