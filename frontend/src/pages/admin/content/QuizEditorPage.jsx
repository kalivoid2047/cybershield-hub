import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import EditorBar from "../../../components/admin/EditorBar.jsx";
import Alert from "../../../components/common/Alert.jsx";
import Button from "../../../components/common/Button.jsx";
import Card from "../../../components/common/Card.jsx";
import { Input, Select, Textarea } from "../../../components/common/Field.jsx";
import LoadError from "../../../components/common/LoadError.jsx";
import PageHeader from "../../../components/common/PageHeader.jsx";
import { Skeleton } from "../../../components/common/Skeleton.jsx";
import Toggle from "../../../components/common/Toggle.jsx";
import { useToast } from "../../../components/common/Toast.jsx";
import useAsync from "../../../hooks/useAsync.js";
import useUnsavedChanges from "../../../hooks/useUnsavedChanges.js";
import { contentService } from "../../../services/cyberShieldApi.js";
import { errorMessage, fieldErrors } from "../../../utils/errors.js";

let keyCounter = 0;
const nextKey = () => `k${++keyCounter}`;

const blankAnswer = (isCorrect = false) => ({ key: nextKey(), text: "", is_correct: isCorrect });
const blankQuestion = () => ({
  key: nextKey(),
  prompt: "",
  competency: "General Awareness",
  points: 1,
  explanation: "",
  answers: [blankAnswer(true), blankAnswer(), blankAnswer()],
});

function fromApi(question) {
  return {
    key: nextKey(),
    id: question.id,
    prompt: question.prompt,
    competency: question.competency,
    points: question.points,
    explanation: question.explanation || "",
    answers: [...question.answers].sort((a, b) => a.order - b.order).map((answer) => ({ key: nextKey(), id: answer.id, text: answer.text, is_correct: answer.is_correct })),
  };
}

// Returns a message per problem so the author can fix everything in one pass.
function validateQuestions(questions) {
  const problems = [];
  if (questions.length === 0) problems.push("Add at least one question.");
  questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    if (!question.prompt.trim()) problems.push(`${label} needs a prompt.`);
    const filled = question.answers.filter((answer) => answer.text.trim());
    if (filled.length < 2) problems.push(`${label} needs at least two answer options.`);
    if (question.answers.some((answer) => answer.is_correct && !answer.text.trim())) problems.push(`${label}: the correct answer is empty.`);
    if (!filled.some((answer) => answer.is_correct)) problems.push(`${label} needs one correct answer selected.`);
    if (!(Number(question.points) >= 1)) problems.push(`${label} must be worth at least 1 point.`);
  });
  return problems;
}

function QuestionCard({ question, index, total, onChange, onMove, onDuplicate, onRemove }) {
  const setAnswer = (answerKey, patch) => onChange({ ...question, answers: question.answers.map((answer) => (answer.key === answerKey ? { ...answer, ...patch } : answer)) });
  const setCorrect = (answerKey) => onChange({ ...question, answers: question.answers.map((answer) => ({ ...answer, is_correct: answer.key === answerKey })) });
  const removeAnswer = (answerKey) => {
    const remaining = question.answers.filter((answer) => answer.key !== answerKey);
    // Never leave a question with no correct answer just because the right one was removed.
    if (!remaining.some((answer) => answer.is_correct) && remaining.length) remaining[0] = { ...remaining[0], is_correct: true };
    onChange({ ...question, answers: remaining });
  };

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyanx/30 bg-cyanx/10 text-sm text-cyanx">{index + 1}</span>
          Question
        </h3>
        <div className="flex gap-1">
          <button type="button" className="focus-ring rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move question ${index + 1} up`}>
            <ArrowUp className="h-4 w-4" />
          </button>
          <button type="button" className="focus-ring rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30" disabled={index === total - 1} onClick={() => onMove(1)} aria-label={`Move question ${index + 1} down`}>
            <ArrowDown className="h-4 w-4" />
          </button>
          <button type="button" className="focus-ring rounded-lg p-2 text-slate-300 hover:bg-white/10" onClick={onDuplicate} aria-label={`Duplicate question ${index + 1}`}>
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" className="focus-ring rounded-lg p-2 text-rose-300 hover:bg-danger/15" onClick={onRemove} aria-label={`Delete question ${index + 1}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Textarea label="Prompt" rows={3} className="min-h-20" value={question.prompt} onChange={(event) => onChange({ ...question, prompt: event.target.value })} />

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-slate-300">Answer options (select the correct one)</legend>
        <ul className="space-y-2">
          {question.answers.map((answer, answerIndex) => (
            <li key={answer.key} className={clsx("flex items-center gap-2 rounded-xl border p-2 transition", answer.is_correct ? "border-mint/40 bg-mint/8" : "border-white/10 bg-white/[0.03]")}>
              <input
                type="radio"
                name={`correct-${question.key}`}
                checked={answer.is_correct}
                onChange={() => setCorrect(answer.key)}
                className="h-4 w-4 shrink-0 accent-emerald-400"
                aria-label={`Mark option ${answerIndex + 1} as the correct answer`}
              />
              <input
                type="text"
                value={answer.text}
                onChange={(event) => setAnswer(answer.key, { text: event.target.value })}
                placeholder={`Option ${answerIndex + 1}`}
                aria-label={`Option ${answerIndex + 1} text`}
                className="focus-ring min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/25 px-3 text-white placeholder:text-slate-400"
              />
              <button type="button" className="focus-ring rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30" disabled={question.answers.length <= 2} onClick={() => removeAnswer(answer.key)} aria-label={`Remove option ${answerIndex + 1}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="secondary" className="mt-2 min-h-9 px-3 py-1" disabled={question.answers.length >= 6} onClick={() => onChange({ ...question, answers: [...question.answers, blankAnswer()] })}>
          <Plus className="h-4 w-4" />
          Add option
        </Button>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_120px]">
        <Input label="Competency" hint="Groups results, e.g. URL Inspection." value={question.competency} onChange={(event) => onChange({ ...question, competency: event.target.value })} />
        <Input label="Points" type="number" min={1} max={20} value={question.points} onChange={(event) => onChange({ ...question, points: event.target.value })} />
      </div>
      <Textarea label="Explanation" hint="Shown to learners after they submit, with the correct answer." rows={3} className="mt-4 min-h-20" wrapperClassName="mt-4" value={question.explanation} onChange={(event) => onChange({ ...question, explanation: event.target.value })} />
    </Card>
  );
}

function QuizForm({ initial, lessons, editingId }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(initial.form);
  const [questions, setQuestions] = useState(initial.questions);
  const [baseline, setBaseline] = useState(() => JSON.stringify({ form: initial.form, questions: initial.questions }));
  const [errors, setErrors] = useState({});
  const [problems, setProblems] = useState([]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const alertRef = useRef(null);

  const dirty = useMemo(() => JSON.stringify({ form, questions }) !== baseline, [form, questions, baseline]);
  useUnsavedChanges(dirty && !saving);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const setQuestion = (key, next) => setQuestions((current) => current.map((item) => (item.key === key ? next : item)));
  const moveQuestion = (index, delta) =>
    setQuestions((current) => {
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(index + delta, 0, item);
      return copy;
    });
  const duplicateQuestion = (index) =>
    setQuestions((current) => {
      const source = current[index];
      // No ids on the copy so the server creates new rows rather than overwriting the original.
      const copy = { ...source, key: nextKey(), id: undefined, answers: source.answers.map((answer) => ({ ...answer, key: nextKey(), id: undefined })) };
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
    });

  async function save(event) {
    event.preventDefault();
    const local = {};
    if (!form.title.trim()) local.title = "Give the quiz a title.";
    const found = validateQuestions(questions);
    const range = (value, min, max) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
    if (!range(form.time_limit_minutes, 1, 240)) local.time_limit_minutes = "Enter 1 to 240.";
    if (!range(form.pass_score, 1, 100)) local.pass_score = "Enter 1 to 100.";
    if (!range(form.max_attempts, 0, 100)) local.max_attempts = "Use 0 for unlimited, up to 100.";
    setErrors(local);
    setProblems(found);
    if (Object.keys(local).length || found.length) {
      setFormError("Please fix the items below before saving.");
      requestAnimationFrame(() => alertRef.current?.scrollIntoView({ block: "center" }));
      return;
    }
    setFormError("");
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      lesson: form.lesson ? Number(form.lesson) : null,
      time_limit_minutes: Number(form.time_limit_minutes),
      pass_score: Number(form.pass_score),
      max_attempts: Number(form.max_attempts),
      is_active: form.is_active,
      randomize_questions: form.randomize_questions,
      questions: questions.map((question, position) => ({
        ...(question.id ? { id: question.id } : {}),
        prompt: question.prompt.trim(),
        competency: question.competency.trim() || "General Awareness",
        points: Number(question.points) || 1,
        explanation: question.explanation.trim(),
        order: position,
        answers: question.answers
          .filter((answer) => answer.text.trim())
          .map((answer, answerPosition) => ({ ...(answer.id ? { id: answer.id } : {}), text: answer.text.trim(), is_correct: answer.is_correct, order: answerPosition })),
      })),
    };
    try {
      if (editingId) {
        await contentService.updateQuiz(editingId, payload);
        setBaseline(JSON.stringify({ form, questions }));
        toast.success("Quiz saved.");
      } else {
        await contentService.createQuiz(payload);
        toast.success(form.is_active ? "Quiz published." : "Quiz saved as inactive.");
        navigate("/admin/content?tab=quizzes");
      }
    } catch (error) {
      setErrors(fieldErrors(error));
      setFormError(errorMessage(error, "We could not save this quiz."));
    } finally {
      setSaving(false);
    }
  }

  const totalPoints = questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0);

  return (
    <form onSubmit={save} noValidate>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Title" wrapperClassName="md:col-span-2" value={form.title} onChange={(event) => update("title", event.target.value)} error={errors.title} maxLength={220} required />
              <Textarea label="Description" hint="Shown on the quiz card." wrapperClassName="md:col-span-2" rows={3} className="min-h-20" value={form.description} onChange={(event) => update("description", event.target.value)} error={errors.description} />
              <Select label="Linked lesson" hint="Learners see a Take quiz button on that lesson." value={form.lesson} onChange={(event) => update("lesson", event.target.value)} error={errors.lesson}>
                <option value="">None</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">
                Questions <span className="text-sm font-normal text-slate-400">({questions.length}, {totalPoints} points)</span>
              </h2>
              <Button type="button" onClick={() => setQuestions((current) => [...current, blankQuestion()])}>
                <Plus className="h-4 w-4" />
                Add question
              </Button>
            </div>
            {questions.length === 0 && <p className="glass-tile rounded-xl p-6 text-center text-sm text-slate-400">No questions yet. Add the first one to get started.</p>}
            {questions.map((question, index) => (
              <QuestionCard
                key={question.key}
                question={question}
                index={index}
                total={questions.length}
                onChange={(next) => setQuestion(question.key, next)}
                onMove={(delta) => moveQuestion(index, delta)}
                onDuplicate={() => duplicateQuestion(index)}
                onRemove={() => setQuestions((current) => current.filter((item) => item.key !== question.key))}
              />
            ))}
            {questions.length > 0 && (
              <Button type="button" variant="secondary" onClick={() => setQuestions((current) => [...current, blankQuestion()])}>
                <Plus className="h-4 w-4" />
                Add another question
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <h2 className="mb-4 font-semibold text-white">Rules</h2>
            <div className="space-y-4">
              <Input label="Time limit (minutes)" type="number" min={1} max={240} value={form.time_limit_minutes} onChange={(event) => update("time_limit_minutes", event.target.value)} error={errors.time_limit_minutes} />
              <Input label="Pass mark (%)" type="number" min={1} max={100} value={form.pass_score} onChange={(event) => update("pass_score", event.target.value)} error={errors.pass_score} />
              <Input label="Max attempts" type="number" min={0} max={100} hint="0 means unlimited." value={form.max_attempts} onChange={(event) => update("max_attempts", event.target.value)} error={errors.max_attempts} />
              <Toggle label="Active" description="Inactive quizzes are hidden from learners." checked={form.is_active} onChange={(value) => update("is_active", value)} />
              <Toggle label="Shuffle questions" description="Shown in a different order to each learner." checked={form.randomize_questions} onChange={(value) => update("randomize_questions", value)} />
            </div>
          </Card>
        </aside>
      </div>

      <div ref={alertRef}>
        {formError && (
          <Alert tone="error" className="mt-6">
            <p>{formError}</p>
            {problems.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}
      </div>
      <EditorBar cancelTo="/admin/content?tab=quizzes" saving={saving} dirty={dirty} saveLabel={editingId ? "Save changes" : form.is_active ? "Publish quiz" : "Save quiz"} />
    </form>
  );
}

export default function QuizEditorPage() {
  const { id } = useParams();
  const lessonsQuery = useAsync(() => contentService.lessons().then((items) => (Array.isArray(items) ? items : [])), []);
  const quizQuery = useAsync(() => (id ? contentService.quiz(id) : Promise.resolve(null)), [id]);

  const back = (
    <Button as={Link} to="/admin/content?tab=quizzes" variant="secondary">
      <ArrowLeft className="h-4 w-4" />
      All content
    </Button>
  );
  const header = <PageHeader eyebrow="Content" title={id ? "Edit quiz" : "New quiz"} description="Each question has one correct answer. Edits keep learners' past results intact." actions={back} />;

  if (lessonsQuery.loading || quizQuery.loading) {
    return (
      <div role="status" aria-live="polite">
        {header}
        <span className="sr-only">Loading editor…</span>
        <Skeleton className="h-96" />
      </div>
    );
  }
  const error = lessonsQuery.error || quizQuery.error;
  if (error) {
    return (
      <div>
        {header}
        <LoadError
          error={error}
          message="We could not load the editor."
          onRetry={() => {
            lessonsQuery.reload();
            quizQuery.reload();
          }}
        />
      </div>
    );
  }

  const quiz = quizQuery.data;
  const initial = {
    form: {
      title: quiz?.title || "",
      description: quiz?.description || "",
      lesson: quiz?.lesson ? String(quiz.lesson) : "",
      time_limit_minutes: quiz?.time_limit_minutes ?? 10,
      pass_score: quiz?.pass_score ?? 80,
      max_attempts: quiz?.max_attempts ?? 0,
      is_active: quiz?.is_active ?? true,
      randomize_questions: quiz?.randomize_questions ?? true,
    },
    questions: quiz ? [...(quiz.questions || [])].sort((a, b) => a.order - b.order).map(fromApi) : [blankQuestion()],
  };

  return (
    <div>
      {header}
      <QuizForm key={id || "new"} initial={initial} lessons={lessonsQuery.data || []} editingId={id} />
    </div>
  );
}
