import { Request, Response, Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { PaymentService } from '../services/PaymentService';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../entities/enums';
import { validate } from '../middleware/validate';

export const PaymentController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const payment = await PaymentService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: payment });
  }),
  process: asyncHandler(async (req: Request, res: Response) => {
    const { outcome, failureReason } = req.body;
    const payment = await PaymentService.process(req.user!.id, req.params.id, outcome, failureReason);
    res.json({ success: true, data: payment });
  }),
  retry: asyncHandler(async (req: Request, res: Response) => {
    const payment = await PaymentService.retry(req.user!.id, req.params.id);
    res.json({ success: true, data: payment });
  }),
  getMineAsWorker: asyncHandler(async (req: Request, res: Response) => {
    const payments = await PaymentService.getMyPaymentsAsWorker(req.user!.id);
    res.json({ success: true, data: payments });
  }),
  getMineAsEmployer: asyncHandler(async (req: Request, res: Response) => {
    const payments = await PaymentService.getMyPaymentsAsEmployer(req.user!.id);
    res.json({ success: true, data: payments });
  }),
};

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(UserRole.EMPLOYER),
  validate([
    body('contractId').isUUID(),
    body('workEntryIds').isArray({ min: 1 }),
    body('manualAmount').optional().isNumeric(),
  ]),
  PaymentController.create
);

router.post('/:id/process', authenticate, authorize(UserRole.EMPLOYER), PaymentController.process);
router.post('/:id/retry', authenticate, authorize(UserRole.EMPLOYER), PaymentController.retry);
router.get('/worker/mine', authenticate, authorize(UserRole.WORKER), PaymentController.getMineAsWorker);
router.get('/employer/mine', authenticate, authorize(UserRole.EMPLOYER), PaymentController.getMineAsEmployer);

export default router;
