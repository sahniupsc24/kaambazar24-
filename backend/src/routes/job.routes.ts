import { Router } from 'express';
import { body } from 'express-validator';
import { JobController } from '../controllers/JobController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../entities/enums';
import { validate } from '../middleware/validate';

const router = Router();

// Public marketplace browsing — no auth required.
router.get('/', JobController.search);
router.get('/:id', JobController.getPublicById);

// Employer-only management.
router.get('/mine/list', authenticate, authorize(UserRole.EMPLOYER), JobController.getMine);

router.post(
  '/',
  authenticate,
  authorize(UserRole.EMPLOYER),
  validate([
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('categoryId').isUUID(),
    body('locationId').isUUID(),
    body('workType').notEmpty(),
    body('compensationType').notEmpty(),
    body('compensationRate').isNumeric(),
    body('aadhaarRequired').optional().isBoolean(),
    body('wantsFeatured').optional().isBoolean(),
  ]),
  JobController.create
);

router.put('/:id', authenticate, authorize(UserRole.EMPLOYER), JobController.update);
router.post('/:id/close', authenticate, authorize(UserRole.EMPLOYER), JobController.close);

export default router;
