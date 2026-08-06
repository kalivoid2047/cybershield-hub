import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Paperclip, Save, Send } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { incidentService } from "../../services/cyberShieldApi.js";

const categories = [
  { id: 1, name: "Phishing Email" },
  { id: 2, name: "Malware Infection" },
  { id: 3, name: "Data Exposure" },
  { id: 4, name: "Unauthorized Access" },
];
const severities = ["low", "medium", "high", "critical"];

export default function IncidentReportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    category_id: 1,
    severity: "medium",
    description: "",
    affected_system: "",
    occurred_at: new Date().toISOString().slice(0, 16),
    is_draft: false,
  });
  const [files, setFiles] = useState([]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(isDraft) {
    await incidentService.create({ ...form, is_draft: isDraft, attachments: files });
    navigate("/incidents");
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
        <form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-300">Title</span>
              <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 px-3 text-white" value={form.title} onChange={(event) => update("title", event.target.value)} required />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-300">Affected system</span>
              <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 px-3 text-white" value={form.affected_system} onChange={(event) => update("affected_system", event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-300">Category</span>
              <select className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 px-3 text-white" value={form.category_id} onChange={(event) => update("category_id", event.target.value)}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-300">Severity</span>
              <select className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 px-3 text-white" value={form.severity} onChange={(event) => update("severity", event.target.value)}>
                {severities.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-300">Date and time</span>
              <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 px-3 text-white" type="datetime-local" value={form.occurred_at} onChange={(event) => update("occurred_at", event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-300">Evidence</span>
              <span className="focus-ring flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-white/16 bg-white/7 px-3 text-sm text-slate-300">
                <Paperclip className="h-4 w-4" />
                {files.length ? `${files.length} file selected` : "Attach screenshot, log, PDF, EML"}
                <input className="hidden" type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} />
              </span>
            </label>
          </div>
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-300">Description</span>
            <textarea className="focus-ring min-h-44 w-full resize-y rounded-md border border-white/10 bg-white/7 p-3 text-white" value={form.description} onChange={(event) => update("description", event.target.value)} required />
          </label>
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => submit(true)}>
              <Save className="h-4 w-4" />
              Save draft
            </Button>
            <Button type="button" onClick={() => submit(false)}>
              <Send className="h-4 w-4" />
              Submit report
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
