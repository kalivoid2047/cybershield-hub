import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Search, SlidersHorizontal } from "lucide-react";
import PageHeader from "../../components/common/PageHeader.jsx";
import Card from "../../components/common/Card.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { trainingService } from "../../services/cyberShieldApi.js";

export default function TrainingPage() {
  const [lessons, setLessons] = useState([]);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");

  useEffect(() => {
    trainingService.lessons().then(setLessons);
  }, []);

  const filtered = useMemo(() => {
    return lessons.filter((lesson) => {
      const text = `${lesson.title} ${lesson.summary} ${lesson.category?.name}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesDifficulty = difficulty === "all" || lesson.difficulty === difficulty;
      return matchesQuery && matchesDifficulty;
    });
  }, [lessons, query, difficulty]);

  return (
    <div>
      <PageHeader
        eyebrow="Learning operations"
        title="Cybersecurity Training"
        description="Role-aware lessons for phishing, passwords, malware, social engineering, safe browsing, mobile security, data privacy, and email security."
      />
      <Card className="mb-6">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 pl-10 pr-3 text-white"
              placeholder="Search lessons"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="relative block">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 pl-10 pr-3 text-white"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              <option value="all">All difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((lesson) => (
          <Link key={lesson.id} to={`/training/${lesson.slug}`} className="group glass-panel rounded-lg p-5 transition hover:-translate-y-1 hover:border-cyanx/30 hover:shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyanx">{lesson.category?.name}</p>
                <h2 className="mt-2 text-lg font-bold text-white group-hover:text-cyanx">{lesson.title}</h2>
              </div>
              {lesson.is_bookmarked && <Bookmark className="h-5 w-5 fill-amberx text-amberx" />}
            </div>
            <p className="mt-3 min-h-16 text-sm leading-6 text-slate-400">{lesson.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge value={lesson.difficulty} />
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{lesson.estimated_minutes} min</span>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{lesson.progress_percent}%</span>
              </div>
              <ProgressBar value={lesson.progress_percent} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
