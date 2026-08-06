import { apiClient, unwrap } from "../api/client.js";
import { alerts, auditLogs, chartData, dashboardSummary, incidents, lessons, mockUser, phishingSimulations, quizzes, users } from "../data/mockData.js";

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
};

export const dashboardService = {
  summary: () => withFallback(() => apiClient.get("/analytics/me/"), dashboardSummary),
};

export const trainingService = {
  lessons: () => withFallback(() => apiClient.get("/training/lessons/"), lessons),
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
  list: () => withFallback(() => apiClient.get("/quizzes/quizzes/"), quizzes),
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
  simulations: () => withFallback(() => apiClient.get("/phishing/simulations/"), phishingSimulations),
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
  list: () => withFallback(() => apiClient.get("/incidents/incidents/"), incidents),
  queue: () =>
    withFallback(
      () => apiClient.get("/incidents/incidents/queue/"),
      () =>
        incidents.reduce((acc, incident) => {
          acc[incident.status] = [...(acc[incident.status] || []), incident];
          return acc;
        }, {}),
    ),
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
};

export const alertService = {
  list: () => withFallback(() => apiClient.get("/alerts/alerts/"), alerts),
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
  users: () => withFallback(() => apiClient.get("/auth/users/"), users),
  auditLogs: () => withFallback(() => apiClient.get("/audit/logs/"), auditLogs),
};
