import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { UserRole } from './types';

// Public pages
import { HomePage } from './pages/HomePage';
import { JobListingPage } from './pages/JobListingPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PricingPage } from './pages/PricingPage';

// Worker pages
import { WorkerDashboardPage } from './pages/worker/WorkerDashboardPage';
import { WorkerProfilePage } from './pages/worker/WorkerProfilePage';
import { WorkerApplicationsPage } from './pages/worker/WorkerApplicationsPage';
import { WorkerContractsPage } from './pages/worker/WorkerContractsPage';
import { WorkerPaymentsPage } from './pages/worker/WorkerPaymentsPage';

// Employer pages
import { EmployerDashboardPage } from './pages/employer/EmployerDashboardPage';
import { EmployerProfilePage } from './pages/employer/EmployerProfilePage';
import { EmployerJobsPage } from './pages/employer/EmployerJobsPage';
import { EmployerContractsPage } from './pages/employer/EmployerContractsPage';
import { EmployerPaymentsPage } from './pages/employer/EmployerPaymentsPage';
import { EmployerWorkerSearchPage } from './pages/employer/EmployerWorkerSearchPage';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
import { AdminJobsPage } from './pages/admin/AdminJobsPage';
import { AdminJobDetailPage } from './pages/admin/AdminJobDetailPage';
import { AdminContractsPage } from './pages/admin/AdminContractsPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminLocationsPage } from './pages/admin/AdminLocationsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminVerificationPage } from './pages/admin/AdminVerificationPage';
import { AdminDisputesPage } from './pages/admin/AdminDisputesPage';
import { AdminExportsPage } from './pages/admin/AdminExportsPage';

// Legal pages
import { AboutPage } from './pages/legal/AboutPage';
import { ContactPage } from './pages/legal/ContactPage';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';


const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={ADMIN_ROLES}>{children}</ProtectedRoute>;
}

import { WORKER_NAV_LINKS } from './pages/worker/WorkerDashboardPage';
import { EMPLOYER_NAV_LINKS } from './pages/employer/EmployerDashboardPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { useAuth } from './contexts/AuthContext';

function JobPortalWrapper() {
  const { user } = useAuth();
  
  if (user?.role === 'WORKER') {
    return (
      <DashboardLayout links={WORKER_NAV_LINKS} title="Browse Jobs (नौकरियां खोजें)">
        <JobListingPage />
      </DashboardLayout>
    );
  }
  if (user?.role === 'EMPLOYER') {
    return (
      <DashboardLayout links={EMPLOYER_NAV_LINKS} title="Browse Jobs">
        <JobListingPage />
      </DashboardLayout>
    );
  }
  // Public users see the normal page
  return <JobListingPage />;
}

import { MandatoryPhoneModal } from './components/MandatoryPhoneModal';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Analytics />
        <MandatoryPhoneModal />
        <NavBar />
        <div style={{ minHeight: '70vh' }}>
          <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/jobs" element={<JobPortalWrapper />} />
            <Route path="/jobs/:id" element={<JobDetailsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />


            {/* ── Legal ── */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* ── Worker ── */}
            <Route path="/worker/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.WORKER]}><WorkerDashboardPage /></ProtectedRoute>} />
            <Route path="/worker/profile" element={<ProtectedRoute allowedRoles={[UserRole.WORKER]}><WorkerProfilePage /></ProtectedRoute>} />
            <Route path="/worker/applications" element={<ProtectedRoute allowedRoles={[UserRole.WORKER]}><WorkerApplicationsPage /></ProtectedRoute>} />
            <Route path="/worker/contracts" element={<ProtectedRoute allowedRoles={[UserRole.WORKER]}><WorkerContractsPage /></ProtectedRoute>} />
            <Route path="/worker/payments" element={<ProtectedRoute allowedRoles={[UserRole.WORKER]}><WorkerPaymentsPage /></ProtectedRoute>} />

            {/* ── Employer ── */}
            <Route path="/employer/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.EMPLOYER]}><EmployerDashboardPage /></ProtectedRoute>} />
            <Route path="/employer/profile" element={<ProtectedRoute allowedRoles={[UserRole.EMPLOYER]}><EmployerProfilePage /></ProtectedRoute>} />
            <Route path="/employer/jobs" element={<ProtectedRoute allowedRoles={[UserRole.EMPLOYER]}><EmployerJobsPage /></ProtectedRoute>} />
            <Route path="/employer/contracts" element={<ProtectedRoute allowedRoles={[UserRole.EMPLOYER]}><EmployerContractsPage /></ProtectedRoute>} />
            <Route path="/employer/payments" element={<ProtectedRoute allowedRoles={[UserRole.EMPLOYER]}><EmployerPaymentsPage /></ProtectedRoute>} />
            <Route path="/employer/search-workers" element={<ProtectedRoute allowedRoles={[UserRole.EMPLOYER]}><EmployerWorkerSearchPage /></ProtectedRoute>} />

            {/* ── Admin ── */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
            <Route path="/admin/users/:id" element={<AdminRoute><AdminUserDetailPage /></AdminRoute>} />
            <Route path="/admin/jobs" element={<AdminRoute><AdminJobsPage /></AdminRoute>} />
            <Route path="/admin/jobs/:id" element={<AdminRoute><AdminJobDetailPage /></AdminRoute>} />
            <Route path="/admin/contracts" element={<AdminRoute><AdminContractsPage /></AdminRoute>} />
            <Route path="/admin/payments" element={<AdminRoute><AdminPaymentsPage /></AdminRoute>} />
            <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptionsPage /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
            <Route path="/admin/locations" element={<AdminRoute><AdminLocationsPage /></AdminRoute>} />
            <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogsPage /></AdminRoute>} />
            <Route path="/admin/verification" element={<AdminRoute><AdminVerificationPage /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
            <Route path="/admin/disputes" element={<AdminRoute><AdminDisputesPage /></AdminRoute>} />
            <Route path="/admin/exports" element={<AdminRoute><AdminExportsPage /></AdminRoute>} />
          </Routes>
        </div>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

