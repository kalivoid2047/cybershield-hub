import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookOpen, CheckCircle2, SearchX, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { SearchInput, Select } from "../../components/common/Field.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import { SkeletonCards } from "../../components/common/Skeleton.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import useAsync from "../../hooks/useAsync.js";
import { trainingService } from "../../services/cyberShieldApi.js";

function lessonStatus(lesson) {
  if (lesson.progress_percent >= 100) return "completed";
  if (lesson.progress_percent > 0) return "in_progress";
  return "not_started";
}

export default function TrainingPage() {
  const { data, loading, error, reload } = useAsync(() => trainingService.lessons().then((items) => (Array.isArray(items) ? items : [])), []);
  const lessons = data || [];
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  const categories = useMemo(() => [...new Set(lessons.map((lesson) => lesson.category?.name).filter(Boolean))].sort(), [lessons]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const text = `${lesson.title} ${lesson.summary} ${lesson.category?.name}`.toLowerCase();
      return (
        (!needle || text.includes(needle)) &&
        (difficulty === "all" || lesson.difficulty === difficulty) &&
        (category === "all" || lesson.category?.name === category) &&
        (status === "all" || lessonStatus(lesson) === status) &&
        (!bookmarkedOnly || lesson.is_bookmarked)
      );
    });
  }, [lessons, query, difficulty, status, category, bookmarkedOnly]);

  const completedCount = lessons.filter((lesson) => lessonStatus(lesson) === "completed").length;
  const filtersActive = query || difficulty !== "all" || status !== "all" || category !== "all" || bookmarkedOnly;

  function clearFilters() {
    setQuery("");
    setDifficulty("all");
    setStatus("all");
    setCategory("all");
    setBookmarkedOnly(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Learning operations"
        title="Cybersecurity Training"
        description="Role-aware lessons for phishing, passwords, malware, social engineering, safe browsing, mobile security, data privacy, and email security."
      />
      <Card className="mb-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_190px_170px_170px_auto]">
          <SearchInput className="md:col-span-2 xl:col-span-1" label="Search lessons" placeholder="Search lessons" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select label="Category" hideLabel icon={SlidersHorizontal} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <Select label="Difficulty" hideLabel value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="all">All difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
          <Select label="Progress" hideLabel value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Any progress</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </Select>
          <button
            type="button"
            aria-pressed={bookmarkedOnly}
            onClick={() => setBookmarkedOnly((value) => !value)}
            className={clsx(
              "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition",
              bookmarkedOnly ? "border-amberx/40 bg-amberx/12 text-amber-100" : "border-white/10 bg-white/7 text-slate-300 hover:bg-white/10",
            )}
          >
            <Bookmark className={clsx("h-4 w-4", bookmarkedOnly && "fill-amberx text-amberx")} aria-hidden="true" />
            Bookmarked
          </button>
        </div>
        {!loading && lessons.length > 0 && (
          <p className="mt-3 text-sm text-slate-400" role="status">
            {completedCount} of {lessons.length} lessons completed · showing {filtered.length}
          </p>
        )}
      </Card>

      {loading ? (
        <SkeletonCards count={6} />
      ) : error ? (
        <LoadError error={error} message="We couldn't load the lessons." onRetry={reload} />
      ) : lessons.length === 0 ? (
        <EmptyState icon={BookOpen} title="No lessons published yet" description="Training content will appear here as soon as it's published." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No lessons match"
          description="Try a different search, or clear the filters."
          action={
            filtersActive && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lesson) => {
            const done = lessonStatus(lesson) === "completed";
            return (
              <li key={lesson.id}>
                <Link
                  to={`/training/${lesson.slug}`}
                  className="group glass-panel focus-ring flex h-full flex-col rounded-lg p-5 transition hover:-translate-y-1 hover:border-cyanx/30 hover:shadow-glow motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyanx">{lesson.category?.name}</p>
                      <h2 className="mt-2 text-lg font-bold text-white group-hover:text-cyanx">{lesson.title}</h2>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {done && <CheckCircle2 className="h-5 w-5 text-mint" aria-label="Completed" />}
                      {lesson.is_bookmarked && <Bookmark className="h-5 w-5 fill-amberx text-amberx" aria-label="Bookmarked" />}
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">{lesson.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge value={lesson.difficulty} />
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{lesson.estimated_minutes} min</span>
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>{done ? "Completed" : "Progress"}</span>
                      <span>{lesson.progress_percent}%</span>
                    </div>
                    <ProgressBar value={lesson.progress_percent} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
