# AI Workforce Marketplace — India-First Workforce Platform

A full-stack marketplace connecting Workers, Employers, and Platform Admins,
covering the complete lifecycle:

```
User → Profile → Job → Application → Accepted → Hiring → Work Contract →
Active Contract → Work Entry → Employer Approval → Approved Work →
Payment → Paid/Failed → Contract Completion/Termination → Rating → Reputation
```

Stack: **Node.js + TypeScript + Express + TypeORM + PostgreSQL** (backend),
**React + TypeScript** (frontend).

---

## 1. Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ running locally or accessible via network
- A `.env` file in `backend/` (copy `.env.example` and fill in real secrets)

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set DB_* to your Postgres instance, and set strong
# JWT_ACCESS_SECRET / JWT_REFRESH_SECRET values (never commit these)

npm install
npm run migration:run   # creates all tables, enums, indexes, constraints
npm run dev              # starts the API on http://localhost:4000
```

Health check: `GET http://localhost:4000/health` should return `{"success":true,"status":"ok"}`.

### Seeding categories/locations

The migration seeds the `roles` reference table only. Categories and
locations are empty by default — create them via the admin API
(`POST /api/admin` is not a thing; use `POST /api/categories` and
`POST /api/locations` while authenticated as ADMIN/SUPER_ADMIN) or insert
seed rows directly before onboarding real users, since jobs and profiles
reference them as required foreign keys.

You will also need at least one ADMIN/SUPER_ADMIN user to manage
categories/locations and moderate the platform. Self-registration only
issues WORKER or EMPLOYER accounts by design (spec section 7) — create the
first admin directly in the database (hash a password with bcrypt, insert
a `users` row with `role = 'ADMIN'`), then manage further admins via that
account.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev   # starts on http://localhost:3000, proxies /api to :4000
```

## 4. Project structure

```
backend/
  src/
    entities/       TypeORM entities (one file per table + enums.ts)
    migrations/      Ordered schema migrations (raw SQL via QueryRunner)
    services/        Business logic; all ownership/RBAC/validation lives here
    controllers/      Thin HTTP layer over services
    routes/          Express routers, grouped by module
    middleware/       authenticate, authorize, error handling, validation
    utils/           ApiError, JWT helpers, password hashing, asyncHandler
    config/          env.ts, data-source.ts (TypeORM DataSource)
    app.ts / server.ts

frontend/
  src/
    pages/            Public site + worker/employer/admin dashboard pages
    layouts/           DashboardLayout (role-aware sidebar nav)
    contexts/           AuthContext (session, login/register/logout)
    components/         NavBar, shared UI primitives (StatusBadge, Card, etc.)
    api/               Axios client with JWT attach + 401 handling
    routes/             ProtectedRoute (client-side route gating)
    types/              Shared TS types mirroring backend entities/enums
```

## 5. Security notes (see also inline comments)

- **RBAC**: `authorize(...)` middleware checks `req.user.role`, which is
  always re-loaded from the database on every request in `authenticate` —
  never trusted from the JWT alone, so a role change or deactivation takes
  effect immediately.
- **IDOR protection**: `OwnershipService.resolveWorkerProfile /
  resolveEmployerProfile` is the *only* sanctioned way to determine "my
  profile" anywhere in the codebase. No service ever accepts a
  `workerProfileId`/`employerProfileId` from the client as the acting
  identity.
- **Double payment protection**: enforced at the database level via
  `UNIQUE(payment_work_entries.workEntryId)`, with a pessimistic row lock
  in `PaymentService.create` as defense in depth against races.
- **Duplicate rating protection**: enforced at the database level via
  `UNIQUE(contract_ratings.contractId, raterUserId)`.
- **Status transitions**: every lifecycle status change (application,
  hiring, contract, work entry, payment) goes through a dedicated service
  method that checks the *current* status before allowing the transition —
  there is no generic "set status" endpoint anywhere.

## 6. What is NOT included (by design, per scope rules)

No AI features, GPS/biometrics, shift/overtime/break management, chat,
real payment gateway integration, or HRMS features. The payment module is
a settlement **record-keeping system**, not a live payment gateway.

## 7. Known limitations / follow-up work

See `IMPLEMENTATION_REPORT.md` for the full, honest status report,
including what has and has not been executed/verified.
