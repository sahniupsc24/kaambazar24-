import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../entities/enums';

export interface AccessTokenPayload {
  sub: string; // User.id
  role: UserRole;
  email?: string | null;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion?: number;
}

// IMPORTANT: `role` here must always be sourced from the authenticated
// User row loaded from the database at login time — never from a
// client-supplied field. This is the only place tokens are minted.
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
}
