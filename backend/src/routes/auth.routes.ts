import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post(
  '/register',
  validate([
    body('phone')
      .trim()
      .notEmpty().withMessage('Mobile number is required')
      .matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian mobile number'),
    body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['WORKER', 'EMPLOYER']),
    body('fullNameOrBusinessName').trim().notEmpty().withMessage('Name is required'),
  ]),
  AuthController.register
);

router.post(
  '/login',
  AuthController.login
);

// Separate admin login — different endpoint, different frontend page,
// username-or-email + password only (no OTP path for admins).
router.post(
  '/admin-login',
  validate([body('identifier').notEmpty(), body('password').notEmpty()]),
  AuthController.adminLogin
);

router.post(
  '/otp/request',
  validate([body('phone').isMobilePhone('any')]),
  AuthController.requestOtp
);

router.post(
  '/otp/verify',
  validate([body('phone').isMobilePhone('any'), body('code').isLength({ min: 6, max: 6 })]),
  AuthController.verifyOtp
);

router.post(
  '/forgot-password/request-otp',
  validate([body('identifier').notEmpty()]),
  AuthController.requestPasswordResetOtp
);

router.post(
  '/forgot-password/reset',
  validate([
    body('identifier').notEmpty(),
    body('code').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 }),
  ]),
  AuthController.resetPasswordWithOtp
);

router.post(
  '/refresh',
  validate([body('refreshToken').notEmpty()]),
  AuthController.refresh
);

router.get('/me', authenticate, AuthController.me);

router.post(
  '/google',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('name').trim().notEmpty(),
    body('role').optional().isIn(['WORKER', 'EMPLOYER']),
  ]),
  AuthController.googleLogin
);

export default router;
