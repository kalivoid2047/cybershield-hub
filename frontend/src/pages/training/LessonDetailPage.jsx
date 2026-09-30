import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, CheckCircle2, ClipboardCheck, Clock, PlayCircle } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import MarkdownContent from "../../components/common/MarkdownContent.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { trainingService } from "../../services/cyberShieldApi.js";

export default function LessonDetailPage() {
  const { slug } = useParams();
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    trainingService.lesson(slug).then((data) => {
      setLesson(data);
      setProgress(data.progress_percent || 0);
      setBookmarked(Boolean(data.is_bookmarked));
    });
  }, [slug]);

  if (!lesson) return null;

  async function completeLesson() {
    setSaving(true);
    try {
      const data = await trainingService.complete(slug);
      setProgress(data.progress_percent);
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
    } finally {
      setBookmarking(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={lesson.category?.name}
        title={lesson.title}
        description={lesson.summary}
        actions={
          <Button as={Link} to="/training" variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="mb-5 flex flex-wrap gap-2">
            <StatusBadge value={lesson.difficulty} />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              <Clock className="h-3.5 w-3.5" />
              {lesson.estimated_minutes} min
            </span>
            <button
              type="button"
              onClick={toggleBookmark}
              disabled={bookmarking}
              className={`focus-ring inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition disabled:opacity-60 ${
                bookmarked ? "border-amberx/20 bg-amberx/10 text-amber-100" : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/8"
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-amberx" : ""}`} />
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex h-48 items-center justify-center rounded-md border border-cyanx/15 bg-cyanx/8">
              <PlayCircle className="h-14 w-14 text-cyanx" />
            </div>
            <MarkdownContent source={lesson.content} />
          </div>
        </Card>
        <aside className="space-y-4">
          <Card>
            <h2 className="font-semibold text-white">Completion</h2>
            <div className="mt-5 rounded-lg border border-cyanx/20 bg-cyanx/8 p-5 text-center">
              <p className="text-5xl font-bold text-white">{progress}%</p>
              <ProgressBar className="mt-4" value={progress} />
            </div>
            <Button className="mt-5 w-full" onClick={completeLesson} disabled={saving || progress >= 100}>
              <CheckCircle2 className="h-4 w-4" />
              {progress >= 100 ? "Completed" : saving ? "Saving..." : "Mark complete"}
            </Button>
          </Card>
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
          <Card>
            <h2 className="font-semibold text-white">Tags</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {lesson.tags?.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/7 px-3 py-1 text-xs text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
