import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { CategoryService } from '../services/CategoryService';
import { LocationService } from '../services/LocationService';
import { PlatformSettingService } from '../services/PlatformSettingService';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

// Public reads — used by job search filters, registration forms, etc.
router.get('/categories', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await CategoryService.list(true) });
}));

router.get('/locations', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await LocationService.listFlat(true) });
}));

router.get('/locations/tree', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await LocationService.listTree() });
}));

// Public: buyers need the current featured-listing price before posting a
// job; no need to expose the full admin settings surface for this.
router.get('/settings/featured-price', asyncHandler(async (_req: Request, res: Response) => {
  const price = await PlatformSettingService.get('FEATURED_LISTING_PRICE');
  const days = await PlatformSettingService.get('FEATURED_LISTING_DAYS');
  res.json({ success: true, data: { price: Number(price), days: Number(days) } });
}));

// Public: get job quota and contact unlock limits for frontend enforcement
router.get('/settings/limits', asyncHandler(async (_req: Request, res: Response) => {
  const freeJobQuota = await PlatformSettingService.get('FREE_JOB_QUOTA');
  const jobQuotaEnforcement = await PlatformSettingService.get('JOB_QUOTA_ENFORCEMENT');
  const workerFreeContactLimit = await PlatformSettingService.get('WORKER_FREE_CONTACT_LIMIT');
  const contactLimitEnforcement = await PlatformSettingService.get('CONTACT_LIMIT_ENFORCEMENT');
  
  res.json({
    success: true,
    data: {
      freeJobQuota: Number(freeJobQuota),
      jobQuotaEnforcement: jobQuotaEnforcement === 'true',
      workerFreeContactLimit: Number(workerFreeContactLimit),
      contactLimitEnforcement: contactLimitEnforcement === 'true',
    }
  });
}));

// Admin writes.
router.post(
  '/categories',
  authenticate,
  authorizeAdmin(),
  validate([body('name').trim().notEmpty()]),
  asyncHandler(async (req: Request, res: Response) => {
    const category = await CategoryService.create(req.body.name, req.body.description);
    res.status(201).json({ success: true, data: category });
  })
);

router.put(
  '/categories/:id',
  authenticate,
  authorizeAdmin(),
  asyncHandler(async (req: Request, res: Response) => {
    const category = await CategoryService.update(req.params.id, req.body);
    res.json({ success: true, data: category });
  })
);

router.post(
  '/locations',
  authenticate,
  authorizeAdmin(),
  validate([body('name').trim().notEmpty(), body('level').isIn(['COUNTRY', 'STATE', 'CITY', 'AREA'])]),
  asyncHandler(async (req: Request, res: Response) => {
    const location = await LocationService.create(req.body.name, req.body.level, req.body.parentId);
    res.status(201).json({ success: true, data: location });
  })
);

export default router;
