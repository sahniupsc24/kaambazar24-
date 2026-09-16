export enum UserRole {
  WORKER = 'WORKER',
  EMPLOYER = 'EMPLOYER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  avatarUrl?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Location {
  id: string;
  name: string;
  level: string;
  slug?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string | null;
  category: Category;
  location: Location;
  workType: string;
  compensationType: string;
  compensationRate: string;
  openings?: number | null;
  status: string;
  createdAt: string;
  isFeatured?: boolean;
  aadhaarRequired?: boolean;
  employerProfile?: { id: string; businessName: string; isVerified?: boolean; userId?: string };
}

export interface Application {
  id: string;
  jobId: string;
  status: string;
  coverNote?: string | null;
  createdAt: string;
  job?: Job;
}

export interface WorkContract {
  id: string;
  hiringId: string;
  status: string;
  compensationType: string;
  agreementRate: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface WorkEntry {
  id: string;
  contractId: string;
  workDate: string;
  hoursWorked: string;
  status: string;
  workerNotes?: string | null;
}

export interface Payment {
  id: string;
  contractId: string;
  amount: string;
  status: string;
  createdAt: string;
}
