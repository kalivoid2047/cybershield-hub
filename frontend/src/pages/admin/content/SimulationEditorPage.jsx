import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MailWarning, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import EditorBar from "../../../components/admin/EditorBar.jsx";
import Alert from "../../../components/common/Alert.jsx";
import Button from "../../../components/common/Button.jsx";
import Card from "../../../components/common/Card.jsx";
import { Input, Select, Textarea } from "../../../components/common/Field.jsx";
import LoadError from "../../../components/common/LoadError.jsx";
import PageHeader from "../../../components/common/PageHeader.jsx";
import { Skeleton } from "../../../components/common/Skeleton.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import StringListEditor from "../../../components/common/StringListEditor.jsx";
import Toggle from "../../../components/common/Toggle.jsx";
import { useToast } from "../../../components/common/Toast.jsx";
import useAsync from "../../../hooks/useAsync.js";
import useUnsavedChanges from "../../../hooks/useUnsavedChanges.js";
import { contentService } from "../../../services/cyberShieldApi.js";
import { errorMessage, fieldErrors } from "../../../utils/errors.js";

function EmailPreview({ form }) {
  const urls = form.urls.filter((url) => url.trim());
  return (
    <div className="glass-tile rounded-xl">
      <div className="border-b border-white/10 p-4">
        <p className="text-xs text-slate-400">From</p>
        <p className="font-semibold text-white">
          {form.sender_name || "Sender name"} <span className="font-normal text-slate-400">&lt;{form.sender_email || "sender@example.com"}&gt;</span>
        </p>
        <p className="mt-3 text-lg font-bold text-white">{form.subject || "Subject line"}</p>
      </div>
      <div className="space-y-3 p-4">
        <p className="whitespace-pre-line text-sm leading-6 text-slate-300">{form.body || "The email body appears here."}</p>
        {urls.map((url) => (
          <p key={url} className="truncate rounded-lg border border-cyanx/20 bg-cyanx/8 px-3 py-2 text-sm text-cyanx">
            {url}
          </p>
        ))}
      </div>
    </div>
  );
}

function SimulationForm({ initial, editingId }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);
  useUnsavedChanges(dirty && !saving);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function save(event) {
    event.preventDefault();
    const local = {};
    if (!form.title.trim()) local.title = "Give the simulation an internal title.";
    if (!form.sender_name.trim()) local.sender_name = "Enter the sender name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.sender_email.trim())) local.sender_email = "Enter a valid email address.";
    if (!form.subject.trim()) local.subject = "Enter the subject line.";
    if (!form.body.trim()) local.body = "Write the email body.";
    if (!form.scenario.trim()) local.scenario = "Describe the scenario for other admins.";
    const badUrl = form.urls.map((url) => url.trim()).find((url) => url && !/^https?:\/\//i.test(url));
    if (badUrl) local.urls = `"${badUrl}" must start with http:// or https://.`;
    setErrors(local);
    if (Object.keys(local).length) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setFormError("");
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      scenario: form.scenario.trim(),
      difficulty: form.difficulty,
      sender_name: form.sender_name.trim(),
      sender_email: form.sender_email.trim(),
      subject: form.subject.trim(),
      body: form.body,
      urls: form.urls.map((url) => url.trim()).filter(Boolean),
      // A legitimate email has no red flags; drop any that were typed before switching.
      red_flags: form.is_phishing ? form.red_flags.map((flag) => flag.trim()).filter(Boolean) : [],
      is_phishing: form.is_phishing,
      training_tip: form.training_tip.trim(),
      is_active: form.is_active,
    };
    try {
      if (editingId) {
        await contentService.updateSimulation(editingId, payload);
        setBaseline(form);
        toast.success("Simulation saved.");
      } else {
        await contentService.createSimulation(payload);
        toast.success(form.is_active ? "Simulation published." : "Simulation saved as inactive.");
        navigate("/admin/content?tab=phishing");
      }
    } catch (error) {
      setErrors(fieldErrors(error));
      setFormError(errorMessage(error, "We could not save this simulation."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold text-white">The email</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Sender name" value={form.sender_name} onChange={(event) => update("sender_name", event.target.value)} error={errors.sender_name} required />
              <Input label="Sender email" type="email" value={form.sender_email} onChange={(event) => update("sender_email", event.target.value)} error={errors.sender_email} required />
              <Input label="Subject" wrapperClassName="md:col-span-2" value={form.subject} onChange={(event) => update("subject", event.target.value)} error={errors.subject} maxLength={255} required />
              <Textarea label="Body" wrapperClassName="md:col-span-2" className="min-h-40" value={form.body} onChange={(event) => update("body", event.target.value)} error={errors.body} required />
              <div className="md:col-span-2">
                <StringListEditor
                  label="Links in the email"
                  type="url"
                  values={form.urls}
                  onChange={(value) => update("urls", value)}
                  placeholder="https://example.com/path"
                  addLabel="Add link"
                  max={10}
                  hint="Learners can inspect these without opening them."
                  error={errors.urls}
                />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-white">Answer key and coaching</h2>
            <div className="space-y-5">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300">What is this email?</legend>
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                  {[
                    { value: true, label: "Phishing", detail: "Learners should mark it suspicious.", icon: MailWarning, on: "border-danger/50 bg-danger/12" },
                    { value: false, label: "Legitimate", detail: "Learners should mark it safe.", icon: ShieldCheck, on: "border-mint/50 bg-mint/12" },
                  ].map((option) => (
                    <label key={String(option.value)} className={clsx("flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyanx/70", form.is_phishing === option.value ? option.on : "border-white/12 bg-white/[0.03] hover:bg-white/[0.06]")}>
                      <input type="radio" className="sr-only" name="is_phishing" checked={form.is_phishing === option.value} onChange={() => update("is_phishing", option.value)} />
                      <option.icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-semibold text-white">{option.label}</span>
                        <span className="block text-xs text-slate-300">{option.detail}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {form.is_phishing ? (
                <StringListEditor
                  label="Red flags"
                  values={form.red_flags}
                  onChange={(value) => update("red_flags", value)}
                  placeholder="e.g. urgent language"
                  addLabel="Add red flag"
                  max={12}
                  hint="The real warning signs. Learners pick from these mixed with decoys, and are scored on finding them."
                  error={errors.red_flags}
                />
              ) : (
                <Alert tone="info">Legitimate emails have no red flags. Learners are scored on correctly marking this one safe.</Alert>
              )}
              <Textarea label="Training tip" hint="Coaching shown after the learner answers." rows={3} className="min-h-24" value={form.training_tip} onChange={(event) => update("training_tip", event.target.value)} error={errors.training_tip} />
            </div>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <h2 className="mb-4 font-semibold text-white">Settings</h2>
            <div className="space-y-4">
              <Input label="Internal title" hint="Only admins see this." value={form.title} onChange={(event) => update("title", event.target.value)} error={errors.title} maxLength={220} required />
              <Select label="Difficulty" value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)} error={errors.difficulty}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
              <Textarea label="Scenario" hint="Describe the lesson of this email for other admins." rows={3} className="min-h-20" value={form.scenario} onChange={(event) => update("scenario", event.target.value)} error={errors.scenario} required />
              <Toggle label="Active" description="Inactive simulations are hidden from learners." checked={form.is_active} onChange={(value) => update("is_active", value)} />
            </div>
          </Card>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Preview</h2>
              <StatusBadge value={form.difficulty === "hard" ? "high" : form.difficulty === "medium" ? "medium" : "low"} />
            </div>
            <EmailPreview form={form} />
          </div>
        </aside>
      </div>
      {formError && (
        <Alert tone="error" className="mt-6">
          {formError}
        </Alert>
      )}
      <EditorBar cancelTo="/admin/content?tab=phishing" saving={saving} dirty={dirty} saveLabel={editingId ? "Save changes" : form.is_active ? "Publish simulation" : "Save simulation"} />
    </form>
  );
}

export default function SimulationEditorPage() {
  const { id } = useParams();
  const query = useAsync(() => (id ? contentService.simulation(id) : Promise.resolve(null)), [id]);

  const back = (
    <Button as={Link} to="/admin/content?tab=phishing" variant="secondary">
      <ArrowLeft className="h-4 w-4" />
      All content
    </Button>
  );
  const header = <PageHeader eyebrow="Content" title={id ? "Edit phishing simulation" : "New phishing simulation"} description="Build a realistic email and the answer key learners are graded against." actions={back} />;

  if (query.loading) {
    return (
      <div role="status" aria-live="polite">
        {header}
        <span className="sr-only">Loading editor…</span>
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (query.error) {
    return (
      <div>
        {header}
        <LoadError error={query.error} message="We could not load the simulation." onRetry={query.reload} />
      </div>
    );
  }

  const sim = query.data;
  const initial = {
    title: sim?.title || "",
    scenario: sim?.scenario || "",
    difficulty: sim?.difficulty || "easy",
    sender_name: sim?.sender_name || "",
    sender_email: sim?.sender_email || "",
    subject: sim?.subject || "",
    body: sim?.body || "",
    urls: sim?.urls?.length ? sim.urls : [],
    red_flags: sim?.red_flags?.length ? sim.red_flags : sim ? [] : [""],
    is_phishing: sim?.is_phishing ?? true,
    training_tip: sim?.training_tip || "",
    is_active: sim?.is_active ?? true,
  };

  return (
    <div>
      {header}
      <SimulationForm key={id || "new"} initial={initial} editingId={id} />
    </div>
  );
}
