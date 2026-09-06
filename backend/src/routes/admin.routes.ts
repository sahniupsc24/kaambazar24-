import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AdminService } from '../services/AdminService';
import { RatingService } from '../services/RatingService';
import { VerificationService } from '../services/VerificationService';
import { PaymentGatewayService } from '../services/PaymentGatewayService';
import { PlatformSettingService } from '../services/PlatformSettingService';
import { JobService } from '../services/JobService';
import { AadhaarOverride } from '../entities/enums';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';

import { CategoryService } from '../services/CategoryService';
import { LocationService } from '../services/LocationService';

function pageParams(req: Request) {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 25;
  return { page, pageSize };
}

const router = Router();
router.use(authenticate, authorizeAdmin());

router.get('/stats', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await AdminService.getDashboardStats() });
}));

router.get('/categories', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await CategoryService.list(false) });
}));

router.post(
  '/categories',
  validate([body('name').trim().notEmpty()]),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await CategoryService.create(req.body.name, req.body.description) });
  })
);

router.put(
  '/categories/:id',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await CategoryService.update(req.params.id, req.body) });
  })
);

router.get('/locations', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await LocationService.listFlat(false) });
}));

router.post(
  '/locations',
  validate([body('name').trim().notEmpty(), body('level').notEmpty()]),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await LocationService.create(req.body.name, req.body.level, req.body.parentId) });
  })
);

router.put(
  '/locations/:id',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await LocationService.update(req.params.id, req.body) });
  })
);

router.delete(
  '/locations/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await LocationService.delete(req.params.id);
    res.json({ success: true, data: null });
  })
);

router.get('/users', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.listUsers(page, pageSize) });
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  res.json({ success: true, data: await AdminService.getUserById(req.params.id) });
}));

router.put(
  '/users/:id',
  validate([
    body('fullNameOrBusinessName').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('isActive').optional().isBoolean(),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const updated = await AdminService.updateUserAndProfile(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: updated });
  })
);


router.post(
  '/users/:id/status',
  validate([body('isActive').isBoolean()]),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await AdminService.setUserActiveStatus(req.user!.id, req.params.id, req.body.isActive);
    res.json({ success: true, data: user });
  })
);

router.delete('/users/:id', asyncHandler(async (req: Request, res: Response) => {
  await AdminService.deleteUser(req.user!.id, req.params.id);
  res.json({ success: true, data: null });
}));

router.post(
  '/users/:id/reset-password',
  validate([body('newPassword').isLength({ min: 6 })]),
  asyncHandler(async (req: Request, res: Response) => {
    await AdminService.resetUserPassword(req.user!.id, req.params.id, req.body.newPassword);
    res.json({ success: true, data: { message: 'Password reset successfully' } });
  })
);

router.get('/contact-unlocks', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.getContactUnlocks(page, pageSize) });
}));

router.get('/jobs', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.monitorJobs(page, pageSize) });
}));
router.get('/jobs/:id', asyncHandler(async (req, res) => {
  res.json({ success: true, data: await AdminService.getJobById(req.params.id) });
}));
router.delete('/jobs/:id', asyncHandler(async (req: Request, res: Response) => {
  await AdminService.deleteJob(req.user!.id, req.params.id);
  res.json({ success: true, data: null });
}));
router.get('/applications', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.monitorApplications(page, pageSize) });
}));
router.get('/hirings', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.monitorHirings(page, pageSize) });
}));
router.get('/contracts', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.monitorContracts(page, pageSize) });
}));
router.get('/work-entries', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.monitorWorkEntries(page, pageSize) });
}));
router.get('/payments', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.monitorPayments(page, pageSize) });
}));
router.get('/ratings', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.monitorRatings(page, pageSize) });
}));

router.get('/workers', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.listWorkers(page, pageSize) });
}));
router.get('/buyers', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.listBuyers(page, pageSize) });
}));

router.post(
  '/ratings/:id/remove',
  validate([body('reason').trim().notEmpty()]),
  asyncHandler(async (req: Request, res: Response) => {
    const rating = await RatingService.adminRemove(req.params.id, req.body.reason);
    res.json({ success: true, data: rating });
  })
);

router.get('/audit-logs', asyncHandler(async (req, res) => {
  const { page, pageSize } = pageParams(req);
  res.json({ success: true, data: await AdminService.getAuditLogs(page, pageSize) });
}));

/* ---------------------------------------------------------------------
 * Verification queue — full profile detail, approve/remove, admin edit.
 * ------------------------------------------------------------------- */
router.get('/verification/worker/:id', asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await VerificationService.getWorkerDetail(req.params.id) });
}));
router.get('/verification/employer/:id', asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await VerificationService.getEmployerDetail(req.params.id) });
}));
router.post('/verification/worker/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await VerificationService.approveWorker(req.user!.id, req.params.id) });
}));
router.post(
  '/verification/worker/:id/remove',
  validate([body('reason').trim().notEmpty()]),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await VerificationService.removeWorkerVerification(req.user!.id, req.params.id, req.body.reason) });
  })
);
router.put('/verification/worker/:id', asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await VerificationService.editWorker(req.user!.id, req.params.id, req.body) });
}));
router.post('/verification/employer/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await VerificationService.approveEmployer(req.user!.id, req.params.id) });
}));
router.post(
  '/verification/employer/:id/remove',
  validate([body('reason').trim().notEmpty()]),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await VerificationService.removeEmployerVerification(req.user!.id, req.params.id, req.body.reason) });
  })
);
router.put('/verification/employer/:id', asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await VerificationService.editEmployer(req.user!.id, req.params.id, req.body) });
}));

/* ---------------------------------------------------------------------
 * Aadhaar override — admin has final say per job, overriding buyer's choice.
 * ------------------------------------------------------------------- */
router.put(
  '/jobs/:id/aadhaar-override',
  validate([body('override').isIn(['MANDATORY', 'OPTIONAL', ''])]),
  asyncHandler(async (req: Request, res: Response) => {
    const value = req.body.override || null;
    const job = await JobService.setAadhaarOverride(req.user!.id, req.params.id, value as AadhaarOverride | null);
    res.json({ success: true, data: job });
  })
);

/* ---------------------------------------------------------------------
 * Admin job editing — admin can edit any job's title, description,
 * category, location, compensation, status, featured badge, etc.
 * ------------------------------------------------------------------- */
router.put(
  '/jobs/:id',
  validate([
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('compensationRate').optional().isNumeric(),
    body('openings').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['OPEN', 'CLOSED', 'DRAFT']),
    body('isFeatured').optional().isBoolean(),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const job = await JobService.adminUpdateJob(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: job });
  })
);

/* ---------------------------------------------------------------------
 * Payment gateway settings (Razorpay etc) — admin-managed, secret hidden.
 * ------------------------------------------------------------------- */
router.get('/payment-gateway', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await PaymentGatewayService.getPublicSettings() });
}));
router.put(
  '/payment-gateway',
  validate([body('isEnabled').optional().isBoolean()]),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await PaymentGatewayService.update(req.body) });
  })
);

/* ---------------------------------------------------------------------
 * Platform settings (featured listing price/duration, etc).
 * ------------------------------------------------------------------- */
router.get('/settings', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await PlatformSettingService.getAll() });
}));
router.put(
  '/settings/:key',
  validate([body('value').notEmpty()]),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await PlatformSettingService.set(req.params.key, req.body.value) });
  })
);

export default router;
