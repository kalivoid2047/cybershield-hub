import { useState } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import Alert from "../../../components/common/Alert.jsx";
import Button from "../../../components/common/Button.jsx";
import Card from "../../../components/common/Card.jsx";
import Dialog from "../../../components/common/Dialog.jsx";
import EmptyState from "../../../components/common/EmptyState.jsx";
import { Input, Textarea } from "../../../components/common/Field.jsx";
import LoadError from "../../../components/common/LoadError.jsx";
import { SkeletonRows } from "../../../components/common/Skeleton.jsx";
import { useToast } from "../../../components/common/Toast.jsx";
import useAsync from "../../../hooks/useAsync.js";
import { contentService } from "../../../services/cyberShieldApi.js";
import { errorMessage, fieldErrors } from "../../../utils/errors.js";

const HEX = /^#[0-9a-fA-F]{6}$/;

function CategoryDialog({ category, onClose, onSaved }) {
  const editing = Boolean(category);
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    color: category?.color || "#38bdf8",
    icon: category?.icon || "",
    order: category?.order ?? 0,
  });
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
    if (!form.name.trim()) local.name = "Give the category a name.";
    if (!HEX.test(form.color)) local.color = "Use a hex colour such as #38bdf8.";
    if (!(Number(form.order) >= 0)) local.order = "Order must be 0 or more.";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setBusy(true);
    setFormError("");
    const payload = { name: form.name.trim(), description: form.description.trim(), color: form.color, icon: form.icon.trim(), order: Number(form.order) };
    try {
      const saved = editing ? await contentService.updateCategory(category.id, payload) : await contentService.createCategory(payload);
      onSaved(saved, editing);
    } catch (error) {
      setErrors(fieldErrors(error));
      setFormError(errorMessage(error, "We could not save this category."));
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={editing ? "Edit category" : "New category"} description={editing ? "Renaming keeps existing lesson links and URLs working." : "Categories group lessons on the training page."}>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Input label="Name" value={form.name} onChange={(event) => update("name", event.target.value)} error={errors.name} maxLength={120} required />
        <Textarea label="Description" rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} error={errors.description} />
        <div>
          <label htmlFor="category-color-text" className="mb-2 block text-sm font-medium text-slate-300">
            Colour
          </label>
          <div className="flex items-center gap-3">
            <input type="color" aria-label="Pick a colour" value={HEX.test(form.color) ? form.color : "#38bdf8"} onChange={(event) => update("color", event.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-white/12 bg-black/25 p-1" />
            <input
              id="category-color-text"
              value={form.color}
              onChange={(event) => update("color", event.target.value)}
              aria-invalid={errors.color ? true : undefined}
              className="focus-ring min-h-11 flex-1 rounded-xl border border-white/12 bg-black/25 px-3 font-mono text-white"
            />
          </div>
          {errors.color && <p className="mt-1.5 text-xs text-rose-200">{errors.color}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Icon name" hint="Optional, e.g. MailWarning." value={form.icon} onChange={(event) => update("icon", event.target.value)} error={errors.icon} />
          <Input label="Order" type="number" min={0} hint="Lower shows first." value={form.order} onChange={(event) => update("order", event.target.value)} error={errors.order} />
        </div>
        {formError && <Alert tone="error">{formError}</Alert>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : editing ? "Save changes" : "Create category"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function CategoryRow({ category, onEdit, onDeleted }) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const inUse = category.lesson_count > 0;

  async function destroy() {
    setBusy(true);
    try {
      await contentService.deleteCategory(category.id);
      toast.success(`Deleted "${category.name}".`);
      onDeleted(category.id);
    } catch (error) {
      toast.error(errorMessage(error, "We could not delete that category."));
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <li className="py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-1 h-4 w-4 shrink-0 rounded-full ring-2 ring-white/20" style={{ backgroundColor: category.color }} aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold text-white">{category.name}</p>
            <p className="mt-0.5 text-sm text-slate-400">
              {category.lesson_count} {category.lesson_count === 1 ? "lesson" : "lessons"} · order {category.order}
              {category.description ? ` · ${category.description}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="min-h-9 px-3 py-1" onClick={() => onEdit(category)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            className="min-h-9 px-3 py-1 text-rose-300 hover:bg-danger/15"
            disabled={inUse}
            title={inUse ? "Move or delete this category's lessons first" : undefined}
            onClick={() => setConfirming(true)}
            aria-label={inUse ? `Delete ${category.name} (unavailable: it still has lessons)` : `Delete ${category.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {confirming && (
        <div className="mt-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-rose-100" role="alert">
          <p>
            Delete <strong>{category.name}</strong>? This can't be undone. Any quizzes filed under it are simply un-categorised.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="danger" className="min-h-9 px-3 py-1" disabled={busy} onClick={destroy}>
              {busy ? "Deleting..." : "Delete category"}
            </Button>
            <Button variant="ghost" className="min-h-9 px-3 py-1" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function CategoriesPanel() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => contentService.categories().then((items) => (Array.isArray(items) ? items : [])), []);
  // undefined = closed, null = creating, object = editing
  const [dialog, setDialog] = useState(undefined);
  const categories = data || [];

  function saved(category, wasEditing) {
    toast.success(wasEditing ? "Category saved." : "Category created.");
    setDialog(undefined);
    reload();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Categories group lessons on the training page. A category can only be deleted once it has no lessons.</p>
        <Button onClick={() => setDialog(null)}>
          <Plus className="h-4 w-4" />
          New category
        </Button>
      </div>
      {loading ? (
        <Card>
          <SkeletonRows count={4} />
        </Card>
      ) : error ? (
        <LoadError error={error} message="We could not load categories." onRetry={reload} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create a category before writing your first lesson."
          action={
            <Button onClick={() => setDialog(null)}>
              <Plus className="h-4 w-4" />
              New category
            </Button>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-white/10">
            {categories.map((category) => (
              <CategoryRow key={category.id} category={category} onEdit={setDialog} onDeleted={(id) => setData((current) => current.filter((item) => item.id !== id))} />
            ))}
          </ul>
        </Card>
      )}
      {dialog !== undefined && <CategoryDialog key={dialog?.id || "new"} category={dialog} onClose={() => setDialog(undefined)} onSaved={saved} />}
    </>
  );
}
