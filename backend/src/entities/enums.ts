// Central place for all lifecycle / role enums used across entities.
// Keeping these in one file avoids drift between entity definitions and
// the status-transition validation logic in the services layer.

export enum UserRole {
  WORKER = 'WORKER',
  EMPLOYER = 'EMPLOYER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  FILLED = 'FILLED',
}

export enum WorkType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  GIG = 'GIG',
  CONTRACT = 'CONTRACT',
}

export enum CompensationType {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum HiringStatus {
  CREATED = 'CREATED',
  CONTRACT_DRAFTED = 'CONTRACT_DRAFTED',
  CANCELLED = 'CANCELLED',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED',
}

export enum WorkEntryStatus {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CORRECTING = 'CORRECTING',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum RaterRole {
  WORKER = 'WORKER',
  EMPLOYER = 'EMPLOYER',
}

// --- Contact-unlock / monetization enums (worker <-> buyer directory gating) ---

export enum PlanAudience {
  WORKER = 'WORKER',
  EMPLOYER = 'EMPLOYER',
}

export enum PlanType {
  ONE_TIME = 'ONE_TIME',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum UnlockMethod {
  FREE = 'FREE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  CREDIT = 'CREDIT',
}

export enum AadhaarPreference {
  NOT_REQUIRED = 'NOT_REQUIRED',
  REQUIRED = 'REQUIRED',
}

// Admin can force a job's Aadhaar rule regardless of the buyer's own
// preference. NULL/absent override means "use the buyer's preference".
export enum AadhaarOverride {
  MANDATORY = 'MANDATORY',
  OPTIONAL = 'OPTIONAL',
}

