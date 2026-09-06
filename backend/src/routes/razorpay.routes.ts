import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/authenticate';
import { PaymentGatewaySetting } from '../entities/PaymentGatewaySetting';
import { AppDataSource } from '../config/data-source';
import { SubscriptionPlanService } from '../services/SubscriptionPlanService';
import { PlanAudience, UserRole } from '../entities/enums';
import { ApiError } from '../utils/ApiError';
import { AuditService } from '../services/AuditService';
import { env } from '../config/env';

const router = Router();

// Endpoint 1: Create Razorpay Order
router.post(
  '/create-order',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { planId, amount, currency = 'INR' } = req.body;
    if (!amount || amount <= 0) {
      throw ApiError.badRequest('Valid amount is required');
    }

    const gatewayRepo = AppDataSource.getRepository(PaymentGatewaySetting);
    const settings = await gatewayRepo.findOne({ where: {} });

    const keyId = settings?.keyId || 'rzp_test_mock';
    const isMock = !settings?.isEnabled || !settings?.keySecret;

    const orderId = `order_${isMock ? 'mock_' : ''}${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amountInPaise = Math.round(amount * 100);

    const orderData = {
      id: orderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency,
      receipt: `rcpt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      notes: { planId: planId || '', userId: req.user!.id },
      created_at: Math.floor(Date.now() / 1000),
      keyId,
      isMock,
    };

    res.json({ success: true, data: orderData });
  })
);

// Endpoint 2: Verify Razorpay Payment Signature & Apply Plan/Credits
router.post(
  '/verify',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      throw ApiError.badRequest('Razorpay order_id and payment_id are required');
    }

    const gatewayRepo = AppDataSource.getRepository(PaymentGatewaySetting);
    const settings = await gatewayRepo.findOne({ where: {} });

    const isMockOrder = razorpay_order_id.includes('mock');

    // Block mock orders in production — prevent payment bypass
    if (env.nodeEnv === 'production' && isMockOrder) {
      throw ApiError.badRequest('Mock orders are not allowed in production.');
    }

    if (!isMockOrder && settings?.isEnabled && settings?.keySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', settings.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const sigBuf = Buffer.from(razorpay_signature || '', 'hex');
      const genBuf = Buffer.from(generatedSignature, 'hex');
      if (sigBuf.length !== genBuf.length || !crypto.timingSafeEqual(sigBuf, genBuf)) {
        throw ApiError.badRequest('Invalid payment signature verification failed');
      }
    }

    let purchaseResult = null;
    if (planId) {
      const role = req.user!.role === UserRole.WORKER ? PlanAudience.WORKER : PlanAudience.EMPLOYER;
      purchaseResult = await SubscriptionPlanService.purchase(req.user!.id, role, planId);
    }

    await AuditService.log({
      actorUserId: req.user!.id,
      actorRole: req.user!.role,
      action: 'PAYMENT_VERIFIED',
      entityType: 'Payment',
      entityId: razorpay_payment_id,
      metadata: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        planId,
        isMock: isMockOrder,
      },
    });

    res.json({
      success: true,
      message: 'Payment verified and benefit applied successfully',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        purchaseResult,
      },
    });
  })
);

// Endpoint 3: Webhook listener for async Razorpay payment capture
router.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const webhookSecret = env.razorpay.webhookSecret;
    if (webhookSecret) {
      const receivedSignature = req.headers['x-razorpay-signature'] as string;
      if (!receivedSignature) {
        return res.status(400).json({ error: 'Missing webhook signature' });
      }
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))) {
        return res.status(403).json({ error: 'Invalid webhook signature' });
      }
    }
    const event = req.body;
    // eslint-disable-next-line no-console
    if (env.nodeEnv !== 'production') console.log('[RAZORPAY WEBHOOK RECEIVED]:', event?.event);
    res.json({ status: 'ok' });
  })
);

export default router;
