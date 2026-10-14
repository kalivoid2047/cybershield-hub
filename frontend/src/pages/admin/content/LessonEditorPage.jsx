import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FolderPlus } from "lucide-react";
import EditorBar from "../../../components/admin/EditorBar.jsx";
import Alert from "../../../components/common/Alert.jsx";
import Button from "../../../components/common/Button.jsx";
import Card from "../../../components/common/Card.jsx";
import { Input, Select, Textarea } from "../../../components/common/Field.jsx";
import LoadError from "../../../components/common/LoadError.jsx";
import MarkdownContent from "../../../components/common/MarkdownContent.jsx";
import PageHeader from "../../../components/common/PageHeader.jsx";
import { Skeleton } from "../../../components/common/Skeleton.jsx";
import Toggle from "../../../components/common/Toggle.jsx";
import { useToast } from "../../../components/common/Toast.jsx";
import useAsync from "../../../hooks/useAsync.js";
import useUnsavedChanges from "../../../hooks/useUnsavedChanges.js";
import { contentService } from "../../../services/cyberShieldApi.js";
import { errorMessage, fieldErrors } from "../../../utils/errors.js";
import { slugify } from "../../../utils/formatters.js";

const ROLES = [
  { code: "normal_user", label: "Learners" },
  { code: "system_admin", label: "Administrators" },
];

const STARTER = `## Why this matters

Explain the risk in a sentence or two.

## What to look for

- First warning sign
- Second warning sign

## What to do

1. Stop and verify
2. Report it
`;

function CategoryCreator({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!name.trim()) {
      setError("Enter a category name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const category = await contentService.createCategory({ name: name.trim(), slug: slugify(name), description: "" });
      onCreated(category);
      setName("");
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err, "We could not create the category."));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded text-sm text-cyanx hover:text-sky-200">
        <FolderPlus className="h-4 w-4" aria-hidden="true" />
        New category
      </button>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap items-start gap-2">
      <Input label="New category name" hideLabel placeholder="Category name" value={name} onChange={(event) => setName(event.target.value)} error={error} wrapperClassName="min-w-48 flex-1" />
      <Button type="button" className="min-h-11" disabled={busy} onClick={create}>
        {busy ? "Adding..." : "Add"}
      </Button>
      <Button type="button" variant="ghost" className="min-h-11" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}

function LessonForm({ initial, categories: initialCategories, editingSlug }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);
  useUnsavedChanges(dirty && !saving);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function toggleRole(code) {
    update("recommended_for_roles", form.recommended_for_roles.includes(code) ? form.recommended_for_roles.filter((item) => item !== code) : [...form.recommended_for_roles, code]);
  }

  async function save(event) {
    event.preventDefault();
    const local = {};
    if (!form.title.trim()) local.title = "Give the lesson a title.";
    if (!form.category_id) local.category_id = "Choose a category.";
    if (!form.summary.trim()) local.summary = "Add a short summary for the lesson card.";
    if (!form.content.trim()) local.content = "Write the lesson content.";
    if (Number(form.estimated_minutes) < 1) local.estimated_minutes = "Enter at least 1 minute.";
    if (Object.keys(local).length) {
      setErrors(local);
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setFormError("");
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      category_id: Number(form.category_id),
      difficulty: form.difficulty,
      estimated_minutes: Number(form.estimated_minutes),
      summary: form.summary.trim(),
      content: form.content,
      media_url: form.media_url.trim(),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      recommended_for_roles: form.recommended_for_roles,
      is_published: form.is_published,
    };
    try {
      if (editingSlug) {
        await contentService.updateLesson(editingSlug, payload);
        setBaseline(form);
        toast.success("Lesson saved.");
      } else {
        await contentService.createLesson(payload);
        toast.success(form.is_published ? "Lesson published." : "Lesson saved as a draft.");
        navigate("/admin/content?tab=lessons");
      }
    } catch (error) {
      setErrors(fieldErrors(error));
      setFormError(errorMessage(error, "We could not save this lesson."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Title" wrapperClassName="md:col-span-2" value={form.title} onChange={(event) => update("title", event.target.value)} error={errors.title} maxLength={220} required />
              <div>
                <Select label="Category" value={form.category_id} onChange={(event) => update("category_id", event.target.value)} error={errors.category_id || errors.category} required>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <CategoryCreator
                  onCreated={(category) => {
                    setCategories((current) => [...current, category]);
                    update("category_id", String(category.id));
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Difficulty" value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)} error={errors.difficulty}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
                <Input label="Minutes" type="number" min={1} max={240} value={form.estimated_minutes} onChange={(event) => update("estimated_minutes", event.target.value)} error={errors.estimated_minutes} />
              </div>
              <Textarea label="Summary" hint="Shown on the lesson card." wrapperClassName="md:col-span-2" rows={3} className="min-h-20" value={form.summary} onChange={(event) => update("summary", event.target.value)} error={errors.summary} required />
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-white">Lesson content</h2>
              <Toggle label="Live preview" checked={showPreview} onChange={setShowPreview} />
            </div>
            <div className={showPreview ? "grid gap-4 lg:grid-cols-2" : ""}>
              <div>
                <Textarea
                  label="Content (Markdown)"
                  hideLabel
                  className="min-h-[26rem] font-mono text-sm"
                  value={form.content}
                  onChange={(event) => update("content", event.target.value)}
                  error={errors.content}
                  hint="Supports ## headings, lists, > quotes, tables, **bold** and `code`."
                  required
                />
                {!form.content && (
                  <button type="button" onClick={() => update("content", STARTER)} className="focus-ring mt-2 rounded text-sm text-cyanx hover:text-sky-200">
                    Insert a starter outline
                  </button>
                )}
              </div>
              {showPreview && (
                <div className="glass-tile max-h-[30rem] overflow-y-auto rounded-xl p-4" aria-label="Lesson preview" role="region">
                  {form.content.trim() ? <MarkdownContent source={form.content} /> : <p className="text-sm text-slate-400">Your formatted lesson appears here as you type.</p>}
                </div>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <h2 className="mb-4 font-semibold text-white">Publishing</h2>
            <Toggle label="Published" description="Drafts are only visible to administrators." checked={form.is_published} onChange={(value) => update("is_published", value)} />
            {editingSlug && <p className="mt-4 break-all text-xs text-slate-400">URL: /training/{editingSlug}</p>}
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold text-white">Details</h2>
            <div className="space-y-4">
              <Input label="Tags" hint="Comma-separated, for search." value={form.tags} onChange={(event) => update("tags", event.target.value)} error={errors.tags} />
              <Input label="Media URL" type="url" hint="Optional link to a video or resource." value={form.media_url} onChange={(event) => update("media_url", event.target.value)} error={errors.media_url} />
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-300">Recommended for</legend>
                <div className="space-y-2">
                  {ROLES.map((role) => (
                    <label key={role.code} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" className="h-4 w-4 accent-cyan-400" checked={form.recommended_for_roles.includes(role.code)} onChange={() => toggleRole(role.code)} />
                      {role.label}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">Beginner lessons are recommended to everyone.</p>
              </fieldset>
            </div>
          </Card>
        </aside>
      </div>
      {formError && (
        <Alert tone="error" className="mt-6">
          {formError}
        </Alert>
      )}
      <EditorBar cancelTo="/admin/content?tab=lessons" saving={saving} dirty={dirty} saveLabel={editingSlug ? "Save changes" : form.is_published ? "Publish lesson" : "Save draft"} />
    </form>
  );
}

export default function LessonEditorPage() {
  const { slug } = useParams();
  const categoriesQuery = useAsync(() => contentService.categories().then((items) => (Array.isArray(items) ? items : [])), []);
  const lessonQuery = useAsync(() => (slug ? contentService.lesson(slug) : Promise.resolve(null)), [slug]);

  const back = (
    <Button as={Link} to="/admin/content?tab=lessons" variant="secondary">
      <ArrowLeft className="h-4 w-4" />
      All content
    </Button>
  );
  const header = <PageHeader eyebrow="Content" title={slug ? "Edit lesson" : "New lesson"} description="Write the lesson in Markdown. Keep it short and end with something the learner can do." actions={back} />;

  if (categoriesQuery.loading || lessonQuery.loading) {
    return (
      <div role="status" aria-live="polite">
        {header}
        <span className="sr-only">Loading editor…</span>
        <Skeleton className="h-96" />
      </div>
    );
  }
  const error = categoriesQuery.error || lessonQuery.error;
  if (error) {
    return (
      <div>
        {header}
        <LoadError
          error={error}
          message="We could not load the editor."
          onRetry={() => {
            categoriesQuery.reload();
            lessonQuery.reload();
          }}
        />
      </div>
    );
  }

  const lesson = lessonQuery.data;
  const initial = {
    title: lesson?.title || "",
    category_id: lesson?.category?.id ? String(lesson.category.id) : "",
    difficulty: lesson?.difficulty || "beginner",
    estimated_minutes: lesson?.estimated_minutes ?? 8,
    summary: lesson?.summary || "",
    content: lesson?.content || "",
    media_url: lesson?.media_url || "",
    tags: (lesson?.tags || []).join(", "),
    recommended_for_roles: lesson?.recommended_for_roles || [],
    is_published: lesson?.is_published ?? false,
  };

  return (
    <div>
      {header}
      <LessonForm key={slug || "new"} initial={initial} categories={categoriesQuery.data || []} editingSlug={slug} />
    </div>
  );
}
