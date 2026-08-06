import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import RadarScoreChart from "../../components/charts/RadarScoreChart.jsx";
import { quizService } from "../../services/cyberShieldApi.js";

export default function QuizTakePage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    quizService.detail(id).then(setQuiz);
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
      answers: Object.entries(answers).map(([question_id, answer_id]) => ({
        question_id: Number(question_id),
        answer_id: Number(answer_id),
      })),
    };
    setResult(await quizService.submit(id, payload));
  }

  if (!quiz) return null;

  const radarLabels = result ? Object.keys(result.weakness_map || {}) : [];
  const radarValues = radarLabels.map((label) => result.weakness_map[label].score || 0);

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
            <Button className="mt-5 w-full" disabled={completion < 100} onClick={submit}>
              <Send className="h-4 w-4" />
              Submit
            </Button>
          </Card>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <Card>
                <div className="text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-mint" />
                  <p className="mt-3 text-5xl font-bold text-white">{Math.round(result.score)}%</p>
                  <p className="mt-2 text-sm text-slate-400">{result.passed ? "Passed" : "Needs review"}</p>
                </div>
                {radarLabels.length > 0 && <RadarScoreChart labels={radarLabels} values={radarValues} />}
                <div className="mt-4 space-y-2">
                  {result.recommendations?.slice(0, 3).map((item) => (
                    <p key={item.competency} className="rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-300">
                      <span className="font-semibold text-cyanx">{item.competency}: </span>
                      {item.recommendation}
                    </p>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </aside>
      </div>
    </div>
  );
}
