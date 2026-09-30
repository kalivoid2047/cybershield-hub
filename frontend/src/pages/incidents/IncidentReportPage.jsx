import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Paperclip, Save, Send, X } from "lucide-react";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import { Input, Select, Textarea } from "../../components/common/Field.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { useToast } from "../../components/common/Toast.jsx";
import { incidentService } from "../../services/cyberShieldApi.js";
import { errorMessage, fieldErrors } from "../../utils/errors.js";
import { titleCase } from "../../utils/formatters.js";

const categories = [
  { id: 1, name: "Phishing Email" },
  { id: 2, name: "Malware Infection" },
  { id: 3, name: "Data Exposure" },
  { id: 4, name: "Unauthorized Access" },
];
const severities = ["low", "medium", "high", "critical"];

// <input type="datetime-local"> wants local time, not UTC.
function localNow() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function IncidentReportPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    title: "",
    category_id: 1,
    severity: "medium",
    description: "",
    affected_system: "",
    occurred_at: localNow(),
    is_draft: false,
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(isDraft) {
    setFormError("");
    const local = {};
    if (!form.title.trim()) local.title = "Give the incident a short title.";
    if (!isDraft && !form.description.trim()) local.description = "Describe what happened so the team can respond.";
    if (Object.keys(local).length) {
      setErrors(local);
      document.getElementById("incident-form")?.querySelector("[aria-invalid='true']")?.focus();
      return;
    }
    setErrors({});
    setBusy(isDraft ? "draft" : "submit");
    try {
      await incidentService.create({ ...form, is_draft: isDraft, attachments: files });
      toast.success(isDraft ? "Draft saved." : "Incident reported. The security team has been notified.");
      navigate("/incidents");
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      setFormError(errorMessage(error, "We couldn't save this report. Please try again."));
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Incident intake"
        title="Report an Incident"
        description="Submit cyber events with severity, affected system, evidence, and tracking context."
        actions={
          <Button as={Link} to="/incidents" variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
      <Card>
        <form id="incident-form" className="grid gap-5" onSubmit={(event) => event.preventDefault()} noValidate>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="Title" value={form.title} onChange={(event) => update("title", event.target.value)} error={errors.title} required />
            <Input label="Affected system" hint="For example: laptop, email account, HR portal" value={form.affected_system} onChange={(event) => update("affected_system", event.target.value)} error={errors.affected_system} />
            <Select label="Category" value={form.category_id} onChange={(event) => update("category_id", event.target.value)} error={errors.category_id}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select label="Severity" value={form.severity} onChange={(event) => update("severity", event.target.value)} error={errors.severity}>
              {severities.map((severity) => (
                <option key={severity} value={severity}>
                  {titleCase(severity)}
                </option>
              ))}
            </Select>
            <Input label="Date and time" type="datetime-local" max={localNow()} value={form.occurred_at} onChange={(event) => update("occurred_at", event.target.value)} error={errors.occurred_at} />
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-300">Evidence</span>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-white/16 bg-white/7 px-3 text-sm text-slate-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyanx/70">
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                {files.length ? "Add or replace files" : "Attach screenshot, log, PDF, EML"}
                <input className="sr-only" type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} />
              </label>
              {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-md bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        className="focus-ring rounded p-1 text-slate-400 hover:text-white"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => setFiles((current) => current.filter((_, position) => position !== index))}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <Textarea
            label="Description"
            hint="What happened, what you clicked or shared, and anything unusual you noticed."
            className="min-h-44"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            error={errors.description}
            required
          />
          {formError && <Alert tone="error">{formError}</Alert>}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" disabled={Boolean(busy)} onClick={() => submit(true)}>
              <Save className="h-4 w-4" />
              {busy === "draft" ? "Saving..." : "Save draft"}
            </Button>
            <Button type="button" disabled={Boolean(busy)} onClick={() => submit(false)}>
              <Send className="h-4 w-4" />
              {busy === "submit" ? "Submitting..." : "Submit report"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
