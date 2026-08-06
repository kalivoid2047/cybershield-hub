import { useEffect, useState } from "react";
import { AlertTriangle, Award, Bell, BookOpen, ClipboardList, FileWarning, ShieldCheck, Target } from "lucide-react";
import { motion } from "framer-motion";
import Card from "../../components/common/Card.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import DoughnutChart from "../../components/charts/DoughnutChart.jsx";
import RadarScoreChart from "../../components/charts/RadarScoreChart.jsx";
import { alertService, dashboardService, incidentService, trainingService } from "../../services/cyberShieldApi.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { formatDate } from "../../utils/formatters.js";

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recentLessons, setRecentLessons] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);

  useEffect(() => {
    dashboardService.summary().then(setSummary);
    alertService.list().then((data) => setAlerts(data || []));
    trainingService.lessons().then((data) => {
      const sorted = [...(data || [])].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      setRecentLessons(sorted.slice(0, 4));
    });
    incidentService.list().then((data) => setRecentIncidents((data || []).slice(0, 4)));
  }, []);

  const score = summary?.security_score || user?.security_score || 0;

  // Mirrors the backend's security-score weighting (UserDashboardAnalyticsView):
  // training 35%, quiz 35%, phishing 20%, open-risk headroom the rest — so the
  // chart is an honest breakdown of the number above it, not invented data.
  const completed = summary?.learning_progress?.completed || 0;
  const total = summary?.learning_progress?.total || 0;
  const trainingContribution = total ? Math.round((completed / total) * 35) : 0;
  const quizContribution = Math.round((summary?.quiz_average || 0) * 0.35);
  const phishingContribution = Math.round((summary?.phishing_average || 0) * 0.2);
  const riskContribution = Math.max(0, 10 - (summary?.open_incidents || 0) * 2);

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel overflow-hidden rounded-lg p-6"
      >
        <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyanx">Security command center</p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Welcome back, {user?.first_name || "Analyst"}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Your awareness posture, active alerts, incident queue, and cyber readiness signals are synchronized in one workspace.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs text-slate-400">Training</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {summary?.learning_progress?.completed || 0}/{summary?.learning_progress?.total || 0}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs text-slate-400">Quiz average</p>
                <p className="mt-1 text-xl font-bold text-white">{summary?.quiz_average || 0}%</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs text-slate-400">Phishing score</p>
                <p className="mt-1 text-xl font-bold text-white">{summary?.phishing_average || 0}%</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-cyanx/20 bg-cyanx/8 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">Security score</p>
              <ShieldCheck className="h-5 w-5 text-cyanx" />
            </div>
            <p className="mt-4 text-6xl font-bold text-white">{score}</p>
            <ProgressBar className="mt-5" value={score} />
            <p className="mt-3 text-sm text-slate-400">Gamified maturity score based on learning, assessments, simulations, and open risk.</p>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BookOpen} label="Learning progress" value={`${summary?.learning_progress?.completed || 0}/${summary?.learning_progress?.total || 0}`} detail="Completed lessons" tone="cyan" />
        <MetricCard icon={Target} label="Assessment average" value={`${summary?.quiz_average || 0}%`} detail="Quiz performance" tone="green" />
        <MetricCard icon={FileWarning} label="Phishing readiness" value={`${summary?.phishing_average || 0}%`} detail="Simulation score" tone="amber" />
        <MetricCard icon={ClipboardList} label="Open incidents" value={summary?.open_incidents || 0} detail="Tracked reports" tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Risk distribution</h2>
            <Award className="h-5 w-5 text-amberx" />
          </div>
          <DoughnutChart
            labels={["Training", "Quiz", "Phishing", "Open risk"]}
            values={[trainingContribution, quizContribution, phishingContribution, riskContribution]}
          />
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Readiness radar</h2>
            <ShieldCheck className="h-5 w-5 text-mint" />
          </div>
          <RadarScoreChart
            labels={["Training completion", "Quiz average", "Phishing readiness"]}
            values={[total ? Math.round((completed / total) * 100) : 0, summary?.quiz_average || 0, summary?.phishing_average || 0]}
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent lessons</h2>
            <BookOpen className="h-5 w-5 text-cyanx" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {recentLessons.length === 0 && <p className="text-sm text-slate-400">No lessons published yet.</p>}
            {recentLessons.map((lesson) => (
              <article key={lesson.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm font-semibold text-white">{lesson.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{lesson.summary}</p>
                <ProgressBar className="mt-4" value={lesson.progress_percent || 0} />
              </article>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Threat alerts</h2>
            <Bell className="h-5 w-5 text-danger" />
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <article key={alert.id} className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{alert.title}</p>
                  <StatusBadge value={alert.priority} />
                </div>
                <p className="text-sm text-slate-400">{alert.body}</p>
              </article>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Activity feed</h2>
          <AlertTriangle className="h-5 w-5 text-amberx" />
        </div>
        <div className="divide-y divide-white/10">
          {recentIncidents.length === 0 && <p className="py-3 text-sm text-slate-400">No incidents reported yet.</p>}
          {recentIncidents.map((incident) => (
            <div key={incident.id} className="grid gap-3 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="font-medium text-white">{incident.title}</p>
                <p className="mt-1 font-mono text-xs text-cyanx">{incident.reference_number}</p>
              </div>
              <StatusBadge value={incident.severity} />
              <p className="text-sm text-slate-400">{formatDate(incident.occurred_at)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
