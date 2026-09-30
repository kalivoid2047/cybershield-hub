import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Skeleton } from "./components/common/Skeleton.jsx";
import AppShell from "./layouts/AppShell.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
const LoginPage = lazy(() => import("./pages/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage.jsx"));
const VerifyEmailPage = lazy(() => import("./pages/auth/VerifyEmailPage.jsx"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage.jsx"));
const TrainingPage = lazy(() => import("./pages/training/TrainingPage.jsx"));
const LessonDetailPage = lazy(() => import("./pages/training/LessonDetailPage.jsx"));
const QuizListPage = lazy(() => import("./pages/quizzes/QuizListPage.jsx"));
const QuizResultsPage = lazy(() => import("./pages/quizzes/QuizResultsPage.jsx"));
const QuizTakePage = lazy(() => import("./pages/quizzes/QuizTakePage.jsx"));
const PhishingSimulatorPage = lazy(() => import("./pages/phishing/PhishingSimulatorPage.jsx"));
const IncidentReportPage = lazy(() => import("./pages/incidents/IncidentReportPage.jsx"));
const IncidentTrackerPage = lazy(() => import("./pages/incidents/IncidentTrackerPage.jsx"));
const SOCDashboardPage = lazy(() => import("./pages/incidents/SOCDashboardPage.jsx"));
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage.jsx"));
const AlertsPage = lazy(() => import("./pages/alerts/AlertsPage.jsx"));
const AuditLogPage = lazy(() => import("./pages/admin/AuditLogPage.jsx"));
const QuizSettingsPage = lazy(() => import("./pages/admin/QuizSettingsPage.jsx"));
const UsersAdminPage = lazy(() => import("./pages/admin/UsersAdminPage.jsx"));
const IncidentDetailPage = lazy(() => import("./pages/incidents/IncidentDetailPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

function PageFallback() {
  return (
    <div role="status" aria-live="polite" className="p-6">
      <span className="sr-only">Loading…</span>
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="mb-8 h-9 w-72" />
      <Skeleton className="h-64" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/training/:slug" element={<LessonDetailPage />} />
        <Route path="/quizzes" element={<QuizListPage />} />
        <Route path="/quizzes/:id" element={<QuizTakePage />} />
        <Route path="/quizzes/results/:attemptId" element={<QuizResultsPage />} />
        <Route path="/phishing" element={<PhishingSimulatorPage />} />
        <Route path="/incidents" element={<IncidentTrackerPage />} />
        <Route path="/incidents/new" element={<IncidentReportPage />} />
        <Route path="/incidents/:id" element={<IncidentDetailPage />} />
        <Route
          path="/soc"
          element={
            <ProtectedRoute roles={["cybersecurity_officer", "system_admin"]}>
              <SOCDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={["cybersecurity_officer", "system_admin"]}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["system_admin"]}>
              <UsersAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/quizzes"
          element={
            <ProtectedRoute roles={["system_admin"]}>
              <QuizSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute roles={["cybersecurity_officer", "system_admin"]}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}
