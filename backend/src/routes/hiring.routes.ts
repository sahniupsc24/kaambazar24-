import { Request, Response } from 'express';
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HiringService } from '../services/HiringService';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../entities/enums';

export const HiringController = {
  getMineAsWorker: asyncHandler(async (req: Request, res: Response) => {
    const hirings = await HiringService.getMyHirings(req.user!.id, 'WORKER');
    res.json({ success: true, data: hirings });
  }),
  getMineAsEmployer: asyncHandler(async (req: Request, res: Response) => {
    const hirings = await HiringService.getMyHirings(req.user!.id, 'EMPLOYER');
    res.json({ success: true, data: hirings });
  }),
};

const router = Router();
router.get('/worker/mine', authenticate, authorize(UserRole.WORKER), HiringController.getMineAsWorker);
router.get('/employer/mine', authenticate, authorize(UserRole.EMPLOYER), HiringController.getMineAsEmployer);
export default router;
