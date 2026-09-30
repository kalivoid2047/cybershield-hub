import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { adminService } from "../../services/cyberShieldApi.js";

const MAX_ATTEMPTS = 100; // keep in step with MAX_ATTEMPTS_LIMIT in apps/quizzes/serializers.py

// The input is kept as a string while editing so it can be empty or half-typed.
function parseAttempts(text) {
  if (!/^\d+$/.test(text.trim())) return { error: "Enter a whole number (0 for unlimited)." };
  const value = Number(text);
  if (value > MAX_ATTEMPTS) return { error: `Use ${MAX_ATTEMPTS} or fewer.` };
  return { value };
}

function QuizRow({ quiz, onSaved }) {
  const [text, setText] = useState(String(quiz.max_attempts));
  const [status, setStatus] = useState({ kind: "idle" });

  const parsed = parseAttempts(text);
  const dirty = parsed.value !== undefined && parsed.value !== quiz.max_attempts;

  async function save() {
    setStatus({ kind: "saving" });
    try {
      const updated = await adminService.updateQuiz(quiz.id, { max_attempts: parsed.value });
      onSaved({ ...quiz, max_attempts: updated.max_attempts });
      setText(String(updated.max_attempts));
      setStatus({ kind: "saved" });
    } catch (error) {
      const details = error.response?.data?.error?.details?.max_attempts;
      setStatus({ kind: "error", message: (Array.isArray(details) ? details[0] : null) || error.response?.data?.error?.message || "Couldn't save. Please try again." });
    }
  }

  return (
    <li className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-white">{quiz.title}</h2>
          {!quiz.is_active && <StatusBadge value="closed" />}
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {quiz.question_count} questions · pass {quiz.pass_score}% · {quiz.time_limit_minutes} min
        </p>
      </div>
      <form
        className="flex flex-wrap items-start gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (dirty) save();
        }}
      >
        <div>
          <label htmlFor={`attempts-${quiz.id}`} className="mb-1 block text-xs text-slate-400">
            Max attempts
          </label>
          <input
            id={`attempts-${quiz.id}`}
            type="text"
            inputMode="numeric"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setStatus({ kind: "idle" });
            }}
            aria-invalid={parsed.error ? "true" : "false"}
            aria-describedby={`attempts-help-${quiz.id}`}
            className={`focus-ring min-h-10 w-24 rounded-md border bg-white/7 px-3 text-white ${parsed.error ? "border-rose-400/60" : "border-white/10"}`}
          />
          <p id={`attempts-help-${quiz.id}`} className={`mt-1 text-xs ${parsed.error ? "text-rose-200" : "text-slate-500"}`}>
            {parsed.error || (parsed.value === 0 ? "Unlimited" : `${parsed.value} per learner`)}
          </p>
        </div>
        <div className="pt-5">
          <Button type="submit" disabled={!dirty || status.kind === "saving"}>
            {status.kind === "saving" ? "Saving..." : "Save"}
          </Button>
        </div>
        <div className="min-h-10 pt-6 text-sm" role="status" aria-live="polite">
          {status.kind === "saved" && (
            <span className="inline-flex items-center gap-1 text-emerald-200">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
          {status.kind === "error" && <span className="text-rose-200">{status.message}</span>}
        </div>
      </form>
    </li>
  );
}

export default function QuizSettingsPage() {
  const [quizzes, setQuizzes] = useState(null);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    adminService.quizzes().then(setQuizzes).catch(() => setLoadError(true));
  }, []);

  const filtered = useMemo(() => (quizzes || []).filter((quiz) => quiz.title.toLowerCase().includes(query.toLowerCase())), [quizzes, query]);

  function replace(updated) {
    setQuizzes((current) => current.map((quiz) => (quiz.id === updated.id ? updated : quiz)));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Quiz Settings"
        description="Limit how many times each learner can attempt a quiz. Only submitted attempts count, and 0 means unlimited."
      />
      <Card className="mb-6">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 pl-10 pr-3 text-white"
            placeholder="Search quizzes"
            aria-label="Search quizzes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </Card>
      <Card>
        {loadError ? (
          <p className="text-sm text-rose-200">We couldn't load the quizzes. Check that you have administrator access.</p>
        ) : !quizzes ? (
          <p className="text-sm text-slate-400">Loading quizzes...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400">No quizzes match your search.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {filtered.map((quiz) => (
              <QuizRow key={quiz.id} quiz={quiz} onSaved={replace} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
