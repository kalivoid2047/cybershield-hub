import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, CheckCircle2, ClipboardCheck, Clock, ListTree } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import MarkdownContent, { parseMarkdown, slugifyHeading } from "../../components/common/MarkdownContent.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import { Skeleton } from "../../components/common/Skeleton.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useToast } from "../../components/common/Toast.jsx";
import useAsync from "../../hooks/useAsync.js";
import { trainingService } from "../../services/cyberShieldApi.js";
import { errorMessage } from "../../utils/errors.js";

export default function LessonDetailPage() {
  const { slug } = useParams();
  const toast = useToast();
  const { data: lesson, loading, error, reload } = useAsync(() => trainingService.lesson(slug), [slug]);
  const [progress, setProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    setProgress(lesson.progress_percent || 0);
    setBookmarked(Boolean(lesson.is_bookmarked));
  }, [lesson]);

  const headings = useMemo(() => parseMarkdown(lesson?.content).filter((block) => block.type === "h2"), [lesson]);

  async function completeLesson() {
    setSaving(true);
    try {
      const data = await trainingService.complete(slug);
      setProgress(data.progress_percent);
      toast.success("Lesson marked complete. Nice work!");
    } catch (err) {
      toast.error(errorMessage(err, "We couldn't save your progress. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleBookmark() {
    const next = !bookmarked;
    setBookmarking(true);
    try {
      await trainingService.setBookmark(slug, next);
      setBookmarked(next);
    } catch (err) {
      toast.error(errorMessage(err, "We couldn't update your bookmark."));
    } finally {
      setBookmarking(false);
    }
  }

  const back = (
    <Button as={Link} to="/training" variant="secondary">
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );

  if (loading) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading lesson…</span>
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="mb-8 h-9 w-96 max-w-full" />
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div>
        <PageHeader eyebrow="Training" title="Lesson" actions={back} />
        {error?.response?.status === 404 || (!error && !lesson) ? (
          <EmptyState title="Lesson not found" description="It may have been unpublished or moved." />
        ) : (
          <LoadError error={error} message="We couldn't load this lesson." onRetry={reload} />
        )}
      </div>
    );
  }

  const done = progress >= 100;
  const quizBlocked = Boolean(lesson.quiz_required) && !done;

  return (
    <div>
      <PageHeader eyebrow={lesson.category?.name} title={lesson.title} description={lesson.summary} actions={back} />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="mb-5 flex flex-wrap gap-2">
            <StatusBadge value={lesson.difficulty} />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {lesson.estimated_minutes} min
            </span>
            <button
              type="button"
              onClick={toggleBookmark}
              disabled={bookmarking}
              aria-pressed={bookmarked}
              className={`focus-ring inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition disabled:opacity-60 ${
                bookmarked ? "border-amberx/20 bg-amberx/10 text-amber-100" : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/8"
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-amberx" : ""}`} aria-hidden="true" />
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
          <article className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <MarkdownContent source={lesson.content} />
          </article>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm text-slate-300">
              {done
                ? "You've completed this lesson."
                : quizBlocked
                  ? "Take the lesson quiz to unlock completion."
                  : "Finished reading? Record your progress."}
            </p>
            <Button onClick={completeLesson} disabled={saving || done || quizBlocked}>
              <CheckCircle2 className="h-4 w-4" />
              {done ? "Completed" : saving ? "Saving..." : "Mark complete"}
            </Button>
          </div>
        </Card>
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <h2 className="font-semibold text-white">Completion</h2>
            <div className="mt-5 rounded-lg border border-cyanx/20 bg-cyanx/8 p-5 text-center">
              <p className="text-5xl font-bold text-white">{progress}%</p>
              <ProgressBar className="mt-4" value={progress} />
            </div>
            <Button className="mt-5 w-full" onClick={completeLesson} disabled={saving || done || quizBlocked}>
              <CheckCircle2 className="h-4 w-4" />
              {done ? "Completed" : saving ? "Saving..." : "Mark complete"}
            </Button>
          </Card>
          {headings.length > 1 && (
            <Card>
              <h2 className="flex items-center gap-2 font-semibold text-white">
                <ListTree className="h-4 w-4 text-cyanx" aria-hidden="true" />
                In this lesson
              </h2>
              <nav aria-label="Lesson sections" className="mt-3">
                <ol className="space-y-1.5 text-sm">
                  {headings.map((heading) => (
                    <li key={heading.text}>
                      <a href={`#${slugifyHeading(heading.text)}`} className="focus-ring block rounded px-2 py-1 text-slate-300 hover:bg-white/8 hover:text-white">
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </Card>
          )}
          {lesson.quizzes?.length > 0 && (
            <Card>
              <h2 className="font-semibold text-white">Test your knowledge</h2>
              <div className="mt-4 space-y-3">
                {lesson.quizzes.map((quiz) => (
                  <Button key={quiz.id} as={Link} to={`/quizzes/${quiz.id}`} variant="secondary" className="w-full">
                    <ClipboardCheck className="h-4 w-4" />
                    Take quiz{lesson.quizzes.length > 1 ? `: ${quiz.title}` : ""}
                  </Button>
                ))}
              </div>
            </Card>
          )}
          {lesson.tags?.length > 0 && (
            <Card>
              <h2 className="font-semibold text-white">Tags</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {lesson.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/7 px-3 py-1 text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
