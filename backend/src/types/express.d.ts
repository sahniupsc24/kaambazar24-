import { UserRole } from '../entities/enums';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; // User.id — the ONLY identity source for ownership checks
        role: UserRole;
        email: string;
      };
    }
  }
}

export {};
