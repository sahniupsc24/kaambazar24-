-- ========================================================
-- KAAM BAZAR - SUPABASE DATABASE SCHEMA MIGRATION SCRIPT
-- Safe to re-run multiple times
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS (Safe Creation)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('WORKER', 'EMPLOYER', 'ADMIN', 'SUPER_ADMIN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_type') THEN
    CREATE TYPE work_type AS ENUM ('GIG', 'FULL_TIME', 'PART_TIME', 'CONTRACT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compensation_type') THEN
    CREATE TYPE compensation_type AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'FIXED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE application_status AS ENUM ('PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE contract_status AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'ESCROW_HELD', 'RELEASED', 'REFUNDED', 'FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aadhaar_status') THEN
    CREATE TYPE aadhaar_status AS ENUM ('UNSUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED');
  END IF;
END $$;

-- 2. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(150) NOT NULL,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE
);

-- 4. USERS PROFILES TABLE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  role user_role NOT NULL DEFAULT 'WORKER',
  is_active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT
);

-- 5. WORKER PROFILES TABLE
CREATE TABLE IF NOT EXISTS worker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name VARCHAR(150) NOT NULL,
  bio TEXT,
  experience_years INT DEFAULT 0,
  skills JSONB DEFAULT '[]'::jsonb,
  primary_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  aadhaar_number VARCHAR(20),
  aadhaar_status aadhaar_status DEFAULT 'UNSUBMITTED',
  contact_credits INT DEFAULT 0
);

-- 6. EMPLOYER PROFILES TABLE
CREATE TABLE IF NOT EXISTS employer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  company_name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(150) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT FALSE
);

-- 7. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  employer_profile_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  category_id UUID NOT NULL REFERENCES categories(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  work_type work_type DEFAULT 'GIG',
  compensation_type compensation_type DEFAULT 'DAILY',
  compensation_rate NUMERIC(12,2) NOT NULL,
  openings INT DEFAULT 1,
  status job_status DEFAULT 'OPEN',
  application_deadline TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE
);

-- 8. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_profile_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  status application_status DEFAULT 'PENDING',
  cover_note TEXT,
  proposed_rate NUMERIC(12,2),
  UNIQUE(job_id, worker_profile_id)
);

-- 9. WORK CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS work_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  employer_profile_id UUID NOT NULL REFERENCES employer_profiles(id),
  worker_profile_id UUID NOT NULL REFERENCES worker_profiles(id),
  status contract_status DEFAULT 'ACTIVE',
  agreed_rate NUMERIC(12,2) NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_contracts ENABLE ROW LEVEL SECURITY;
