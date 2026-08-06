import { useEffect, useState } from "react";
import { BarChart3, BrainCircuit, ClipboardList, Gauge, GraduationCap, Users } from "lucide-react";
import Card from "../../components/common/Card.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import BarMetricChart from "../../components/charts/BarMetricChart.jsx";
import DoughnutChart from "../../components/charts/DoughnutChart.jsx";
import LineTrendChart from "../../components/charts/LineTrendChart.jsx";
import { analyticsService } from "../../services/cyberShieldApi.js";

export default function AnalyticsPage() {
  const [charts, setCharts] = useState(null);
  const [org, setOrg] = useState(null);

  useEffect(() => {
    analyticsService.charts().then(setCharts);
    analyticsService.organization().then(setOrg);
  }, []);

  const trends = charts?.incident_trends || [];
  const severity = charts?.incident_severity || [];
  const training = charts?.training_by_category || [];
  const quizPerformance = charts?.quiz_performance || [];
  const phishingAwareness = charts?.phishing_awareness || [];
  const quizPassed = quizPerformance.find((item) => item.passed)?.count || 0;
  const quizFailed = quizPerformance.find((item) => !item.passed)?.count || 0;
  const phishingCorrect = phishingAwareness.find((item) => item.correct)?.count || 0;
  const phishingMissed = phishingAwareness.find((item) => !item.correct)?.count || 0;

  return (
    <div>
      <PageHeader
        eyebrow="Executive visibility"
        title="Analytics and Reporting"
        description="Training completion, quiz performance, phishing awareness, incident trends, severity mix, engagement, and organization cyber risk."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Active users" value={org?.active_users || 0} detail="Current accounts" tone="cyan" />
        <MetricCard icon={GraduationCap} label="Training completion" value={`${org?.training_completion_rate || 0}%`} detail="Lessons completed" tone="green" />
        <MetricCard icon={BrainCircuit} label="Quiz average" value={`${org?.quiz_average || 0}%`} detail="Assessment score" tone="amber" />
        <MetricCard icon={Gauge} label="Org risk score" value={org?.organization_risk_score || 0} detail="Lower is better" tone="rose" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyanx" />
            <h2 className="font-semibold text-white">Incident trends</h2>
          </div>
          <LineTrendChart labels={trends.map((item) => new Date(item.month).toLocaleDateString(undefined, { month: "short" }))} values={trends.map((item) => item.count)} />
        </Card>
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amberx" />
            <h2 className="font-semibold text-white">Incident severity</h2>
          </div>
          <DoughnutChart labels={severity.map((item) => item.severity)} values={severity.map((item) => item.count)} />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-white">Training by category</h2>
          <BarMetricChart labels={training.map((item) => item.lesson__category__name)} values={training.map((item) => item.count)} />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-white">Awareness outcomes</h2>
          <BarMetricChart
            labels={["Quiz passed", "Quiz failed", "Phishing correct", "Phishing missed"]}
            values={[quizPassed, quizFailed, phishingCorrect, phishingMissed]}
          />
        </Card>
      </div>
    </div>
  );
}
