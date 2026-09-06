import { AppDataSource } from '../config/data-source';
import { AuditLog } from '../entities/AuditLog';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'otp',
  'otpCode',
  'codeHash',
  'token',
  'accessToken',
  'refreshToken',
]);

function sanitize(metadata: Record<string, unknown> | undefined | null) {
  if (!metadata) return null;
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.has(k)) continue;
    clean[k] = v;
  }
  return clean;
}

export interface AuditEntryInput {
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export class AuditService {
  static async log(entry: AuditEntryInput): Promise<void> {
    const repo = AppDataSource.getRepository(AuditLog);
    await repo.save(
      repo.create({
        actorUserId: entry.actorUserId,
        actorRole: entry.actorRole,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: sanitize(entry.metadata),
        ipAddress: entry.ipAddress ?? null,
      })
    );
  }
}
