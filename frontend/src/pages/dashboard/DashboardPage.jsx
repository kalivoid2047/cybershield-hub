import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpen, BrainCircuit, ClipboardList, FileWarning, ShieldCheck, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import { Skeleton } from "../../components/common/Skeleton.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import DoughnutChart from "../../components/charts/DoughnutChart.jsx";
import RadarScoreChart from "../../components/charts/RadarScoreChart.jsx";
import TiltCard from "../../components/common/TiltCard.jsx";
import Shield3D from "../../components/three/Shield3D.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import useAsync from "../../hooks/useAsync.js";
import usePageTitle from "../../hooks/usePageTitle.js";
import { dashboardService, incidentService, quizService, trainingService } from "../../services/cyberShieldApi.js";
import { formatDate } from "../../utils/formatters.js";

function list(value) {
  return Array.isArray(value) ? value : [];
}

export default function DashboardPage() {
  usePageTitle("Dashboard");
  const { user } = useAuth();
  const summary = useAsync(() => dashboardService.summary(), []);
  const lessonsQuery = useAsync(() => trainingService.lessons().then(list), []);
  const incidentsQuery = useAsync(() => incidentService.list().then(list), []);
  const quizzesQuery = useAsync(() => quizService.list().then(list), []);

  const data = summary.data;
  const lessons = lessonsQuery.data || [];
  const incidents = incidentsQuery.data || [];
  const quizzes = quizzesQuery.data || [];
  const score = data?.security_score || user?.security_score || 0;

  // Mirrors the backend's security-score weighting (UserDashboardAnalyticsView):
  // training 35%, quiz 35%, phishing 20%, open-risk headroom the rest — so the
  // chart is an honest breakdown of the number above it, not invented data.
  const completed = data?.learning_progress?.completed || 0;
  const total = data?.learning_progress?.total || 0;
  const trainingContribution = total ? Math.round((completed / total) * 35) : 0;
  const quizContribution = Math.round((data?.quiz_average || 0) * 0.35);
  const phishingContribution = Math.round((data?.phishing_average || 0) * 0.2);
  const riskContribution = Math.max(0, 10 - (data?.open_incidents || 0) * 2);

  const recentLessons = useMemo(() => [...lessons].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)).slice(0, 4), [lessons]);

  // Concrete things to do next, most useful first.
  const actions = useMemo(() => {
    const items = [];
    const inProgress = lessons.filter((lesson) => lesson.progress_percent > 0 && lesson.progress_percent < 100).sort((a, b) => b.progress_percent - a.progress_percent)[0];
    const notStarted = lessons.find((lesson) => !lesson.progress_percent);
    if (inProgress) items.push({ key: "lesson", icon: BookOpen, to: `/training/${inProgress.slug}`, title: `Continue: ${inProgress.title}`, detail: `${inProgress.progress_percent}% complete` });
    else if (notStarted) items.push({ key: "lesson", icon: BookOpen, to: `/training/${notStarted.slug}`, title: `Start: ${notStarted.title}`, detail: `${notStarted.estimated_minutes} min lesson` });
    const quiz = quizzes.find((item) => item.attempts_remaining !== 0 && Number(item.best_score || 0) < Number(item.pass_score || 0));
    if (quiz) items.push({ key: "quiz", icon: BrainCircuit, to: `/quizzes/${quiz.id}`, title: `Take quiz: ${quiz.title}`, detail: `Pass mark ${quiz.pass_score}%` });
    if (data && !data.phishing_average) items.push({ key: "phishing", icon: FileWarning, to: "/phishing", title: "Try the phishing simulator", detail: "Practice spotting suspicious email" });
    return items.slice(0, 4);
  }, [lessons, quizzes, data]);

  const activity = useMemo(() => {
    const fromIncidents = incidents.map((incident) => ({
      key: `incident-${incident.id}`,
      kind: "Incident",
      to: "/incidents",
      title: incident.title,
      meta: incident.reference_number,
      badge: incident.severity,
      date: incident.occurred_at,
    }));
    return fromIncidents.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 6);
  }, [incidents]);

  const loadingSummary = summary.loading && !data;

  return (
    <div className="space-y-6">
      {summary.error && <LoadError error={summary.error} message="We couldn't load your progress summary." onRetry={summary.reload} />}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-panel overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyanx">Security dashboard</p>
            <h1 className="mt-3 text-3xl font-bold text-gradient md:text-4xl">Welcome back, {user?.first_name || "Analyst"}</h1>
            <div className="mt-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-amberx" aria-hidden="true" />
                Next best actions
              </h2>
              {lessonsQuery.loading || quizzesQuery.loading ? (
                <div className="grid gap-3 sm:grid-cols-2" role="status" aria-live="polite">
                  <span className="sr-only">Loading suggestions…</span>
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : actions.length === 0 ? (
                <p className="rounded-md border border-mint/20 bg-mint/10 p-3 text-sm text-emerald-100">You're all caught up. Nice work keeping your security posture strong.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {actions.map((action) => (
                    <li key={action.key}>
                      <Link to={action.to} className="focus-ring group flex h-full items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 transition hover:border-cyanx/30 hover:bg-white/[0.07]">
                        <span className="rounded-md border border-cyanx/20 bg-cyanx/10 p-2 text-cyanx">
                          <action.icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">{action.title}</span>
                          <span className="block truncate text-xs text-slate-400">{action.detail}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-cyanx motion-reduce:transition-none" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <TiltCard className="glass-tile relative overflow-hidden rounded-2xl border-cyanx/25 p-5 text-center">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">Security score</p>
              <ShieldCheck className="h-5 w-5 text-cyanx" aria-hidden="true" />
            </div>
            <div className="parallax -my-3 flex justify-center">
              <Shield3D size={200} />
            </div>
            {loadingSummary ? <Skeleton className="mx-auto h-14 w-24" /> : <p className="text-6xl font-bold text-gradient">{score}</p>}
            <ProgressBar className="mt-4" value={score} />
            <p className="mt-3 text-sm text-slate-400">Based on lessons completed (35%), quiz results (35%), phishing simulations (20%) and open incidents.</p>
          </TiltCard>
        </div>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard to="/training" loading={loadingSummary} icon={BookOpen} label="Learning progress" value={`${completed}/${total}`} detail="Completed lessons" tone="cyan" />
        <MetricCard to="/quizzes" loading={loadingSummary} icon={Target} label="Assessment average" value={`${data?.quiz_average || 0}%`} detail="Quiz performance" tone="green" />
        <MetricCard to="/phishing" loading={loadingSummary} icon={FileWarning} label="Phishing readiness" value={`${data?.phishing_average || 0}%`} detail="Simulation score" tone="amber" />
        <MetricCard to="/incidents" loading={loadingSummary} icon={ClipboardList} label="Open incidents" value={data?.open_incidents || 0} detail="Tracked reports" tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Score breakdown</h2>
            <Award className="h-5 w-5 text-amberx" aria-hidden="true" />
          </div>
          <DoughnutChart labels={["Training", "Quiz", "Phishing", "Open risk"]} values={[trainingContribution, quizContribution, phishingContribution, riskContribution]} />
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Readiness radar</h2>
            <ShieldCheck className="h-5 w-5 text-mint" aria-hidden="true" />
          </div>
          <RadarScoreChart
            labels={["Training completion", "Quiz average", "Phishing readiness"]}
            values={[total ? Math.round((completed / total) * 100) : 0, data?.quiz_average || 0, data?.phishing_average || 0]}
          />
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent lessons</h2>
            <Link to="/training" className="focus-ring rounded text-sm text-cyanx hover:text-sky-200">
              View all
            </Link>
          </div>
          {lessonsQuery.loading ? (
            <div className="grid gap-3 md:grid-cols-2" role="status" aria-live="polite">
              <span className="sr-only">Loading lessons…</span>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : lessonsQuery.error ? (
            <LoadError error={lessonsQuery.error} message="We couldn't load lessons." onRetry={lessonsQuery.reload} />
          ) : recentLessons.length === 0 ? (
            <EmptyState icon={BookOpen} title="No lessons published yet" description="New training will appear here as soon as it's published." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recentLessons.map((lesson) => (
                <Link key={lesson.id} to={`/training/${lesson.slug}`} className="focus-ring rounded-md border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyanx/30 hover:bg-white/[0.06]">
                  <p className="text-sm font-semibold text-white">{lesson.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">{lesson.summary}</p>
                  <ProgressBar className="mt-4" value={lesson.progress_percent || 0} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Recent activity</h2>
          <Link to="/incidents" className="focus-ring rounded text-sm text-cyanx hover:text-sky-200">
            All incidents
          </Link>
        </div>
        {incidentsQuery.loading ? (
          <Skeleton className="h-24" />
        ) : activity.length === 0 ? (
          <p className="py-3 text-sm text-slate-400">Nothing to show yet. Incident reports will appear here.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {activity.map((row) => (
              <li key={row.key}>
                <Link to={row.to} className="focus-ring grid gap-3 rounded py-3 md:grid-cols-[auto_1fr_auto_auto] md:items-center">
                  <span className="w-16 text-xs font-semibold uppercase tracking-wider text-slate-400">{row.kind}</span>
                  <div>
                    <p className="font-medium text-white">{row.title}</p>
                    <p className="mt-1 font-mono text-xs text-cyanx">{row.meta}</p>
                  </div>
                  <StatusBadge value={row.badge} />
                  <p className="text-sm text-slate-400">{formatDate(row.date)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
