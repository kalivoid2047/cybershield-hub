import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, BrainCircuit, FileWarning, Pencil, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import Button from "../../../components/common/Button.jsx";
import Card from "../../../components/common/Card.jsx";
import EmptyState from "../../../components/common/EmptyState.jsx";
import { SearchInput, Select } from "../../../components/common/Field.jsx";
import LoadError from "../../../components/common/LoadError.jsx";
import PageHeader from "../../../components/common/PageHeader.jsx";
import { SkeletonRows } from "../../../components/common/Skeleton.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import Toggle from "../../../components/common/Toggle.jsx";
import { useToast } from "../../../components/common/Toast.jsx";
import useAsync from "../../../hooks/useAsync.js";
import { contentService } from "../../../services/cyberShieldApi.js";
import { errorMessage } from "../../../utils/errors.js";
import { titleCase } from "../../../utils/formatters.js";

// One config per content type keeps the three tabs behaving identically.
const TYPES = {
  lessons: {
    label: "Lessons",
    singular: "lesson",
    icon: BookOpen,
    newTo: "/admin/content/lessons/new",
    editTo: (item) => `/admin/content/lessons/${item.slug}`,
    load: () => contentService.lessons(),
    idOf: (item) => item.slug,
    liveField: "is_published",
    liveLabel: ["Published", "Draft"],
    setLive: (item, value) => contentService.updateLesson(item.slug, { is_published: value }),
    remove: (item) => contentService.deleteLesson(item.slug),
    meta: (item) => [item.category?.name, titleCase(item.difficulty), `${item.estimated_minutes} min`],
    searchText: (item) => `${item.title} ${item.summary} ${item.category?.name}`,
    deleteWarning: "Learners' progress and bookmarks for this lesson are removed too. Linked quizzes stay but are unlinked.",
    empty: "Write the first lesson to get your training library started.",
  },
  quizzes: {
    label: "Quizzes",
    singular: "quiz",
    icon: BrainCircuit,
    newTo: "/admin/content/quizzes/new",
    editTo: (item) => `/admin/content/quizzes/${item.id}`,
    load: () => contentService.quizzes(),
    idOf: (item) => item.id,
    liveField: "is_active",
    liveLabel: ["Active", "Inactive"],
    setLive: (item, value) => contentService.updateQuiz(item.id, { is_active: value }),
    remove: (item) => contentService.deleteQuiz(item.id),
    meta: (item) => [`${item.question_count} questions`, `${item.time_limit_minutes} min`, `Pass ${item.pass_score}%`],
    searchText: (item) => `${item.title} ${item.description}`,
    deleteWarning: "All learner attempts and results for this quiz are deleted permanently. Deactivate it instead to keep the history.",
    empty: "Create a quiz to test what learners have absorbed.",
  },
  phishing: {
    label: "Phishing",
    singular: "simulation",
    icon: FileWarning,
    newTo: "/admin/content/phishing/new",
    editTo: (item) => `/admin/content/phishing/${item.id}`,
    load: () => contentService.simulations(),
    idOf: (item) => item.id,
    liveField: "is_active",
    liveLabel: ["Active", "Inactive"],
    setLive: (item, value) => contentService.updateSimulation(item.id, { is_active: value }),
    remove: (item) => contentService.deleteSimulation(item.id),
    meta: (item) => [titleCase(item.difficulty), item.is_phishing ? "Phishing" : "Legitimate", `${item.attempt_count ?? 0} attempts`],
    searchText: (item) => `${item.title} ${item.subject} ${item.sender_email}`,
    deleteWarning: "Learners' attempts on this simulation are deleted permanently. Mark it inactive instead to keep the history.",
    empty: "Add a simulated email to give learners something to investigate.",
  },
};

function Row({ type, item, onChanged }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const live = item[type.liveField];

  async function toggle(value) {
    setBusy(true);
    try {
      await type.setLive(item, value);
      onChanged({ ...item, [type.liveField]: value });
      toast.success(`${item.title} is now ${type.liveLabel[value ? 0 : 1].toLowerCase()}.`);
    } catch (error) {
      toast.error(errorMessage(error, "We could not update that."));
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    setBusy(true);
    try {
      await type.remove(item);
      onChanged(null);
      toast.success(`Deleted "${item.title}".`);
    } catch (error) {
      toast.error(errorMessage(error, "We could not delete that."));
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <li className="py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={type.editTo(item)} className="focus-ring rounded font-semibold text-white hover:text-cyanx">
              {item.title}
            </Link>
            <span className={clsx("rounded-full border px-2.5 py-0.5 text-xs font-semibold", live ? "border-emerald-300/25 bg-emerald-400/12 text-emerald-100" : "border-slate-300/25 bg-slate-400/10 text-slate-200")}>
              {type.liveLabel[live ? 0 : 1]}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{type.meta(item).filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Toggle label={type.liveLabel[0]} checked={Boolean(live)} onChange={toggle} disabled={busy} />
          <Button as={Link} to={type.editTo(item)} variant="secondary" className="min-h-9 px-3 py-1">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          {!confirming && (
            <Button variant="ghost" className="min-h-9 px-3 py-1 text-rose-300 hover:bg-danger/15" onClick={() => setConfirming(true)} aria-label={`Delete ${item.title}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {confirming && (
        <div className="mt-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-rose-100" role="alert">
          <p>
            Delete <strong>{item.title}</strong>? {type.deleteWarning}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="danger" className="min-h-9 px-3 py-1" disabled={busy} onClick={destroy}>
              {busy ? "Deleting..." : "Delete permanently"}
            </Button>
            <Button variant="ghost" className="min-h-9 px-3 py-1" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function ContentList({ typeKey }) {
  const type = TYPES[typeKey];
  const { data, loading, error, reload, setData } = useAsync(() => type.load().then((items) => (Array.isArray(items) ? items : [])), [typeKey]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const items = data || [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items
      .filter((item) => status === "all" || (status === "live" ? item[type.liveField] : !item[type.liveField]))
      .filter((item) => !needle || type.searchText(item).toLowerCase().includes(needle));
  }, [items, query, status, type]);

  return (
    <>
      <Card className="mb-6">
        <div className="grid gap-3 md:grid-cols-[1fr_200px]">
          <SearchInput label={`Search ${type.label.toLowerCase()}`} placeholder={`Search ${type.label.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select label="Status" hideLabel value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="live">{type.liveLabel[0]}</option>
            <option value="off">{type.liveLabel[1]}</option>
          </Select>
        </div>
      </Card>
      {loading ? (
        <Card>
          <SkeletonRows count={4} />
        </Card>
      ) : error ? (
        <LoadError error={error} message={`We could not load ${type.label.toLowerCase()}.`} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={type.icon}
          title={`No ${type.label.toLowerCase()} yet`}
          description={type.empty}
          action={
            <Button as={Link} to={type.newTo}>
              <Plus className="h-4 w-4" />
              New {type.singular}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nothing matches" description="Try a different search or status." />
      ) : (
        <Card>
          <ul className="divide-y divide-white/10">
            {filtered.map((item) => (
              <Row key={type.idOf(item)} type={type} item={item} onChanged={(next) => setData((current) => (next ? current.map((row) => (type.idOf(row) === type.idOf(item) ? { ...row, ...next } : row)) : current.filter((row) => type.idOf(row) !== type.idOf(item))))} />
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

export default function ContentAdminPage() {
  const [params, setParams] = useSearchParams();
  const tab = TYPES[params.get("tab")] ? params.get("tab") : "lessons";
  const type = TYPES[tab];

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Content Library"
        description="Create and manage the lessons, quizzes and phishing simulations your learners see."
        actions={
          <Button as={Link} to={type.newTo}>
            <Plus className="h-4 w-4" />
            New {type.singular}
          </Button>
        }
      />
      <div role="tablist" aria-label="Content type" className="glass-tile mb-6 inline-flex flex-wrap gap-1 rounded-2xl p-1">
        {Object.entries(TYPES).map(([key, config]) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls="content-panel"
            onClick={() => setParams({ tab: key })}
            className={clsx(
              "focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition",
              tab === key ? "bg-gradient-to-b from-cyanx/30 to-cyanx/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.18)] ring-1 ring-cyanx/30" : "text-slate-300 hover:bg-white/8 hover:text-white",
            )}
          >
            <config.icon className="h-4 w-4" aria-hidden="true" />
            {config.label}
          </button>
        ))}
      </div>
      <div id="content-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <ContentList key={tab} typeKey={tab} />
      </div>
    </div>
  );
}
