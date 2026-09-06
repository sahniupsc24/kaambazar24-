import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';

/**
 * Verifies the bearer JWT and re-checks the user's current active status
 * and role directly from the database (not just from the token claims) so
 * that a deactivated account or a role change takes effect immediately
 * instead of waiting for the token to expire.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or invalid Authorization header');
    }
    const token = header.slice('Bearer '.length);
    const payload = verifyAccessToken(token);

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.sub } });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Account not found or inactive');
    }

    // req.user.role always comes from the freshly-loaded DB row, never
    // trusted from the JWT payload alone — protects against a stale token
    // surviving a role downgrade.
    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
