import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema migration.
 *
 * Ordering respects foreign-key dependencies throughout (spec rule 36):
 *   users -> (worker_profiles, employer_profiles) -> categories/locations
 *   -> jobs -> applications -> hirings -> work_contracts -> work_entries
 *   -> work_summaries -> payments -> payment_work_entries
 *   -> contract_ratings -> reputation_summaries
 *   plus independent: roles, audit_logs, otp_records
 *
 * Mandatory constraints implemented here:
 *   - UNIQUE(payment_work_entries.workEntryId)      [spec section 18]
 *   - UNIQUE(contract_ratings.contractId, raterUserId) [spec section 23]
 *   - CHECK on work_entries.hoursWorked (0, 24]
 *   - CHECK on contract_ratings.score (1..5)
 */
export class InitialSchema1735000000000 implements MigrationInterface {
  name = 'InitialSchema1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---- Enums ----
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('WORKER','EMPLOYER','ADMIN','SUPER_ADMIN')`);
    await queryRunner.query(`CREATE TYPE "roles_name_enum" AS ENUM ('WORKER','EMPLOYER','ADMIN','SUPER_ADMIN')`);
    await queryRunner.query(`CREATE TYPE "locations_level_enum" AS ENUM ('COUNTRY','STATE','CITY','AREA')`);
    await queryRunner.query(`CREATE TYPE "jobs_worktype_enum" AS ENUM ('FULL_TIME','PART_TIME','GIG','CONTRACT')`);
    await queryRunner.query(`CREATE TYPE "jobs_status_enum" AS ENUM ('DRAFT','OPEN','CLOSED','FILLED')`);
    await queryRunner.query(`CREATE TYPE "compensation_type_enum" AS ENUM ('HOURLY','DAILY','WEEKLY','MONTHLY')`);
    await queryRunner.query(`CREATE TYPE "applications_status_enum" AS ENUM ('SUBMITTED','UNDER_REVIEW','ACCEPTED','REJECTED','WITHDRAWN')`);
    await queryRunner.query(`CREATE TYPE "hirings_status_enum" AS ENUM ('CREATED','CONTRACT_DRAFTED','CANCELLED')`);
    await queryRunner.query(`CREATE TYPE "contracts_status_enum" AS ENUM ('DRAFT','SENT','ACCEPTED','ACTIVE','COMPLETED','TERMINATED')`);
    await queryRunner.query(`CREATE TYPE "work_entries_status_enum" AS ENUM ('SUBMITTED','APPROVED','REJECTED','CORRECTING')`);
    await queryRunner.query(`CREATE TYPE "payments_status_enum" AS ENUM ('PENDING','PROCESSING','PAID','FAILED')`);
    await queryRunner.query(`CREATE TYPE "rater_role_enum" AS ENUM ('WORKER','EMPLOYER')`);
    await queryRunner.query(`CREATE TYPE "otp_purpose_enum" AS ENUM ('REGISTRATION','LOGIN','PASSWORD_RESET','PHONE_VERIFICATION')`);

    // ---- Foundation: users ----
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "email" varchar(255) NOT NULL UNIQUE,
        "phone" varchar(20) UNIQUE,
        "passwordHash" varchar(255) NOT NULL,
        "role" users_role_enum NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "isEmailVerified" boolean NOT NULL DEFAULT false,
        "isPhoneVerified" boolean NOT NULL DEFAULT false,
        "lastLoginAt" timestamptz
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email");`);

    // ---- roles (descriptive metadata only, not the RBAC source of truth) ----
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "name" roles_name_enum NOT NULL UNIQUE,
        "displayName" varchar(100) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true
      );
    `);

    // ---- categories ----
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "name" varchar(150) NOT NULL UNIQUE,
        "slug" varchar(160) NOT NULL UNIQUE,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true
      );
    `);

    // ---- locations (closure-table tree) ----
    await queryRunner.query(`
      CREATE TABLE "locations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "name" varchar(150) NOT NULL,
        "slug" varchar(160) NOT NULL UNIQUE,
        "level" locations_level_enum NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "parentId" uuid REFERENCES "locations"("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "locations_closure" (
        "id_ancestor" uuid NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
        "id_descendant" uuid NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
        PRIMARY KEY ("id_ancestor", "id_descendant")
      );
    `);

    // ---- worker_profiles / employer_profiles (depend on users, categories, locations) ----
    await queryRunner.query(`
      CREATE TABLE "worker_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "fullName" varchar(150) NOT NULL,
        "bio" text,
        "experienceYears" int NOT NULL DEFAULT 0,
        "skills" jsonb NOT NULL DEFAULT '[]',
        "primaryCategoryId" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
        "locationId" uuid REFERENCES "locations"("id") ON DELETE SET NULL,
        "isProfileComplete" boolean NOT NULL DEFAULT false,
        "isAvailable" boolean NOT NULL DEFAULT false
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "worker_profile_categories" (
        "workerProfileId" uuid NOT NULL REFERENCES "worker_profiles"("id") ON DELETE CASCADE,
        "categoryId" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
        PRIMARY KEY ("workerProfileId", "categoryId")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "employer_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "businessName" varchar(200) NOT NULL,
        "businessDescription" text,
        "contactPersonName" varchar(100),
        "contactPhone" varchar(20),
        "primaryCategoryId" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
        "locationId" uuid REFERENCES "locations"("id") ON DELETE SET NULL,
        "address" varchar(255),
        "isVerified" boolean NOT NULL DEFAULT false,
        "isProfileComplete" boolean NOT NULL DEFAULT false
      );
    `);

    // ---- jobs ----
    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "employerProfileId" uuid NOT NULL REFERENCES "employer_profiles"("id") ON DELETE CASCADE,
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL,
        "requirements" text,
        "categoryId" uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
        "locationId" uuid NOT NULL REFERENCES "locations"("id") ON DELETE RESTRICT,
        "workType" jobs_worktype_enum NOT NULL DEFAULT 'GIG',
        "compensationType" compensation_type_enum NOT NULL DEFAULT 'DAILY',
        "compensationRate" numeric(12,2) NOT NULL,
        "openings" int NOT NULL DEFAULT 1,
        "status" jobs_status_enum NOT NULL DEFAULT 'OPEN',
        "applicationDeadline" timestamptz
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_employerProfileId" ON "jobs" ("employerProfileId");`);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_categoryId" ON "jobs" ("categoryId");`);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_locationId" ON "jobs" ("locationId");`);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_status" ON "jobs" ("status");`);

    // ---- applications ----
    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "jobId" uuid NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
        "workerProfileId" uuid NOT NULL REFERENCES "worker_profiles"("id") ON DELETE CASCADE,
        "coverNote" text,
        "status" applications_status_enum NOT NULL DEFAULT 'SUBMITTED',
        "employerReviewNote" text,
        "reviewedAt" timestamptz,
        CONSTRAINT "UQ_application_job_worker" UNIQUE ("jobId", "workerProfileId")
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_applications_jobId" ON "applications" ("jobId");`);
    await queryRunner.query(`CREATE INDEX "IDX_applications_workerProfileId" ON "applications" ("workerProfileId");`);
    await queryRunner.query(`CREATE INDEX "IDX_applications_status" ON "applications" ("status");`);

    // ---- hirings ----
    await queryRunner.query(`
      CREATE TABLE "hirings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "applicationId" uuid NOT NULL UNIQUE REFERENCES "applications"("id") ON DELETE RESTRICT,
        "jobId" uuid NOT NULL REFERENCES "jobs"("id") ON DELETE RESTRICT,
        "workerProfileId" uuid NOT NULL REFERENCES "worker_profiles"("id") ON DELETE RESTRICT,
        "employerProfileId" uuid NOT NULL REFERENCES "employer_profiles"("id") ON DELETE RESTRICT,
        "status" hirings_status_enum NOT NULL DEFAULT 'CREATED'
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_hirings_jobId" ON "hirings" ("jobId");`);
    await queryRunner.query(`CREATE INDEX "IDX_hirings_workerProfileId" ON "hirings" ("workerProfileId");`);
    await queryRunner.query(`CREATE INDEX "IDX_hirings_employerProfileId" ON "hirings" ("employerProfileId");`);

    // ---- work_contracts ----
    await queryRunner.query(`
      CREATE TABLE "work_contracts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "hiringId" uuid NOT NULL UNIQUE REFERENCES "hirings"("id") ON DELETE RESTRICT,
        "workerProfileId" uuid NOT NULL REFERENCES "worker_profiles"("id") ON DELETE RESTRICT,
        "employerProfileId" uuid NOT NULL REFERENCES "employer_profiles"("id") ON DELETE RESTRICT,
        "compensationType" compensation_type_enum NOT NULL,
        "agreementRate" numeric(12,2) NOT NULL,
        "startDate" date,
        "endDate" date,
        "status" contracts_status_enum NOT NULL DEFAULT 'DRAFT',
        "sentAt" timestamptz,
        "workerAcceptedAt" timestamptz,
        "activatedAt" timestamptz,
        "completedAt" timestamptz,
        "terminatedAt" timestamptz,
        "terminationReason" text
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_work_contracts_workerProfileId" ON "work_contracts" ("workerProfileId");`);
    await queryRunner.query(`CREATE INDEX "IDX_work_contracts_employerProfileId" ON "work_contracts" ("employerProfileId");`);
    await queryRunner.query(`CREATE INDEX "IDX_work_contracts_status" ON "work_contracts" ("status");`);

    // ---- work_entries ----
    await queryRunner.query(`
      CREATE TABLE "work_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "contractId" uuid NOT NULL REFERENCES "work_contracts"("id") ON DELETE CASCADE,
        "workDate" date NOT NULL,
        "hoursWorked" numeric(5,2) NOT NULL,
        "workerNotes" text,
        "employerInternalNote" text,
        "status" work_entries_status_enum NOT NULL DEFAULT 'SUBMITTED',
        "reviewedAt" timestamptz,
        "reviewedByUserId" uuid,
        "isSettled" boolean NOT NULL DEFAULT false,
        CONSTRAINT "UQ_work_entry_contract_date" UNIQUE ("contractId", "workDate"),
        CONSTRAINT "CHK_work_entries_hours" CHECK ("hoursWorked" > 0 AND "hoursWorked" <= 24)
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_work_entries_contractId" ON "work_entries" ("contractId");`);
    await queryRunner.query(`CREATE INDEX "IDX_work_entries_status" ON "work_entries" ("status");`);

    // ---- work_summaries ----
    await queryRunner.query(`
      CREATE TABLE "work_summaries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "contractId" uuid NOT NULL UNIQUE REFERENCES "work_contracts"("id") ON DELETE CASCADE,
        "totalHoursSubmitted" numeric(10,2) NOT NULL DEFAULT 0,
        "totalHoursApproved" numeric(10,2) NOT NULL DEFAULT 0,
        "totalHoursRejected" numeric(10,2) NOT NULL DEFAULT 0,
        "totalHoursSettled" numeric(10,2) NOT NULL DEFAULT 0,
        "pendingEntryCount" int NOT NULL DEFAULT 0
      );
    `);

    // ---- payments ----
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "contractId" uuid NOT NULL REFERENCES "work_contracts"("id") ON DELETE RESTRICT,
        "amount" numeric(12,2) NOT NULL,
        "status" payments_status_enum NOT NULL DEFAULT 'PENDING',
        "reference" varchar(100),
        "failureReason" text,
        "processedAt" timestamptz,
        "createdByUserId" uuid NOT NULL
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_payments_contractId" ON "payments" ("contractId");`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_status" ON "payments" ("status");`);

    // ---- payment_work_entries (MANDATORY unique constraint: spec section 18) ----
    await queryRunner.query(`
      CREATE TABLE "payment_work_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "paymentId" uuid NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
        "workEntryId" uuid NOT NULL REFERENCES "work_entries"("id") ON DELETE RESTRICT,
        "amountForEntry" numeric(12,2) NOT NULL,
        CONSTRAINT "UQ_payment_work_entries_workEntryId" UNIQUE ("workEntryId")
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_payment_work_entries_paymentId" ON "payment_work_entries" ("paymentId");`);

    // ---- contract_ratings (MANDATORY unique constraint: spec section 23) ----
    await queryRunner.query(`
      CREATE TABLE "contract_ratings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "contractId" uuid NOT NULL REFERENCES "work_contracts"("id") ON DELETE CASCADE,
        "raterUserId" uuid NOT NULL,
        "raterRole" rater_role_enum NOT NULL,
        "ratedUserId" uuid NOT NULL,
        "score" int NOT NULL,
        "comment" text,
        "isRemovedByAdmin" boolean NOT NULL DEFAULT false,
        "adminRemovalReason" text,
        CONSTRAINT "UQ_contract_ratings_contract_rater" UNIQUE ("contractId", "raterUserId"),
        CONSTRAINT "CHK_contract_ratings_score" CHECK ("score" >= 1 AND "score" <= 5)
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_contract_ratings_contractId" ON "contract_ratings" ("contractId");`);

    // ---- reputation_summaries ----
    await queryRunner.query(`
      CREATE TABLE "reputation_summaries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL UNIQUE,
        "averageScore" numeric(3,2) NOT NULL DEFAULT 0,
        "totalRatings" int NOT NULL DEFAULT 0,
        "fiveStarCount" int NOT NULL DEFAULT 0,
        "fourStarCount" int NOT NULL DEFAULT 0,
        "threeStarCount" int NOT NULL DEFAULT 0,
        "twoStarCount" int NOT NULL DEFAULT 0,
        "oneStarCount" int NOT NULL DEFAULT 0,
        "lastRecalculatedAt" timestamptz
      );
    `);

    // ---- audit_logs (independent) ----
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actorUserId" uuid,
        "actorRole" varchar(50),
        "action" varchar(100) NOT NULL,
        "entityType" varchar(100) NOT NULL,
        "entityId" uuid,
        "metadata" jsonb,
        "ipAddress" varchar(64),
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_actorUserId" ON "audit_logs" ("actorUserId");`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action");`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entityType" ON "audit_logs" ("entityType");`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entityId" ON "audit_logs" ("entityId");`);

    // ---- otp_records (independent) ----
    await queryRunner.query(`
      CREATE TABLE "otp_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "identifier" varchar(255) NOT NULL,
        "codeHash" varchar(255) NOT NULL,
        "purpose" otp_purpose_enum NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "attemptCount" int NOT NULL DEFAULT 0,
        "isUsed" boolean NOT NULL DEFAULT false
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_otp_records_identifier" ON "otp_records" ("identifier");`);

    // Seed the four fixed roles (descriptive metadata table).
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "displayName", "description") VALUES
        ('WORKER', 'Worker', 'Job seekers who apply to and perform work'),
        ('EMPLOYER', 'Employer', 'Businesses who post jobs and hire workers'),
        ('ADMIN', 'Administrator', 'Platform staff with administrative oversight'),
        ('SUPER_ADMIN', 'Super Administrator', 'Highest-privilege platform administrator');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse dependency order.
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_records";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reputation_summaries";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contract_ratings";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_work_entries";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_summaries";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_entries";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_contracts";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hirings";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "applications";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jobs";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employer_profiles";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "worker_profile_categories";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "worker_profiles";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "locations_closure";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "locations";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);

    await queryRunner.query(`DROP TYPE IF EXISTS "otp_purpose_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "rater_role_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payments_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "work_entries_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "contracts_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "hirings_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "applications_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "compensation_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "jobs_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "jobs_worktype_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "locations_level_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "roles_name_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum";`);
  }
}
