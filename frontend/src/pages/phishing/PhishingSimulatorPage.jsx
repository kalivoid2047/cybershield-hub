import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, ExternalLink, Inbox, Link2, MailWarning, Radar, ShieldQuestion, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { Skeleton } from "../../components/common/Skeleton.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import useAsync from "../../hooks/useAsync.js";
import { phishingService } from "../../services/cyberShieldApi.js";
import { errorMessage } from "../../utils/errors.js";

// Plausible-sounding observations that are NOT red flags. Mixed in with the real
// ones so the learner has to judge each option instead of just ticking everything.
const DECOY_FLAGS = [
  "Addressed to you by name",
  "Professional formatting and logo",
  "Sent during normal business hours",
  "Mentions a real, well-known company",
];

function seededOrder(text) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function flagPool(simulation) {
  const real = simulation.red_flags || [];
  return [...new Set([...real, ...DECOY_FLAGS])].sort((a, b) => seededOrder(`${simulation.id}:${a}`) - seededOrder(`${simulation.id}:${b}`));
}

function inspectUrl(raw, senderEmail) {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const senderDomain = senderEmail?.split("@")[1]?.toLowerCase();
    const findings = [];
    if (url.protocol !== "https:") findings.push("Connection is not encrypted (HTTP)");
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) findings.push("Points to a raw IP address instead of a domain");
    if (host.includes("xn--")) findings.push("Uses look-alike (punycode) characters");
    if (url.username || raw.replace(/^[a-z]+:\/\//i, "").split("/")[0].includes("@")) findings.push("Hides the real destination behind an @ sign");
    if (host.split(".").length > 3) findings.push("Unusually many subdomains");
    // Digits swapped into a word (micros0ft, paypa1) is the classic look-alike trick.
    const lookalike = host.split(".").find((label) => /[a-z]{3,}[013][a-z]{2,}/.test(label));
    if (lookalike) findings.push(`Looks like a spoofed name: "${lookalike}" has digits standing in for letters`);
    if (/(login|secure|verify|account|update|support)[.-]/.test(host) && host.includes("-")) findings.push("Hyphenated, security-sounding domain (a common phishing pattern)");
    if (senderDomain && host !== senderDomain && !host.endsWith(`.${senderDomain}`)) findings.push(`Domain does not match the sender (${senderDomain})`);
    return { host, protocol: url.protocol.replace(":", ""), path: `${url.pathname}${url.search}`, findings };
  } catch {
    return null;
  }
}

function UrlInspector({ url, senderEmail, inspected, onInspect }) {
  const info = useMemo(() => (inspected ? inspectUrl(url, senderEmail) : null), [inspected, url, senderEmail]);
  return (
    <div>
      <button
        type="button"
        onClick={() => onInspect(url)}
        aria-expanded={inspected}
        className="focus-ring flex w-full items-center justify-between gap-3 rounded-md border border-cyanx/20 bg-cyanx/8 px-4 py-3 text-left text-sm text-cyanx"
      >
        <span className="min-w-0">
          <span className="block truncate">{url}</span>
          <span className="mt-0.5 block text-xs text-slate-400">{inspected ? "Inspected: nothing was opened" : "Click to inspect where this link really goes"}</span>
        </span>
        {inspected ? <Eye className="h-4 w-4 shrink-0" aria-hidden="true" /> : <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />}
      </button>
      {info && (
        <div className="mt-2 rounded-md border border-white/10 bg-void/60 p-3 text-sm" role="region" aria-label={`Inspection of ${url}`}>
          <p className="font-mono text-xs text-slate-400">
            {info.protocol}://<span className="font-bold text-white">{info.host}</span>
            {info.path !== "/" && info.path}
          </p>
          {info.findings.length ? (
            <ul className="mt-2 space-y-1">
              {info.findings.map((finding) => (
                <li key={finding} className="flex items-start gap-2 text-amber-100">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amberx" aria-hidden="true" />
                  {finding}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-mint" aria-hidden="true" />
              No obvious warning signs in the link itself.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const emptyState = { verdict: "", flags: [], inspected: [], result: null };

export default function PhishingSimulatorPage() {
  const { data, loading, error, reload } = useAsync(() => phishingService.simulations().then((items) => (Array.isArray(items) ? items : [])), []);
  const simulations = data || [];
  const [selectedId, setSelectedId] = useState(null);
  // Per-email working state, so switching emails never wipes someone's progress.
  const [sessions, setSessions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    if (simulations.length && !simulations.some((item) => item.id === selectedId)) setSelectedId(simulations[0].id);
  }, [simulations, selectedId]);

  const selected = simulations.find((item) => item.id === selectedId);
  const session = (selected && sessions[selected.id]) || emptyState;
  const locked = Boolean(session.result);
  const pool = useMemo(() => (selected ? flagPool(selected) : []), [selected]);

  useEffect(() => {
    if (session.result) resultRef.current?.focus({ preventScroll: false });
  }, [session.result]);

  // `changes` may be an object or a function of the previous session, so rapid
  // consecutive updates never overwrite each other.
  function patch(changes) {
    const id = selected.id;
    setSessions((current) => {
      const previous = current[id] || emptyState;
      return { ...current, [id]: { ...previous, ...(typeof changes === "function" ? changes(previous) : changes) } };
    });
  }

  function toggleFlag(flag) {
    if (locked) return;
    patch((previous) => ({ flags: previous.flags.includes(flag) ? previous.flags.filter((item) => item !== flag) : [...previous.flags, flag] }));
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await phishingService.submit(selected.id, {
        classification: session.verdict,
        selected_flags: session.flags,
        inspected_urls: session.inspected,
      });
      patch({ result });
    } catch (err) {
      setSubmitError(errorMessage(err, "We couldn't record your answer. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  function selectSimulation(id) {
    setSelectedId(id);
    setSubmitError("");
  }

  const nextUnfinished = simulations.find((item) => item.id !== selectedId && !sessions[item.id]?.result);

  const header = (
    <PageHeader
      eyebrow="Simulation lab"
      title="Phishing Simulator"
      description="Inspect the message and its links, flag what looks wrong, then decide: safe or suspicious. You get coaching feedback on both your verdict and your reasoning."
    />
  );

  if (loading) {
    return (
      <div>
        {header}
        <div className="grid gap-6 xl:grid-cols-[280px_1fr_340px]" role="status" aria-live="polite">
          <span className="sr-only">Loading simulations…</span>
          <Skeleton className="h-72" />
          <Skeleton className="h-96" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {header}
        <LoadError error={error} message="We couldn't load the simulations." onRetry={reload} />
      </div>
    );
  }

  if (!selected) {
    return (
      <div>
        {header}
        <EmptyState icon={Inbox} title="No simulations available" description="Your administrators haven't published any phishing simulations yet. Check back soon." />
      </div>
    );
  }

  const expectedFlags = new Set(selected.red_flags || []);
  const result = session.result;
  const caught = result ? session.flags.filter((flag) => expectedFlags.has(flag)) : [];
  const missed = result ? [...expectedFlags].filter((flag) => !session.flags.includes(flag)) : [];
  const wrong = result ? session.flags.filter((flag) => !expectedFlags.has(flag)) : [];
  const completedCount = simulations.filter((item) => sessions[item.id]?.result).length;

  return (
    <div>
      {header}
      <div className="grid gap-6 xl:grid-cols-[280px_1fr_340px]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-cyanx" aria-hidden="true" />
              <h2 className="font-semibold text-white">Inbox</h2>
            </div>
            <span className="text-xs text-slate-400">
              {completedCount}/{simulations.length} done
            </span>
          </div>
          <ul className="space-y-3">
            {simulations.map((simulation) => {
              const done = sessions[simulation.id]?.result;
              return (
                <li key={simulation.id}>
                  <button
                    type="button"
                    onClick={() => selectSimulation(simulation.id)}
                    aria-current={selected.id === simulation.id ? "true" : undefined}
                    className={clsx(
                      "focus-ring w-full rounded-md border p-3 text-left transition",
                      selected.id === simulation.id ? "border-cyanx/40 bg-cyanx/12" : "border-white/10 bg-white/[0.035] hover:bg-white/8",
                    )}
                  >
                    <p className="text-sm font-semibold text-white">{simulation.subject}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{simulation.sender_email}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <StatusBadge value={simulation.difficulty} />
                      {done && (
                        <span className={clsx("inline-flex items-center gap-1 text-xs font-semibold", done.correct ? "text-emerald-200" : "text-rose-200")}>
                          {done.correct ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <XCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                          {done.score}%
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
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
                <UrlInspector
                  key={url}
                  url={url}
                  senderEmail={selected.sender_email}
                  inspected={session.inspected.includes(url)}
                  onInspect={(value) => patch((previous) => (previous.inspected.includes(value) ? {} : { inspected: [...previous.inspected, value] }))}
                />
              ))}
            </div>
          </div>

          <fieldset disabled={locked || submitting} className="mt-5">
            <legend className="mb-2 text-sm font-medium text-slate-300">Your verdict</legend>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Your verdict">
              {[
                { value: "safe", label: "Safe", icon: CheckCircle2, on: "border-mint/50 bg-mint/15 text-emerald-100" },
                { value: "suspicious", label: "Suspicious", icon: MailWarning, on: "border-danger/50 bg-danger/15 text-rose-100" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={clsx(
                    "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyanx/70",
                    session.verdict === option.value ? option.on : "border-white/12 bg-white/8 text-slate-100 hover:bg-white/12",
                    (locked || submitting) && "cursor-not-allowed opacity-70",
                  )}
                >
                  <input
                    type="radio"
                    name={`verdict-${selected.id}`}
                    value={option.value}
                    checked={session.verdict === option.value}
                    onChange={() => patch({ verdict: option.value })}
                    className="sr-only"
                  />
                  <option.icon className="h-4 w-4" aria-hidden="true" />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          {submitError && (
            <Alert tone="error" className="mt-3">
              {submitError}
            </Alert>
          )}
          {!locked && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                {session.verdict ? "Ready when you are. You can't change your answer after submitting." : "Choose a verdict to continue."}
              </p>
              <Button onClick={submit} disabled={!session.verdict || submitting}>
                {submitting ? "Checking..." : "Submit verdict"}
              </Button>
            </div>
          )}
        </Card>

        <aside className="space-y-4">
          <Card>
            <div className="mb-1 flex items-center gap-2">
              <ShieldQuestion className="h-5 w-5 text-amberx" aria-hidden="true" />
              <h2 className="font-semibold text-white">Red flags</h2>
            </div>
            <p className="mb-4 text-sm text-slate-400">Select everything that makes this message look risky. Not every option is a real warning sign.</p>
            <ul className="space-y-2">
              {pool.map((flag) => {
                const on = session.flags.includes(flag);
                const state = !result ? null : expectedFlags.has(flag) ? (on ? "caught" : "missed") : on ? "wrong" : null;
                return (
                  <li key={flag}>
                    <button
                      type="button"
                      onClick={() => toggleFlag(flag)}
                      aria-pressed={on}
                      disabled={locked}
                      className={clsx(
                        "focus-ring flex min-h-10 w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm disabled:cursor-default",
                        state === "caught" && "border-mint/40 bg-mint/12 text-emerald-100",
                        state === "missed" && "border-amberx/50 border-dashed bg-amberx/8 text-amber-100",
                        state === "wrong" && "border-danger/40 bg-danger/10 text-rose-100",
                        !state && (on ? "border-amberx/40 bg-amberx/12 text-amber-100" : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/8"),
                      )}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{flag}</span>
                      {state === "caught" && <span className="text-xs font-semibold">Correct</span>}
                      {state === "missed" && <span className="text-xs font-semibold">Missed</span>}
                      {state === "wrong" && <span className="text-xs font-semibold">Not a red flag</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 rounded-md border border-white/10 bg-white/[0.035] p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                <Link2 className="h-4 w-4 text-cyanx" aria-hidden="true" />
                Links inspected
              </div>
              <p className="text-sm text-slate-400">
                {session.inspected.length} of {selected.urls?.length || 0}
              </p>
            </div>
          </Card>

          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <h2 ref={resultRef} tabIndex={-1} className="font-semibold text-white outline-none">
                    Feedback
                  </h2>
                  <StatusBadge value={result.correct ? "resolved" : "critical"} className="" />
                </div>
                <p className="mt-3 text-5xl font-bold text-white">{result.score}%</p>
                <p className="mt-2 text-sm text-slate-300">
                  You said <strong className="text-white">{result.classification}</strong>
                  {result.correct ? ", which is correct." : `. This message was actually ${result.feedback?.expected || (selected.is_phishing ? "suspicious" : "safe")}.`}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-400">
                  <li>
                    Red flags found: {caught.length} of {expectedFlags.size}
                  </li>
                  {missed.length > 0 && <li>Missed: {missed.join("; ")}</li>}
                  {wrong.length > 0 && <li>Not actually warning signs: {wrong.join("; ")}</li>}
                </ul>
                {result.feedback?.training_tip && <p className="mt-4 rounded-md border border-cyanx/20 bg-cyanx/8 p-3 text-sm leading-6 text-slate-200">{result.feedback.training_tip}</p>}
                <div className="mt-4 rounded-md border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Radar className="h-4 w-4 text-mint" aria-hidden="true" />
                    Detection signals
                  </div>
                  <p className="mt-2 text-sm text-slate-300">Automated risk score: {result.feedback?.ai_detection_mock?.risk_score}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.feedback?.ai_detection_mock?.signals?.map((signal) => (
                      <span key={signal} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
                {nextUnfinished && (
                  <Button className="mt-4 w-full" onClick={() => selectSimulation(nextUnfinished.id)}>
                    Next email
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </Card>
            </motion.div>
          )}
        </aside>
      </div>
    </div>
  );
}
