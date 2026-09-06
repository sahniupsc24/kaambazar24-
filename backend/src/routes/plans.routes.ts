import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { SubscriptionPlanService } from '../services/SubscriptionPlanService';
import { authenticate } from '../middleware/authenticate';
import { authorize, authorizeAdmin } from '../middleware/authorize';
import { UserRole, PlanAudience } from '../entities/enums';
import { validate } from '../middleware/validate';

const router = Router();

// Public: list active plans for a given audience (worker sees worker
// plans, buyer sees buyer plans) — shown when they run out of free unlocks.
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const audience = req.query.audience as PlanAudience | undefined;
  res.json({ success: true, data: await SubscriptionPlanService.list(audience) });
}));

// Worker/Employer: purchase a plan (payment capture happens client-side
// via the configured gateway; this applies the plan's effect server-side).
router.post(
  '/:id/purchase',
  authenticate,
  authorize(UserRole.WORKER, UserRole.EMPLOYER),
  asyncHandler(async (req: Request, res: Response) => {
    const role = req.user!.role === UserRole.WORKER ? PlanAudience.WORKER : PlanAudience.EMPLOYER;
    const result = await SubscriptionPlanService.purchase(req.user!.id, role, req.params.id);
    res.json({ success: true, data: result });
  })
);

// Admin: create/deactivate plans.
router.post(
  '/',
  authenticate,
  authorizeAdmin(),
  validate([
    body('audience').isIn(['WORKER', 'EMPLOYER']),
    body('name').trim().notEmpty(),
    body('type').isIn(['ONE_TIME', 'SUBSCRIPTION']),
    body('price').isNumeric(),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const plan = await SubscriptionPlanService.create(req.body);
    res.status(201).json({ success: true, data: plan });
  })
);

router.put(
  '/:id',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: Request, res: Response) => {
    const plan = await SubscriptionPlanService.update(req.params.id, req.body);
    res.json({ success: true, data: plan });
  })
);

router.delete(
  '/:id',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: Request, res: Response) => {
    const plan = await SubscriptionPlanService.deactivate(req.params.id);
    res.json({ success: true, data: plan });
  })
);


export default router;
