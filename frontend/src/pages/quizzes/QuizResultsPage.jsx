import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, RotateCcw, Target, XCircle } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import RadarScoreChart from "../../components/charts/RadarScoreChart.jsx";
import { Skeleton } from "../../components/common/Skeleton.jsx";
import { quizService } from "../../services/cyberShieldApi.js";

// Competency bands: below WEAK needs focused review, below STRONG is developing.
const WEAK = 60;
const STRONG = 80;

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
}

function band(score) {
  if (score < WEAK) return { label: "Needs work", text: "text-rose-200", bar: "bg-rose-400", chip: "border-rose-300/20 bg-rose-500/14 text-rose-100" };
  if (score < STRONG) return { label: "Developing", text: "text-amber-100", bar: "bg-amber-400", chip: "border-amber-300/20 bg-amber-400/12 text-amber-100" };
  return { label: "Strong", text: "text-emerald-100", bar: "bg-emerald-400", chip: "border-emerald-300/20 bg-emerald-400/12 text-emerald-100" };
}

export default function QuizResultsPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  // Submitting navigates here with the graded attempt so it renders instantly;
  // a refresh or shared link falls back to loading the attempt by id.
  const [result, setResult] = useState(location.state?.result || null);
  const [error, setError] = useState(false);
  const [onlyMissed, setOnlyMissed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (result && String(result.id) === String(attemptId)) return;
    setError(false);
    quizService.attempt(attemptId).then(setResult).catch(() => setError(true));
  }, [attemptId, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const competencies = useMemo(
    () =>
      Object.entries(result?.weakness_map || {})
        .map(([name, value]) => ({ name, score: Number(value.score) || 0, correct: value.correct, total: value.total }))
        .sort((a, b) => a.score - b.score),
    [result],
  );

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Quiz results" title="Results unavailable" />
        <Card>
          <p className="text-slate-300">We could not load these results. They may belong to another account, or the connection dropped.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => setReloadKey((value) => value + 1)}>Try again</Button>
            <Button as={Link} to="/quizzes" variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to quizzes
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  if (!result) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading results…</span>
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="mb-8 h-9 w-72" />
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const weakAreas = competencies.filter((item) => item.score < STRONG);
  const answers = result.answers || [];
  const missed = answers.filter((item) => !item.is_correct);
  const visibleAnswers = onlyMissed ? missed : answers;
  const score = Math.round(Number(result.score));

  return (
    <div>
      <PageHeader
        eyebrow="Quiz results"
        title={result.quiz_title}
        description={result.passed ? "You passed this assessment." : `You need ${result.pass_score ?? 80}% to pass. Review the areas below and try again.`}
        actions={
          <Button as={Link} to="/quizzes" variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            All quizzes
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          <Card>
            <div className="text-center">
              {result.passed ? <CheckCircle2 className="mx-auto h-10 w-10 text-mint" /> : <XCircle className="mx-auto h-10 w-10 text-rose-300" />}
              <p className="mt-3 text-5xl font-bold text-white">{score}%</p>
              <p className={`mt-2 text-sm font-semibold ${result.passed ? "text-emerald-200" : "text-rose-200"}`}>{result.passed ? "Passed" : "Needs review"}</p>
              {result.pass_score != null && <p className="mt-1 text-xs text-slate-400">Pass mark {result.pass_score}%</p>}
            </div>
            {result.total_points > 0 && (
              <dl className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                  <dt className="text-xs text-slate-400">Points</dt>
                  <dd className="mt-1 font-semibold text-white">
                    {result.earned_points}/{result.total_points}
                  </dd>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                  <dt className="text-xs text-slate-400">Missed</dt>
                  <dd className="mt-1 font-semibold text-white">{answers.length ? missed.length : "-"}</dd>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                  <dt className="text-xs text-slate-400">Time</dt>
                  <dd className="mt-1 font-semibold text-white">{result.duration_seconds > 0 ? formatDuration(result.duration_seconds) : "-"}</dd>
                </div>
              </dl>
            )}
            <div className="mt-5 space-y-3">
              {result.attempts_remaining === 0 ? (
                <Button className="w-full" disabled>
                  <RotateCcw className="h-4 w-4" />
                  No attempts left
                </Button>
              ) : (
                <Button as={Link} to={`/quizzes/${result.quiz}`} className="w-full">
                  <RotateCcw className="h-4 w-4" />
                  Retake quiz
                </Button>
              )}
              {result.attempts_remaining > 0 && <p className="text-center text-xs text-slate-400">{result.attempts_remaining} attempt{result.attempts_remaining === 1 ? "" : "s"} remaining</p>}
              {result.lesson_slug && (
                <Button as={Link} to={`/training/${result.lesson_slug}`} variant="secondary" className="w-full">
                  <BookOpen className="h-4 w-4" />
                  Review lesson
                </Button>
              )}
            </div>
          </Card>
          {competencies.length >= 3 && (
            <Card>
              <h2 className="font-semibold text-white">Skill profile</h2>
              <RadarScoreChart labels={competencies.map((item) => item.name)} values={competencies.map((item) => item.score)} />
            </Card>
          )}
        </aside>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyanx" />
              <h2 className="font-semibold text-white">Where to focus</h2>
            </div>
            {competencies.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No competency breakdown is available for this attempt.</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-400">
                  {weakAreas.length === 0
                    ? "Every area is strong. Nice work."
                    : `Focus on ${weakAreas
                        .slice(0, 3)
                        .map((item) => item.name)
                        .join(", ")}${weakAreas.length > 3 ? ` and ${weakAreas.length - 3} more` : ""}.`}
                </p>
                <ul className="mt-5 space-y-4">
                  {competencies.map((item) => {
                    const tone = band(item.score);
                    return (
                      <li key={item.name}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-white">{item.name}</span>
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {item.correct}/{item.total} correct
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${tone.chip}`}>{tone.label}</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-valuenow={Math.round(item.score)} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.name} score`}>
                          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(2, item.score)}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {result.lesson_slug && weakAreas.length > 0 && (
              <p className="mt-5 rounded-md border border-cyanx/20 bg-cyanx/8 p-3 text-sm text-slate-300">
                Recommended next step:{" "}
                <Link to={`/training/${result.lesson_slug}`} className="font-semibold text-cyanx hover:underline">
                  revisit “{result.lesson_title}”
                </Link>
                , then retake the quiz.
              </p>
            )}
          </Card>

          {answers.length > 0 && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-white">Question review</h2>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={onlyMissed} onChange={(event) => setOnlyMissed(event.target.checked)} className="h-4 w-4 accent-cyan-400" />
                  Show only missed ({missed.length})
                </label>
              </div>
              {visibleAnswers.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">You answered every question correctly.</p>
              ) : (
                <ol className="mt-5 space-y-4">
                  {visibleAnswers.map((item) => (
                    <li key={item.id} className={`rounded-lg border p-4 ${item.is_correct ? "border-emerald-300/20 bg-emerald-400/5" : "border-rose-300/20 bg-rose-500/5"}`}>
                      <div className="flex items-start gap-3">
                        {item.is_correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />}
                        <div className="min-w-0">
                          <p className="font-medium text-white">{item.question_prompt}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.competency}</p>
                          {!item.is_correct && (
                            <p className="mt-3 text-sm text-slate-300">
                              <span className="font-semibold text-rose-200">Your answer: </span>
                              {item.selected_text || "No answer"}
                            </p>
                          )}
                          <p className="mt-1 text-sm text-slate-300">
                            <span className="font-semibold text-emerald-200">Correct answer: </span>
                            {item.correct_answer_text}
                          </p>
                          {item.explanation && <p className="mt-2 text-sm text-slate-400">{item.explanation}</p>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
