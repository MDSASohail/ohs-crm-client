import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ROLES } from "./constants/roles";
import { checkAuthThunk } from "./features/auth/authSlice";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Spinner from "./components/ui/Spinner";

// Auth
import LoginPage from "./pages/auth/LoginPage";

// Dashboard
import DashboardPage from "./pages/dashboard/DashboardPage";

// Candidates
import CandidatesPage from "./pages/candidates/CandidatesPage";
import CandidateDetailPage from "./pages/candidates/CandidateDetailPage";
import AddCandidatePage from "./pages/candidates/AddCandidatePage";

// Enrollments
import EnrollmentsPage from "./pages/enrollments/EnrollmentsPage";
import EnrollmentDetailPage from "./pages/enrollments/EnrollmentDetailPage";
import AddEnrollmentPage from "./pages/enrollments/AddEnrollmentPage";

// Payments
import PaymentsPage from "./pages/payments/PaymentsPage";

// Institutes
import InstitutesPage from "./pages/institutes/InstitutesPage";
import InstituteDetailPage from "./pages/institutes/InstituteDetailPage";

// Courses
import CoursesPage from "./pages/courses/CoursesPage";
import CourseDetailPage from "./pages/courses/CourseDetailPage";

// Reminders
import RemindersPage from "./pages/reminders/RemindersPage";

// Reports
import ReportsPage from "./pages/reports/ReportsPage";

// Activity Log
import ActivityPage from "./pages/activity/ActivityPage";

// Settings
import SettingsPage from "./pages/settings/SettingsPage";

// 404
import NotFoundPage from "./pages/NotFoundPage";

const AppRoutes = () => {
  const { isCheckingAuth } = useAuth();

  // Show full screen spinner while verifying session on page refresh
  if (isCheckingAuth) {
    return (
      <main className="h-screen flex items-center justify-center bg-neutral">
        <Spinner size="lg" />
      </main>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ── All authenticated roles ────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/candidates/add" element={<AddCandidatePage />} />
        <Route path="/candidates/:id" element={<CandidateDetailPage />} />
        <Route path="/enrollments" element={<EnrollmentsPage />} />
        <Route path="/enrollments/add" element={<AddEnrollmentPage />} />
        <Route path="/enrollments/:id" element={<EnrollmentDetailPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
      </Route>

      {/* ── Admin + Root only ──────────────────────────────────────────── */}
      <Route
        element={<ProtectedRoute allowedRoles={[ROLES.ROOT, ROLES.ADMIN]} />}
      >
        <Route path="/institutes" element={<InstitutesPage />} />
        <Route path="/institutes/:id" element={<InstituteDetailPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
      </Route>


      {/* ── All authenticated roles — settings (profile visible to all) ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/profile" element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const App = () => {
  const dispatch = useDispatch();
  const data = useSelector(store=>store);
  console.log("Data is ", data)

  // On every app load, attempt to restore session from refresh token cookie
  useEffect(() => {
    dispatch(checkAuthThunk());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;