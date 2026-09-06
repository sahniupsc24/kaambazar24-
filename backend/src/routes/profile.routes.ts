import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../entities/enums';
import { WorkerProfileController, EmployerProfileController } from '../controllers/ProfileController';

const router = Router();

router.get('/worker/me', authenticate, authorize(UserRole.WORKER), WorkerProfileController.getMine);
router.put('/worker/me', authenticate, authorize(UserRole.WORKER), WorkerProfileController.updateMine);
router.put('/worker/aadhaar', authenticate, authorize(UserRole.WORKER), WorkerProfileController.submitAadhaar);

// Buyer-facing worker directory search — requires an Employer login so we
// know whose free-unlock/credits/subscription state applies when they
// later call /api/contacts/unlock on a result.
router.get('/worker/search', authenticate, authorize(UserRole.EMPLOYER), WorkerProfileController.search);

router.get('/employer/me', authenticate, authorize(UserRole.EMPLOYER), EmployerProfileController.getMine);
router.put('/employer/me', authenticate, authorize(UserRole.EMPLOYER), EmployerProfileController.updateMine);

// Public: view an employer's non-sensitive info from a job listing.
router.get('/employer/:id/public', EmployerProfileController.getPublic);

export default router;
