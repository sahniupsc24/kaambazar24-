import { Router } from 'express';
import { body } from 'express-validator';
import { ApplicationController } from '../controllers/ApplicationController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../entities/enums';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(UserRole.WORKER),
  validate([body('jobId').isUUID(), body('coverNote').optional().isString()]),
  ApplicationController.apply
);

router.post('/:id/withdraw', authenticate, authorize(UserRole.WORKER), ApplicationController.withdraw);
router.get('/mine', authenticate, authorize(UserRole.WORKER), ApplicationController.getMine);

router.get(
  '/job/:jobId',
  authenticate,
  authorize(UserRole.EMPLOYER),
  ApplicationController.getForJob
);
router.post('/:id/accept', authenticate, authorize(UserRole.EMPLOYER), ApplicationController.accept);
router.post('/:id/reject', authenticate, authorize(UserRole.EMPLOYER), ApplicationController.reject);

export default router;
