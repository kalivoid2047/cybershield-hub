import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, ExternalLink, Inbox, Link2, MailWarning, ShieldQuestion } from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { phishingService } from "../../services/cyberShieldApi.js";

export default function PhishingSimulatorPage() {
  const [simulations, setSimulations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [classification, setClassification] = useState("");
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [inspected, setInspected] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    phishingService.simulations().then((data) => {
      setSimulations(data);
      setSelectedId(data[0]?.id);
    });
  }, []);

  const selected = useMemo(() => simulations.find((item) => item.id === selectedId) || simulations[0], [simulations, selectedId]);

  function toggleFlag(flag) {
    setSelectedFlags((current) => (current.includes(flag) ? current.filter((item) => item !== flag) : [...current, flag]));
  }

  async function submit(choice) {
    setClassification(choice);
    const payload = { classification: choice, selected_flags: selectedFlags, inspected_urls: inspected };
    setResult(await phishingService.submit(selected.id, payload));
  }

  if (!selected) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Simulation lab"
        title="Phishing Simulator"
        description="Classify realistic messages, inspect URLs, identify red flags, and get immediate coaching feedback."
      />
      <div className="grid gap-6 xl:grid-cols-[280px_1fr_340px]">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Inbox className="h-5 w-5 text-cyanx" />
            <h2 className="font-semibold text-white">Inbox</h2>
          </div>
          <div className="space-y-3">
            {simulations.map((simulation) => (
              <button
                key={simulation.id}
                type="button"
                onClick={() => {
                  setSelectedId(simulation.id);
                  setResult(null);
                  setClassification("");
                  setSelectedFlags([]);
                  setInspected([]);
                }}
                className={`focus-ring w-full rounded-md border p-3 text-left transition ${
                  selected.id === simulation.id ? "border-cyanx/40 bg-cyanx/12" : "border-white/10 bg-white/[0.035] hover:bg-white/8"
                }`}
              >
                <p className="text-sm font-semibold text-white">{simulation.subject}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{simulation.sender_email}</p>
                <div className="mt-2">
                  <StatusBadge value={simulation.difficulty} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="rounded-lg border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">From</p>
                  <p className="font-semibold text-white">
                    {selected.sender_name} <span className="font-normal text-slate-400">&lt;{selected.sender_email}&gt;</span>
                  </p>
                </div>
                <StatusBadge value={selected.difficulty} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">{selected.subject}</h2>
            </div>
            <div className="space-y-5 p-5">
              <p className="whitespace-pre-line leading-7 text-slate-300">{selected.body}</p>
              {selected.urls?.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setInspected((current) => (current.includes(url) ? current : [...current, url]))}
                  className="focus-ring flex w-full items-center justify-between gap-3 rounded-md border border-cyanx/20 bg-cyanx/8 px-4 py-3 text-left text-sm text-cyanx"
                >
                  <span className="truncate">{url}</span>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button onClick={() => submit("safe")} variant={classification === "safe" ? "primary" : "secondary"}>
              <CheckCircle2 className="h-4 w-4" />
              Safe
            </Button>
            <Button onClick={() => submit("suspicious")} variant={classification === "suspicious" ? "danger" : "secondary"}>
              <MailWarning className="h-4 w-4" />
              Suspicious
            </Button>
          </div>
        </Card>

        <aside className="space-y-4">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ShieldQuestion className="h-5 w-5 text-amberx" />
              <h2 className="font-semibold text-white">Analysis</h2>
            </div>
            <div className="space-y-2">
              {(selected.red_flags?.length ? selected.red_flags : ["known sender", "no credential request"]).map((flag) => (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggleFlag(flag)}
                  className={`focus-ring flex min-h-10 w-full items-center gap-2 rounded-md border px-3 text-left text-sm ${
                    selectedFlags.includes(flag) ? "border-amberx/40 bg-amberx/12 text-amber-100" : "border-white/10 bg-white/[0.035] text-slate-300"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  {flag}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-white/10 bg-white/[0.035] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Link2 className="h-4 w-4 text-cyanx" />
                URLs inspected
              </div>
              <p className="text-sm text-slate-400">{inspected.length || 0} of {selected.urls?.length || 0}</p>
            </div>
          </Card>

          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white">Feedback</h2>
                  <StatusBadge value={result.correct ? "resolved" : "critical"} />
                </div>
                <p className="mt-4 text-5xl font-bold text-white">{result.score}%</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">{result.feedback?.training_tip}</p>
                <div className="mt-4 rounded-md border border-mint/20 bg-mint/10 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                    <Bot className="h-4 w-4" />
                    AI risk mockup
                  </div>
                  <p className="mt-2 text-sm text-slate-300">Risk score {result.feedback?.ai_detection_mock?.risk_score}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.feedback?.ai_detection_mock?.signals?.map((signal) => (
                      <span key={signal} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </aside>
      </div>
    </div>
  );
}
