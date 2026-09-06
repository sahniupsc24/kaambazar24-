import { Request, Response, Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { WorkContractService } from '../services/WorkContractService';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../entities/enums';
import { ApiError } from '../utils/ApiError';

function roleOf(req: Request): 'WORKER' | 'EMPLOYER' {
  if (req.user!.role === UserRole.WORKER) return 'WORKER';
  if (req.user!.role === UserRole.EMPLOYER) return 'EMPLOYER';
  throw ApiError.forbidden();
}

export const WorkContractController = {
  getMine: asyncHandler(async (req: Request, res: Response) => {
    const contracts = await WorkContractService.getMyContracts(req.user!.id, roleOf(req));
    res.json({ success: true, data: contracts });
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const contract = await WorkContractService.getById(req.params.id, req.user!.id, roleOf(req));
    res.json({ success: true, data: contract });
  }),
  updateDraft: asyncHandler(async (req: Request, res: Response) => {
    const contract = await WorkContractService.updateDraft(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: contract });
  }),
  send: asyncHandler(async (req: Request, res: Response) => {
    const contract = await WorkContractService.send(req.user!.id, req.params.id);
    res.json({ success: true, data: contract });
  }),
  workerAccept: asyncHandler(async (req: Request, res: Response) => {
    const contract = await WorkContractService.workerAccept(req.user!.id, req.params.id);
    res.json({ success: true, data: contract });
  }),
  employerConfirm: asyncHandler(async (req: Request, res: Response) => {
    const contract = await WorkContractService.employerConfirm(req.user!.id, req.params.id);
    res.json({ success: true, data: contract });
  }),
  complete: asyncHandler(async (req: Request, res: Response) => {
    const contract = await WorkContractService.complete(req.user!.id, req.params.id);
    res.json({ success: true, data: contract });
  }),
  terminate: asyncHandler(async (req: Request, res: Response) => {
    const contract = await WorkContractService.terminate(
      req.user!.id, roleOf(req), req.params.id, req.body?.reason ?? 'No reason provided'
    );
    res.json({ success: true, data: contract });
  }),
};

const router = Router();
router.get('/mine', authenticate, authorize(UserRole.WORKER, UserRole.EMPLOYER), WorkContractController.getMine);
router.get('/:id', authenticate, authorize(UserRole.WORKER, UserRole.EMPLOYER), WorkContractController.getById);
router.put('/:id', authenticate, authorize(UserRole.EMPLOYER), WorkContractController.updateDraft);
router.post('/:id/send', authenticate, authorize(UserRole.EMPLOYER), WorkContractController.send);
router.post('/:id/worker-accept', authenticate, authorize(UserRole.WORKER), WorkContractController.workerAccept);
router.post('/:id/employer-confirm', authenticate, authorize(UserRole.EMPLOYER), WorkContractController.employerConfirm);
router.post('/:id/complete', authenticate, authorize(UserRole.EMPLOYER), WorkContractController.complete);
router.post('/:id/terminate', authenticate, authorize(UserRole.WORKER, UserRole.EMPLOYER), WorkContractController.terminate);
export default router;
