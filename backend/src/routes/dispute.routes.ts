import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { DisputeService } from '../services/DisputeService';
import { DisputeStatus } from '../entities/Dispute';
import { UserRole } from '../entities/enums';

const router = Router();
const disputeService = new DisputeService();

// POST /api/disputes
router.post('/', authenticate, async (req, res) => {
  try {
    const { contractId, reason, workEntryId } = req.body;
    if (!contractId || !reason) {
      return res.status(400).json({ success: false, message: 'contractId and reason are required' });
    }

    const dispute = await disputeService.createDispute(contractId, req.user!.id, reason, workEntryId);
    res.json({ success: true, data: dispute });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/disputes/mine
router.get('/mine', authenticate, async (req, res) => {
  try {
    const disputes = await disputeService.getMyDisputes(req.user!.id);
    res.json({ success: true, data: disputes });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/disputes (Admin only)
router.get('/', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), async (req, res) => {
  try {
    const disputes = await disputeService.getAllDisputes();
    res.json({ success: true, data: disputes });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/disputes/:id/resolve (Admin only)
router.post('/:id/resolve', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), async (req, res) => {
  try {
    const { resolutionStatus, notes } = req.body;
    if (!resolutionStatus || !notes) {
      return res.status(400).json({ success: false, message: 'resolutionStatus and notes are required' });
    }

    const dispute = await disputeService.resolveDispute(req.params.id, req.user!.id, resolutionStatus as DisputeStatus, notes);
    res.json({ success: true, data: dispute });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
