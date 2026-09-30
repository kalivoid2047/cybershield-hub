import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layouts/AppShell.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import TrainingPage from "./pages/training/TrainingPage.jsx";
import LessonDetailPage from "./pages/training/LessonDetailPage.jsx";
import QuizListPage from "./pages/quizzes/QuizListPage.jsx";
import QuizTakePage from "./pages/quizzes/QuizTakePage.jsx";
import PhishingSimulatorPage from "./pages/phishing/PhishingSimulatorPage.jsx";
import IncidentReportPage from "./pages/incidents/IncidentReportPage.jsx";
import IncidentTrackerPage from "./pages/incidents/IncidentTrackerPage.jsx";
import SOCDashboardPage from "./pages/incidents/SOCDashboardPage.jsx";
import AnalyticsPage from "./pages/analytics/AnalyticsPage.jsx";
import AlertsPage from "./pages/alerts/AlertsPage.jsx";
import AuditLogPage from "./pages/admin/AuditLogPage.jsx";
import UsersAdminPage from "./pages/admin/UsersAdminPage.jsx";

export default function App() {
  return (
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
        <Route path="/phishing" element={<PhishingSimulatorPage />} />
        <Route path="/incidents" element={<IncidentTrackerPage />} />
        <Route path="/incidents/new" element={<IncidentReportPage />} />
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
          path="/admin/audit"
          element={
            <ProtectedRoute roles={["cybersecurity_officer", "system_admin"]}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
