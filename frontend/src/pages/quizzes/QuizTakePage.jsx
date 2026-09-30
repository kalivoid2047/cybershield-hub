import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Send } from "lucide-react";
import clsx from "clsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import { Skeleton } from "../../components/common/Skeleton.jsx";
import { quizService } from "../../services/cyberShieldApi.js";
import { errorMessage } from "../../utils/errors.js";

const DEFAULT_LIMIT_MINUTES = 10;

function formatClock(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

// Answers survive a refresh or an accidental navigation for the life of the tab.
function storageKey(quizId, attemptId) {
  return `cybershield.quiz.${quizId}.${attemptId ?? "local"}`;
}

function readSaved(key, quiz) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || "{}");
    // Drop anything that no longer matches the quiz (edited questions, stale ids).
    return Object.fromEntries(
      Object.entries(saved).filter(([questionId, answerId]) =>
        quiz.questions?.some((question) => String(question.id) === questionId && question.answers.some((answer) => answer.id === answerId)),
      ),
    );
  } catch {
    return {};
  }
}

export default function QuizTakePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [announcement, setAnnouncement] = useState("");
  const timeUpHandled = useRef(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setQuiz(null);
    setLoadError(null);
    setReady(false);
    setBlocked(null);
    quizService
      .detail(id)
      .then((data) => {
        if (cancelled) return;
        setQuiz(data);
        return quizService
          .start(id)
          .then((attempt) => {
            if (cancelled) return;
            setAttemptId(attempt.id);
            // Resumed attempts carry their original start time.
            const started = Date.parse(attempt.started_at);
            if (Number.isFinite(started)) setStartedAt(Math.min(started, Date.now()));
            setAnswers(readSaved(storageKey(id, attempt.id), data));
          })
          .catch((error) => {
            if (cancelled) return;
            // Out of attempts: don't let them fill in a quiz that will be refused on submit.
            if (error.response?.status === 403) {
              setBlocked(error.response.data?.error?.message || "You have used all of your attempts for this quiz.");
              // Newest first; purely a convenience link, so ignore failures.
              quizService.attemptsFor(id).then((attempts) => !cancelled && setLastAttempt(attempts.find((item) => item.completed_at) || null)).catch(() => {});
              return;
            }
            // Any other failure: the quiz still works, it just won't record a duration.
            setAttemptId(null);
            setAnswers(readSaved(storageKey(id, null), data));
          });
      })
      .then(() => !cancelled && setReady(true))
      .catch((error) => !cancelled && setLoadError(error));
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!ready || blocked) return;
    try {
      sessionStorage.setItem(storageKey(id, attemptId), JSON.stringify(answers));
    } catch {
      // Storage unavailable (private mode); answers just live in memory.
    }
  }, [answers, id, attemptId, ready, blocked]);

  const questions = quiz?.questions || [];
  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const remainingCount = questions.length - answeredCount;
  const completion = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const firstUnanswered = questions.find((question) => answers[question.id] === undefined);

  const limitSeconds = (quiz?.time_limit_minutes || DEFAULT_LIMIT_MINUTES) * 60;
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const secondsLeft = Math.max(0, limitSeconds - elapsed);
  const timedOut = ready && !blocked && secondsLeft === 0;
  const lowTime = secondsLeft > 0 && secondsLeft <= Math.max(60, limitSeconds * 0.1);

  const submit = useCallback(
    async () => {
      const payload = {
        ...(attemptId ? { attempt_id: attemptId } : {}),
        answers: Object.entries(answers).map(([question_id, answer_id]) => ({
          question_id: Number(question_id),
          answer_id: Number(answer_id),
        })),
      };
      setSubmitting(true);
      setSubmitError(null);
      try {
        const result = await quizService.submit(id, payload);
        try {
          sessionStorage.removeItem(storageKey(id, attemptId));
        } catch {
          // ignore
        }
        navigate(`/quizzes/results/${result.id}`, { state: { result } });
      } catch (error) {
        setSubmitError(errorMessage(error, "We couldn't submit your answers. Please try again."));
      } finally {
        setSubmitting(false);
      }
    },
    [answers, attemptId, id, navigate],
  );

  // When the clock runs out, grade whatever has been answered so far once.
  useEffect(() => {
    if (!timedOut || timeUpHandled.current || submitting) return;
    timeUpHandled.current = true;
    if (answeredCount > 0) submit();
  }, [timedOut, answeredCount, submitting, submit]);

  // Screen-reader announcements at meaningful thresholds only (not every second).
  useEffect(() => {
    if (!ready || blocked) return;
    if (secondsLeft === 300) setAnnouncement("5 minutes remaining.");
    if (secondsLeft === 60) setAnnouncement("1 minute remaining.");
    if (secondsLeft === 0) setAnnouncement("Time is up.");
  }, [secondsLeft, ready, blocked]);

  function selectAnswer(questionId, answerId) {
    if (timedOut) return;
    setAnswers((current) => ({ ...current, [questionId]: answerId }));
  }

  function jumpTo(questionId) {
    const node = document.getElementById(`question-${questionId}`);
    node?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    node?.querySelector("input")?.focus({ preventScroll: true });
  }

  if (loadError) {
    return (
      <div>
        <PageHeader eyebrow="Timed assessment" title="Quiz" />
        <LoadError error={loadError} message="We couldn't open this quiz." onRetry={() => setReloadKey((value) => value + 1)} />
      </div>
    );
  }

  if (!quiz || !ready) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading quiz…</span>
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="mb-8 h-9 w-72" />
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div>
        <PageHeader eyebrow="No attempts left" title={quiz.title} description={blocked} />
        <Card>
          <p className="text-sm text-slate-300">Ask an administrator if you need another attempt.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {lastAttempt && (
              <Button as={Link} to={`/quizzes/results/${lastAttempt.id}`}>
                View last result
              </Button>
            )}
            <Button as={Link} to="/quizzes" variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              All quizzes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Timed assessment"
        title={quiz.title}
        description={quiz.description}
        actions={
          <Button as={Link} to="/quizzes" variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
      <p className="sr-only" role="status" aria-live="assertive">
        {announcement}
      </p>
      {timedOut && (
        <Alert tone="warning" className="mb-4">
          {answeredCount > 0
            ? submitting
              ? "Time is up. Submitting the answers you have so far…"
              : "Time is up. Your answers could not be submitted automatically. Use Submit to send what you have."
            : "Time is up and no answers were recorded for this attempt."}
        </Alert>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="scroll-mt-24">
              <fieldset id={`question-${question.id}`} disabled={timedOut} className="min-w-0">
                <legend className="mb-4 flex w-full items-start gap-3">
                  <span
                    className={clsx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm font-bold",
                      answers[question.id] !== undefined ? "border-mint/30 bg-mint/12 text-mint" : "border-cyanx/20 bg-cyanx/10 text-cyanx",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-semibold text-white">{question.prompt}</span>
                    <span className="mt-1 block text-sm font-normal text-slate-400">{question.competency}</span>
                  </span>
                </legend>
                <div className="grid gap-3">
                  {question.answers.map((answer) => {
                    const selected = answers[question.id] === answer.id;
                    return (
                      <label
                        key={answer.id}
                        className={clsx(
                          "flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-4 py-2 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyanx/70",
                          selected ? "border-cyanx/50 bg-cyanx/12 text-white" : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/8",
                          timedOut && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={answer.id}
                          checked={selected}
                          onChange={() => selectAnswer(question.id, answer.id)}
                          className="h-4 w-4 shrink-0 accent-cyan-400"
                        />
                        <span>{answer.text}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </Card>
          ))}
        </div>
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Attempt</h2>
              <span
                className={clsx(
                  "inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold tabular-nums",
                  secondsLeft === 0 ? "bg-danger/15 text-rose-100" : lowTime ? "bg-amberx/15 text-amber-100" : "text-slate-300",
                )}
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span aria-hidden="true">{formatClock(secondsLeft)} left</span>
                <span className="sr-only">Time remaining: {Math.floor(secondsLeft / 60)} minutes {secondsLeft % 60} seconds</span>
              </span>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>
                  {answeredCount} of {questions.length} answered
                </span>
                <span>{completion}%</span>
              </div>
              <ProgressBar value={completion} />
            </div>
            <nav aria-label="Question navigator" className="mt-4 flex flex-wrap gap-2">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => jumpTo(question.id)}
                  aria-label={`Question ${index + 1}, ${answers[question.id] !== undefined ? "answered" : "not answered"}`}
                  className={clsx(
                    "focus-ring h-9 w-9 rounded-md border text-sm font-semibold transition",
                    answers[question.id] !== undefined ? "border-mint/30 bg-mint/12 text-mint" : "border-white/12 bg-white/[0.035] text-slate-300 hover:bg-white/8",
                  )}
                >
                  {index + 1}
                </button>
              ))}
            </nav>
            {remainingCount > 0 && firstUnanswered && !timedOut && (
              <button type="button" onClick={() => jumpTo(firstUnanswered.id)} className="focus-ring mt-4 rounded text-sm text-cyanx hover:text-sky-200">
                {remainingCount} question{remainingCount === 1 ? "" : "s"} left: jump to next
              </button>
            )}
            <Button className="mt-5 w-full" disabled={(remainingCount > 0 && !timedOut) || answeredCount === 0 || submitting} onClick={() => submit()}>
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : remainingCount > 0 && !timedOut ? `Answer ${remainingCount} more to submit` : "Submit"}
            </Button>
            {submitError && (
              <Alert tone="error" className="mt-3">
                {submitError}
              </Alert>
            )}
            {quiz.max_attempts > 0 && (
              <p className="mt-3 text-center text-xs text-slate-400">
                Attempt {Math.min((quiz.attempts_used ?? 0) + 1, quiz.max_attempts)} of {quiz.max_attempts}
              </p>
            )}
            <p className="mt-2 text-center text-xs text-slate-400">Answers are saved on this device while you work.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
