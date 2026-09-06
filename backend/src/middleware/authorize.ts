import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/enums';
import { ApiError } from '../utils/ApiError';

/**
 * Role gate. Must run after `authenticate`. This only checks role
 * membership — it does NOT check resource ownership. Ownership checks
 * (e.g. "is this job mine") happen in the service layer via
 * resolveWorkerProfile / resolveEmployerProfile helpers, never here.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}

// Convenience: SUPER_ADMIN implicitly passes any ADMIN-gated route too.
export function authorizeAdmin() {
  return authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);
}
