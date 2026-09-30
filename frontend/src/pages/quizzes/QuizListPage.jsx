import { Link } from "react-router-dom";
import { BrainCircuit, Clock, Gauge } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import { SkeletonCards } from "../../components/common/Skeleton.jsx";
import useAsync from "../../hooks/useAsync.js";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import { quizService } from "../../services/cyberShieldApi.js";

export default function QuizListPage() {
  const { data, loading, error, reload } = useAsync(() => quizService.list().then((items) => (Array.isArray(items) ? items : [])), []);
  const quizzes = data || [];

  return (
    <div>
      <PageHeader
        eyebrow="Assessment engine"
        title="Quizzes and Assessments"
        description="Timed checks with automatic grading, pass/fail logic, attempt history, and weakness analysis."
      />
      {loading ? (
        <SkeletonCards count={4} className="lg:grid-cols-2" height="h-64" />
      ) : error ? (
        <LoadError error={error} message="We couldn't load the quizzes." onRetry={reload} />
      ) : quizzes.length === 0 ? (
        <EmptyState icon={BrainCircuit} title="No quizzes available" description="Assessments will appear here once they're published." />
      ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="flex flex-col">
            <div className="flex items-start gap-4">
              <div className="rounded-md border border-cyanx/20 bg-cyanx/10 p-3 text-cyanx">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{quiz.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{quiz.description}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                <Clock className="mb-2 h-4 w-4 text-cyanx" />
                <p className="text-sm text-slate-400">{quiz.time_limit_minutes} minutes</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                <Gauge className="mb-2 h-4 w-4 text-mint" />
                <p className="text-sm text-slate-400">Pass {quiz.pass_score}%</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                <BrainCircuit className="mb-2 h-4 w-4 text-amberx" />
                <p className="text-sm text-slate-400">{quiz.question_count || quiz.questions?.length || 0} questions</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>Best score</span>
                <span>{quiz.attempts_used > 0 || Number(quiz.best_score) > 0 ? `${Math.round(Number(quiz.best_score) || 0)}%` : "Not attempted"}</span>
              </div>
              <ProgressBar value={quiz.best_score || 0} />
            </div>
            {quiz.max_attempts > 0 && (
              <p className="mt-4 text-xs text-slate-400">
                {quiz.attempts_remaining === 0
                  ? `All ${quiz.max_attempts} attempts used`
                  : `${quiz.attempts_used} of ${quiz.max_attempts} attempts used`}
              </p>
            )}
            {quiz.attempts_remaining === 0 ? (
              <Button className="mt-3" disabled>
                No attempts left
              </Button>
            ) : (
              <Button as={Link} to={`/quizzes/${quiz.id}`} className="mt-3">
                {quiz.attempts_used > 0 ? "Retake assessment" : "Start assessment"}
              </Button>
            )}
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
