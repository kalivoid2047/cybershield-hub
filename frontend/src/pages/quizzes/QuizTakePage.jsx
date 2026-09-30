import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Send } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import { quizService } from "../../services/cyberShieldApi.js";

export default function QuizTakePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    quizService.detail(id).then((data) => {
      setQuiz(data);
      quizService
        .start(id)
        .then((attempt) => {
          setAttemptId(attempt.id);
          // Resumed attempts carry their original start time; clamp to guard against clock skew.
          const elapsed = Math.floor((Date.now() - Date.parse(attempt.started_at)) / 1000);
          if (Number.isFinite(elapsed)) setSeconds(Math.max(0, Math.min(elapsed, (data.time_limit_minutes || 10) * 60)));
        })
        .catch((error) => {
          // Out of attempts: don't let them fill in a quiz that will be refused on submit.
          if (error.response?.status === 403) {
            setBlocked(error.response.data?.error?.message || "You have used all of your attempts for this quiz.");
            // Newest first; purely a convenience link, so ignore failures.
            quizService.attemptsFor(id).then((attempts) => setLastAttempt(attempts.find((item) => item.completed_at) || null)).catch(() => {});
            return;
          }
          // Any other failure: the quiz still works, it just won't record a duration.
          setAttemptId(null);
        });
    });
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const completion = useMemo(() => {
    if (!quiz?.questions?.length) return 0;
    return Math.round((Object.keys(answers).length / quiz.questions.length) * 100);
  }, [answers, quiz]);

  async function submit() {
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
      navigate(`/quizzes/results/${result.id}`, { state: { result } });
    } catch (error) {
      setSubmitError(error.response?.data?.error?.message || "We couldn't submit your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!quiz) return null;

  if (blocked) {
    return (
      <div>
        <PageHeader eyebrow="No attempts left" title={quiz.title} description={blocked} />
        <Card>
          <p className="text-sm text-slate-300">
            Ask an administrator if you need another attempt.
          </p>
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
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {quiz.questions?.map((question, index) => (
            <Card key={question.id}>
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyanx/20 bg-cyanx/10 text-sm font-bold text-cyanx">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-semibold text-white">{question.prompt}</h2>
                  <p className="mt-1 text-sm text-slate-400">{question.competency}</p>
                </div>
              </div>
              <div className="grid gap-3">
                {question.answers.map((answer) => {
                  const selected = answers[question.id] === answer.id;
                  return (
                    <button
                      key={answer.id}
                      type="button"
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: answer.id }))}
                      className={`focus-ring min-h-12 rounded-md border px-4 text-left text-sm transition ${
                        selected ? "border-cyanx/50 bg-cyanx/12 text-white" : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/8"
                      }`}
                    >
                      {answer.text}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
        <aside className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Attempt</h2>
              <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                <Clock className="h-4 w-4" />
                {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>Answered</span>
                <span>{completion}%</span>
              </div>
              <ProgressBar value={completion} />
            </div>
            <Button className="mt-5 w-full" disabled={completion < 100 || submitting} onClick={submit}>
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit"}
            </Button>
            {submitError && (
              <p role="alert" className="mt-3 rounded-md border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-100">
                {submitError}
              </p>
            )}
            {quiz.max_attempts > 0 && (
              <p className="mt-3 text-center text-xs text-slate-400">
                Attempt {Math.min((quiz.attempts_used ?? 0) + 1, quiz.max_attempts)} of {quiz.max_attempts}
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
