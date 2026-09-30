import { useState } from "react";
import Alert from "../common/Alert.jsx";
import Button from "../common/Button.jsx";
import Dialog from "../common/Dialog.jsx";
import { Input, Select, Textarea } from "../common/Field.jsx";
import { alertService } from "../../services/cyberShieldApi.js";
import { errorMessage, fieldErrors } from "../../utils/errors.js";

const audiences = [
  { value: "", label: "Everyone" },
  { value: "normal_user", label: "Learners" },
  { value: "cybersecurity_officer", label: "Security officers" },
  { value: "system_admin", label: "Administrators" },
];

export default function PublishAlertDialog({ onClose, onPublished }) {
  const [form, setForm] = useState({ title: "", body: "", priority: "medium", alert_type: "announcement", audience_role: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    const local = {};
    if (!form.title.trim()) local.title = "Add a headline.";
    if (!form.body.trim()) local.body = "Write the message people should read.";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      await alertService.create({ ...form, title: form.title.trim(), body: form.body.trim() });
      onPublished();
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      setFormError(errorMessage(error, "We couldn't publish this alert."));
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title="Publish alert" description="Sent to each person in the audience as a notification.">
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Input label="Headline" value={form.title} onChange={(event) => update("title", event.target.value)} error={errors.title} maxLength={220} required />
        <Textarea label="Message" value={form.body} onChange={(event) => update("body", event.target.value)} error={errors.body} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Priority" value={form.priority} onChange={(event) => update("priority", event.target.value)} error={errors.priority}>
            <option value="info">Info</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Select label="Type" value={form.alert_type} onChange={(event) => update("alert_type", event.target.value)} error={errors.alert_type}>
            <option value="announcement">Announcement</option>
            <option value="threat_advisory">Threat advisory</option>
            <option value="daily_tip">Daily cyber tip</option>
          </Select>
        </div>
        <Select label="Audience" value={form.audience_role} onChange={(event) => update("audience_role", event.target.value)} error={errors.audience_role}>
          {audiences.map((audience) => (
            <option key={audience.value} value={audience.value}>
              {audience.label}
            </option>
          ))}
        </Select>
        {formError && <Alert tone="error">{formError}</Alert>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Publishing..." : "Publish alert"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
