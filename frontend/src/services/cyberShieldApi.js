import { apiClient, unwrap } from "../api/client.js";
import { auditLogs, chartData, dashboardSummary, incidents, lessons, mockUser, phishingSimulations, quizzes, users } from "../data/mockData.js";

async function withFallback(request, fallback) {
  try {
    return unwrap(await request());
  } catch (error) {
    // Only substitute demo data when the backend is actually unreachable (no
    // response at all, e.g. running the UI without a Django server). A real
    // response — 401, 403, 500, validation errors — must propagate so callers
    // (and the user) see the real failure instead of silently rendering
    // fabricated data as if it were live.
    if (import.meta.env.DEV && !error.response) {
      return typeof fallback === "function" ? fallback(error) : fallback;
    }
    throw error;
  }
}

export const authService = {
  async login(credentials) {
    return withFallback(
      () => apiClient.post("/auth/login/", credentials),
      () => ({
        access: "demo-access-token",
        refresh: "demo-refresh-token",
        user: mockUser,
      }),
    );
  },
  async register(payload) {
    return withFallback(() => apiClient.post("/auth/register/", payload), { ...mockUser, email: payload.email });
  },
  async me() {
    return withFallback(() => apiClient.get("/auth/me/"), mockUser);
  },
  async logout(refresh) {
    return withFallback(() => apiClient.post("/auth/logout/", { refresh }), {});
  },
  async resetPassword(email) {
    return withFallback(() => apiClient.post("/auth/password-reset/", { email }), {});
  },
  async confirmPasswordReset(payload) {
    return withFallback(() => apiClient.post("/auth/password-reset/confirm/", payload), {});
  },
  async verifyEmail(token) {
    return withFallback(() => apiClient.post("/auth/verify-email/", { token }), {});
  },
  // Account self-service. No demo fallback: pretending to save a password would be worse than failing.
  updateProfile: (patch) => apiClient.patch("/auth/me/", patch).then(unwrap),
  changePassword: (payload) => apiClient.post("/auth/change-password/", payload).then(unwrap),
  sessions: () => apiClient.get("/auth/sessions/", { params: { page_size: 50 } }).then(unwrap),
  revokeSession: (id) => apiClient.post(`/auth/sessions/${id}/revoke/`).then(unwrap),
};

export const dashboardService = {
  summary: () => withFallback(() => apiClient.get("/analytics/me/"), dashboardSummary),
};

export const trainingService = {
  lessons: () => withFallback(() => apiClient.get("/training/lessons/", { params: { page_size: 100 } }), lessons),
  lesson: (slug) => withFallback(() => apiClient.get(`/training/lessons/${slug}/`), lessons.find((item) => item.slug === slug) || lessons[0]),
  updateProgress: (slug, progressPercent) =>
    withFallback(
      () => apiClient.post(`/training/lessons/${slug}/progress/`, { progress_percent: progressPercent }),
      () => ({ progress_percent: progressPercent, completed_at: progressPercent >= 100 ? new Date().toISOString() : null }),
    ),
  complete: (slug) =>
    withFallback(
      () => apiClient.post(`/training/lessons/${slug}/complete/`),
      () => ({ progress_percent: 100, completed_at: new Date().toISOString() }),
    ),
  setBookmark: (slug, bookmarked) =>
    withFallback(
      () => (bookmarked ? apiClient.post(`/training/lessons/${slug}/bookmark/`) : apiClient.delete(`/training/lessons/${slug}/bookmark/`)),
      () => ({ bookmarked }),
    ),
};

export const quizService = {
  attemptsFor: (quizId) => apiClient.get(`/quizzes/quizzes/${quizId}/attempts/`).then(unwrap),
  attempt: (id) => apiClient.get(`/quizzes/attempts/${id}/`).then(unwrap),
  // Opens (or resumes) a server-side attempt so duration is measured from when the quiz was opened.
  start: (id) => withFallback(() => apiClient.post(`/quizzes/quizzes/${id}/start/`), () => ({ id: null })),
  list: () => withFallback(() => apiClient.get("/quizzes/quizzes/", { params: { page_size: 100 } }), quizzes),
  detail: (id) => withFallback(() => apiClient.get(`/quizzes/quizzes/${id}/`), quizzes.find((quiz) => String(quiz.id) === String(id)) || quizzes[0]),
  submit: (id, payload) =>
    withFallback(
      () => apiClient.post(`/quizzes/quizzes/${id}/submit/`, payload),
      () => {
        const quiz = quizzes.find((item) => String(item.id) === String(id)) || quizzes[0];
        const correct = payload.answers.filter((answer) => {
          const question = quiz.questions.find((item) => item.id === answer.question_id);
          return question?.correctAnswerId === answer.answer_id;
        }).length;
        const score = Math.round((correct / Math.max(quiz.questions.length, 1)) * 100);
        return {
          id: Date.now(),
          quiz: id,
          quiz_title: quiz.title,
          score,
          passed: score >= quiz.pass_score,
          weakness_map: {
            "URL Inspection": { score },
            "Malware Prevention": { score: Math.max(40, score - 10) },
            "Social Engineering": { score: Math.min(100, score + 8) },
          },
          recommendations: quiz.questions.map((question) => ({ competency: question.competency, recommendation: question.explanation })),
        };
      },
    ),
};

export const phishingService = {
  simulations: () => withFallback(() => apiClient.get("/phishing/simulations/", { params: { page_size: 100 } }), phishingSimulations),
  submit: (id, payload) =>
    withFallback(
      () => apiClient.post(`/phishing/simulations/${id}/submit/`, payload),
      () => {
        const simulation = phishingSimulations.find((item) => item.id === id) || phishingSimulations[0];
        const expected = simulation.is_phishing ? "suspicious" : "safe";
        const correct = payload.classification === expected;
        return {
          id: Date.now(),
          simulation: id,
          classification: payload.classification,
          correct,
          score: correct ? 92 : 38,
          feedback: {
            expected,
            red_flags: simulation.red_flags,
            training_tip: simulation.training_tip,
            ai_detection_mock: {
              risk_score: simulation.is_phishing ? 91 : 14,
              signals: simulation.is_phishing ? ["sender mismatch", "urgent language", "credential request"] : ["known sender", "no credential request"],
            },
          },
        };
      },
    ),
};

export const incidentService = {
  // The API paginates at 20; the tracker filters/pages client-side, so ask for the maximum page.
  list: () => withFallback(() => apiClient.get("/incidents/incidents/", { params: { page_size: 100 } }), incidents),
  detail: (id) =>
    withFallback(
      () => apiClient.get(`/incidents/incidents/${id}/`),
      () => incidents.find((item) => String(item.id) === String(id)) || null,
    ),
  queue: () =>
    withFallback(
      () => apiClient.get("/incidents/incidents/queue/"),
      () =>
        incidents.reduce((acc, incident) => {
          acc[incident.status] = [...(acc[incident.status] || []), incident];
          return acc;
        }, {}),
    ),
  // Turns a saved draft into a submitted report.
  submit: (id) => apiClient.post(`/incidents/incidents/${id}/submit/`).then(unwrap),
  create: (payload) =>
    withFallback(
      () => {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (key === "attachments") {
            value?.forEach((file) => formData.append("attachments", file));
          } else {
            formData.append(key, value);
          }
        });
        return apiClient.post("/incidents/incidents/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      },
      { ...payload, id: Date.now(), reference_number: "INC-DEMO-DRAFT" },
    ),
  assign: (id, officerId, note = "") =>
    withFallback(() => apiClient.post(`/incidents/incidents/${id}/assign/`, { officer_id: officerId, note }), {}),
  transition: (id, status, note, isInternal = false) =>
    withFallback(() => apiClient.post(`/incidents/incidents/${id}/transition/`, { status, note, is_internal: isInternal }), {}),
};

export const analyticsService = {
  charts: () => withFallback(() => apiClient.get("/analytics/charts/"), chartData),
  organization: () =>
    withFallback(() => apiClient.get("/analytics/organization/"), {
      active_users: 348,
      training_completion_rate: 74,
      quiz_average: 82,
      phishing_average: 78,
      incidents_30d: 11,
      critical_open: 1,
      organization_risk_score: 42,
    }),
};

export const adminService = {
  // No demo fallback: showing fake quizzes here would let someone "save" settings that go nowhere.
  quizzes: () => apiClient.get("/quizzes/quizzes/", { params: { page_size: 100 } }).then(unwrap),
  updateQuiz: (id, patch) => apiClient.patch(`/quizzes/quizzes/${id}/`, patch).then(unwrap),
  users: () => withFallback(() => apiClient.get("/auth/users/", { params: { page_size: 100 } }), users),
  roles: () => apiClient.get("/auth/roles/", { params: { page_size: 50 } }).then(unwrap),
  updateUser: (id, patch) => apiClient.patch(`/auth/users/${id}/`, patch).then(unwrap),
  setUserActive: (id, active) => apiClient.post(`/auth/users/${id}/${active ? "activate" : "deactivate"}/`).then(unwrap),
  resetFailedLogins: (id) => apiClient.post(`/auth/users/${id}/reset_failed_logins/`).then(unwrap),
  auditLogs: () => withFallback(() => apiClient.get("/audit/logs/", { params: { page_size: 100 } }), auditLogs),
  async exportAuditLogs() {
    const response = await apiClient.get("/audit/logs/export/", { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit_logs.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};

// Content authoring (system administrators). No demo fallback: a create or edit that
// only "succeeds" locally would silently lose the author's work.
export const contentService = {
  categories: () => apiClient.get("/training/categories/", { params: { page_size: 100 } }).then(unwrap),
  createCategory: (payload) => apiClient.post("/training/categories/", payload).then(unwrap),
  updateCategory: (id, patch) => apiClient.patch(`/training/categories/${id}/`, patch).then(unwrap),
  deleteCategory: (id) => apiClient.delete(`/training/categories/${id}/`),

  lessons: () => apiClient.get("/training/lessons/", { params: { page_size: 100 } }).then(unwrap),
  lesson: (slug) => apiClient.get(`/training/lessons/${slug}/`).then(unwrap),
  createLesson: (payload) => apiClient.post("/training/lessons/", payload).then(unwrap),
  updateLesson: (slug, patch) => apiClient.patch(`/training/lessons/${slug}/`, patch).then(unwrap),
  deleteLesson: (slug) => apiClient.delete(`/training/lessons/${slug}/`),

  quizzes: () => apiClient.get("/quizzes/quizzes/", { params: { page_size: 100 } }).then(unwrap),
  // Includes which answers are correct; learner endpoints deliberately hide that.
  quiz: (id) => apiClient.get(`/quizzes/quizzes/${id}/editor/`).then(unwrap),
  createQuiz: (payload) => apiClient.post("/quizzes/quizzes/", payload).then(unwrap),
  updateQuiz: (id, patch) => apiClient.patch(`/quizzes/quizzes/${id}/`, patch).then(unwrap),
  deleteQuiz: (id) => apiClient.delete(`/quizzes/quizzes/${id}/`),

  simulations: () => apiClient.get("/phishing/simulations/", { params: { page_size: 100 } }).then(unwrap),
  simulation: (id) => apiClient.get(`/phishing/simulations/${id}/`).then(unwrap),
  createSimulation: (payload) => apiClient.post("/phishing/simulations/", payload).then(unwrap),
  updateSimulation: (id, patch) => apiClient.patch(`/phishing/simulations/${id}/`, patch).then(unwrap),
  deleteSimulation: (id) => apiClient.delete(`/phishing/simulations/${id}/`),
};
