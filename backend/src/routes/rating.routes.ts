import { Request, Response, Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { RatingService } from '../services/RatingService';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../entities/enums';
import { validate } from '../middleware/validate';
import { ApiError } from '../utils/ApiError';

function roleOf(req: Request): 'WORKER' | 'EMPLOYER' {
  if (req.user!.role === UserRole.WORKER) return 'WORKER';
  if (req.user!.role === UserRole.EMPLOYER) return 'EMPLOYER';
  throw ApiError.forbidden();
}

export const RatingController = {
  submit: asyncHandler(async (req: Request, res: Response) => {
    const { contractId, score, comment } = req.body;
    const rating = await RatingService.submit(req.user!.id, roleOf(req), contractId, score, comment);
    res.status(201).json({ success: true, data: rating });
  }),
  getForContract: asyncHandler(async (req: Request, res: Response) => {
    const ratings = await RatingService.getForContract(req.params.contractId);
    res.json({ success: true, data: ratings });
  }),
  getReputation: asyncHandler(async (req: Request, res: Response) => {
    const reputation = await RatingService.getReputation(req.params.userId);
    res.json({ success: true, data: reputation });
  }),
};

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(UserRole.WORKER, UserRole.EMPLOYER),
  validate([body('contractId').isUUID(), body('score').isInt({ min: 1, max: 5 })]),
  RatingController.submit
);
router.get('/contract/:contractId', RatingController.getForContract);
router.get('/reputation/:userId', RatingController.getReputation);

export default router;
