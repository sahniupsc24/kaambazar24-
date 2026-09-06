import { Request, Response, Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { WorkEntryService } from '../services/WorkEntryService';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../entities/enums';
import { validate } from '../middleware/validate';

export const WorkEntryController = {
  submit: asyncHandler(async (req: Request, res: Response) => {
    const entry = await WorkEntryService.submit(req.user!.id, req.params.contractId, req.body);
    res.status(201).json({ success: true, data: entry });
  }),
  correct: asyncHandler(async (req: Request, res: Response) => {
    const entry = await WorkEntryService.correct(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: entry });
  }),
  getMineForContract: asyncHandler(async (req: Request, res: Response) => {
    const entries = await WorkEntryService.getMyEntriesForContract(req.user!.id, req.params.contractId);
    res.json({ success: true, data: entries });
  }),
  getForContractAsEmployer: asyncHandler(async (req: Request, res: Response) => {
    const entries = await WorkEntryService.getEntriesForContractAsEmployer(req.user!.id, req.params.contractId);
    res.json({ success: true, data: entries });
  }),
  approve: asyncHandler(async (req: Request, res: Response) => {
    const entry = await WorkEntryService.approve(req.user!.id, req.params.id, req.body?.employerInternalNote);
    res.json({ success: true, data: entry });
  }),
  reject: asyncHandler(async (req: Request, res: Response) => {
    const entry = await WorkEntryService.reject(req.user!.id, req.params.id, req.body?.employerInternalNote);
    res.json({ success: true, data: entry });
  }),
};

const router = Router();

router.post(
  '/contract/:contractId',
  authenticate,
  authorize(UserRole.WORKER),
  validate([
    body('workDate').isISO8601(),
    body('hoursWorked').isFloat({ gt: 0, max: 24 }),
    body('workerNotes').optional().isString(),
    body('checkInLat').optional().isFloat(),
    body('checkInLng').optional().isFloat(),
    body('checkInAccuracy').optional().isFloat(),
  ]),
  WorkEntryController.submit
);

router.put('/:id/correct', authenticate, authorize(UserRole.WORKER), WorkEntryController.correct);
router.get('/contract/:contractId/mine', authenticate, authorize(UserRole.WORKER), WorkEntryController.getMineForContract);

router.get(
  '/contract/:contractId/review',
  authenticate,
  authorize(UserRole.EMPLOYER),
  WorkEntryController.getForContractAsEmployer
);
router.post('/:id/approve', authenticate, authorize(UserRole.EMPLOYER), WorkEntryController.approve);
router.post('/:id/reject', authenticate, authorize(UserRole.EMPLOYER), WorkEntryController.reject);

export default router;
