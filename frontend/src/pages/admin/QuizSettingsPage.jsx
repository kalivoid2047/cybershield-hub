import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import { SearchInput } from "../../components/common/Field.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import { SkeletonRows } from "../../components/common/Skeleton.jsx";
import useAsync from "../../hooks/useAsync.js";
import { errorMessage } from "../../utils/errors.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { adminService } from "../../services/cyberShieldApi.js";

// Field definitions. Bounds mirror the API validators in apps/quizzes/serializers.py.
const FIELDS = [
  {
    key: "max_attempts",
    label: "Max attempts",
    min: 0,
    max: 100,
    hint: (value) => (value === 0 ? "Unlimited" : `${value} per learner`),
    rangeError: "Use 0 for unlimited, or up to 100.",
  },
  {
    key: "pass_score",
    label: "Pass mark (%)",
    min: 1,
    max: 100,
    hint: (value) => `${value}% to pass`,
    rangeError: "Enter 1 to 100.",
  },
  {
    key: "time_limit_minutes",
    label: "Time limit (min)",
    min: 1,
    max: 240,
    hint: (value) => `${value} minute${value === 1 ? "" : "s"}`,
    rangeError: "Enter 1 to 240.",
  },
];

// Inputs are kept as strings while editing so they can be empty or half-typed.
function parseField(field, text) {
  if (!/^\d+$/.test(text.trim())) return { error: "Enter a whole number." };
  const value = Number(text);
  if (value < field.min || value > field.max) return { error: field.rangeError };
  return { value };
}

function QuizRow({ quiz, onSaved }) {
  const [texts, setTexts] = useState(() => Object.fromEntries(FIELDS.map((field) => [field.key, String(quiz[field.key])])));
  const [status, setStatus] = useState({ kind: "idle" });

  const parsed = Object.fromEntries(FIELDS.map((field) => [field.key, parseField(field, texts[field.key])]));
  const valid = FIELDS.every((field) => parsed[field.key].value !== undefined);
  const changes = Object.fromEntries(FIELDS.filter((field) => parsed[field.key].value !== undefined && parsed[field.key].value !== quiz[field.key]).map((field) => [field.key, parsed[field.key].value]));
  const dirty = valid && Object.keys(changes).length > 0;

  async function save() {
    setStatus({ kind: "saving" });
    try {
      const updated = await adminService.updateQuiz(quiz.id, changes);
      const merged = { ...quiz, ...Object.fromEntries(FIELDS.map((field) => [field.key, updated[field.key]])) };
      onSaved(merged);
      setTexts(Object.fromEntries(FIELDS.map((field) => [field.key, String(merged[field.key])])));
      setStatus({ kind: "saved" });
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error, "Could not save. Please try again.") });
    }
  }

  return (
    <li className="flex flex-col gap-4 py-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 lg:pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-white">{quiz.title}</h2>
          {!quiz.is_active && <StatusBadge value="closed" />}
        </div>
        <p className="mt-1 text-sm text-slate-400">{quiz.question_count} questions</p>
      </div>
      <form
        className="flex flex-wrap items-start gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (dirty) save();
        }}
      >
        {FIELDS.map((field) => {
          const result = parsed[field.key];
          const id = `${field.key}-${quiz.id}`;
          return (
            <div key={field.key}>
              <label htmlFor={id} className="mb-1 block text-xs text-slate-400">
                {field.label}
              </label>
              <input
                id={id}
                type="text"
                inputMode="numeric"
                value={texts[field.key]}
                onChange={(event) => {
                  setTexts((current) => ({ ...current, [field.key]: event.target.value }));
                  setStatus({ kind: "idle" });
                }}
                aria-invalid={result.error ? "true" : "false"}
                aria-describedby={`${id}-help`}
                className={`focus-ring min-h-10 w-28 rounded-md border bg-white/7 px-3 text-white ${result.error ? "border-rose-400/60" : "border-white/10"}`}
              />
              <p id={`${id}-help`} className={`mt-1 max-w-[7rem] text-xs ${result.error ? "text-rose-200" : "text-slate-400"}`}>
                {result.error || field.hint(result.value)}
              </p>
            </div>
          );
        })}
        <div className="pt-5">
          <Button type="submit" disabled={!dirty || status.kind === "saving"}>
            {status.kind === "saving" ? "Saving..." : "Save"}
          </Button>
        </div>
        <div className="min-h-10 max-w-[14rem] pt-6 text-sm" role="status" aria-live="polite">
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
  const { data: quizzes, loading, error, reload, setData: setQuizzes } = useAsync(() => adminService.quizzes().then((items) => (Array.isArray(items) ? items : [])), []);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => (quizzes || []).filter((quiz) => quiz.title.toLowerCase().includes(query.toLowerCase())), [quizzes, query]);

  function replace(updated) {
    setQuizzes((current) => current.map((quiz) => (quiz.id === updated.id ? updated : quiz)));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Quiz Settings"
        description="Set each quiz's attempt limit, pass mark and time limit. Attempt limits count submitted attempts only (0 is unlimited). Pass mark changes apply to future attempts; earlier results keep their outcome."
      />
      <Card className="mb-6">
        <SearchInput label="Search quizzes" placeholder="Search quizzes" value={query} onChange={(event) => setQuery(event.target.value)} />
      </Card>
      <p className="mb-4 text-xs text-slate-400">
        The time limit is shown to learners as a countdown. When it runs out, the answers they have given so far are submitted automatically.
      </p>
      <Card>
        {error ? (
          <LoadError error={error} message="We could not load the quizzes. Check that you have administrator access." onRetry={reload} />
        ) : loading || !quizzes ? (
          <SkeletonRows count={3} />
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
