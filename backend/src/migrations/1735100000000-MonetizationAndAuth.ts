import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds: admin username login field, worker/employer verification +
 * contact-unlock monetization state, job Aadhaar/featured-listing
 * columns, and four new tables (subscription_plans, contact_unlocks,
 * payment_gateway_settings, platform_settings).
 */
export class MonetizationAndAuth1735100000000 implements MigrationInterface {
  name = 'MonetizationAndAuth1735100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---- users.username (admin login) ----
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "username" varchar(100) UNIQUE;`);

    // ---- worker_profiles: verification + monetization ----
    await queryRunner.query(`ALTER TABLE "worker_profiles" ADD COLUMN "isVerified" boolean NOT NULL DEFAULT false;`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" ADD COLUMN "verificationNote" text;`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" ADD COLUMN "aadhaarNumber" varchar(20);`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" ADD COLUMN "usedFreeContactUnlock" boolean NOT NULL DEFAULT false;`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" ADD COLUMN "contactCredits" int NOT NULL DEFAULT 0;`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" ADD COLUMN "subscriptionExpiresAt" timestamptz;`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" ADD COLUMN "timesContacted" int NOT NULL DEFAULT 0;`);

    // ---- employer_profiles: verification note + monetization ----
    await queryRunner.query(`ALTER TABLE "employer_profiles" ADD COLUMN "verificationNote" text;`);
    await queryRunner.query(`ALTER TABLE "employer_profiles" ADD COLUMN "usedFreeContactUnlock" boolean NOT NULL DEFAULT false;`);
    await queryRunner.query(`ALTER TABLE "employer_profiles" ADD COLUMN "contactCredits" int NOT NULL DEFAULT 0;`);
    await queryRunner.query(`ALTER TABLE "employer_profiles" ADD COLUMN "subscriptionExpiresAt" timestamptz;`);
    await queryRunner.query(`ALTER TABLE "employer_profiles" ADD COLUMN "totalSpend" numeric(12,2) NOT NULL DEFAULT 0;`);

    // ---- jobs: featured listing + Aadhaar ----
    await queryRunner.query(`CREATE TYPE "aadhaar_preference_enum" AS ENUM ('NOT_REQUIRED','REQUIRED')`);
    await queryRunner.query(`CREATE TYPE "aadhaar_override_enum" AS ENUM ('MANDATORY','OPTIONAL')`);
    await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN "isFeatured" boolean NOT NULL DEFAULT false;`);
    await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN "featuredUntil" timestamptz;`);
    await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN "aadhaarBuyerPreference" aadhaar_preference_enum NOT NULL DEFAULT 'NOT_REQUIRED';`);
    await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN "aadhaarAdminOverride" aadhaar_override_enum;`);

    // ---- subscription_plans ----
    await queryRunner.query(`CREATE TYPE "plan_audience_enum" AS ENUM ('WORKER','EMPLOYER')`);
    await queryRunner.query(`CREATE TYPE "plan_type_enum" AS ENUM ('ONE_TIME','SUBSCRIPTION')`);
    await queryRunner.query(`
      CREATE TABLE "subscription_plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "audience" plan_audience_enum NOT NULL,
        "name" varchar(100) NOT NULL,
        "type" plan_type_enum NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "contactsIncluded" int,
        "durationDays" int,
        "isActive" boolean NOT NULL DEFAULT true
      );
    `);

    // ---- contact_unlocks (depends on users, transitively) ----
    await queryRunner.query(`CREATE TYPE "unlock_method_enum" AS ENUM ('FREE','SUBSCRIPTION','CREDIT')`);
    await queryRunner.query(`
      CREATE TABLE "contact_unlocks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "viewerUserId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "viewerRole" plan_audience_enum NOT NULL,
        "targetUserId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "method" unlock_method_enum NOT NULL,
        "amountCharged" numeric(10,2) NOT NULL DEFAULT 0,
        CONSTRAINT "UQ_contact_unlocks_viewer_target" UNIQUE ("viewerUserId", "targetUserId")
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_contact_unlocks_viewerUserId" ON "contact_unlocks" ("viewerUserId");`);
    await queryRunner.query(`CREATE INDEX "IDX_contact_unlocks_targetUserId" ON "contact_unlocks" ("targetUserId");`);

    // ---- payment_gateway_settings ----
    await queryRunner.query(`
      CREATE TABLE "payment_gateway_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "provider" varchar(50) NOT NULL DEFAULT 'razorpay',
        "keyId" varchar(255),
        "keySecret" varchar(255),
        "isEnabled" boolean NOT NULL DEFAULT false
      );
    `);

    // ---- platform_settings ----
    await queryRunner.query(`
      CREATE TABLE "platform_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "key" varchar(100) NOT NULL UNIQUE,
        "value" text NOT NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "platform_settings";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_gateway_settings";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_unlocks";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plans";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "unlock_method_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_audience_enum";`);

    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "aadhaarAdminOverride";`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "aadhaarBuyerPreference";`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "featuredUntil";`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "isFeatured";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "aadhaar_override_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "aadhaar_preference_enum";`);

    await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "totalSpend";`);
    await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "subscriptionExpiresAt";`);
    await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "contactCredits";`);
    await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "usedFreeContactUnlock";`);
    await queryRunner.query(`ALTER TABLE "employer_profiles" DROP COLUMN "verificationNote";`);

    await queryRunner.query(`ALTER TABLE "worker_profiles" DROP COLUMN "timesContacted";`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" DROP COLUMN "subscriptionExpiresAt";`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" DROP COLUMN "contactCredits";`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" DROP COLUMN "usedFreeContactUnlock";`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" DROP COLUMN "aadhaarNumber";`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" DROP COLUMN "verificationNote";`);
    await queryRunner.query(`ALTER TABLE "worker_profiles" DROP COLUMN "isVerified";`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username";`);
  }
}
