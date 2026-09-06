import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { ContactUnlockService } from '../services/ContactUnlockService';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole, PlanAudience } from '../entities/enums';
import { validate } from '../middleware/validate';

const router = Router();

// Worker unlocking a buyer's contact, or Buyer unlocking a worker's contact.
// Both roles hit the same endpoint; the viewer's role determines which
// profile's free-unlock/credits/subscription state is checked.
router.post(
  '/unlock',
  authenticate,
  authorize(UserRole.WORKER, UserRole.EMPLOYER),
  validate([body('targetUserId').isUUID()]),
  asyncHandler(async (req: Request, res: Response) => {
    const viewerRole = req.user!.role === UserRole.WORKER ? PlanAudience.WORKER : PlanAudience.EMPLOYER;
    const result = await ContactUnlockService.unlock(req.user!.id, viewerRole, req.body.targetUserId);
    res.json({ success: true, data: result });
  })
);

router.get(
  '/unlocked/:targetUserId',
  authenticate,
  authorize(UserRole.WORKER, UserRole.EMPLOYER),
  asyncHandler(async (req: Request, res: Response) => {
    const isUnlocked = await ContactUnlockService.isUnlocked(req.user!.id, req.params.targetUserId);
    res.json({ success: true, data: { isUnlocked } });
  })
);

export default router;
