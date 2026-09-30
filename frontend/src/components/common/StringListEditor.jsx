import { useId } from "react";
import { Plus, X } from "lucide-react";
import Button from "./Button.jsx";

// Edits a list of short strings (URLs, red flags): one input per row, add and remove.
export default function StringListEditor({ label, hint, values, onChange, placeholder, addLabel = "Add", max = 12, type = "text", error }) {
  const id = useId();
  const update = (index, value) => onChange(values.map((item, position) => (position === index ? value : item)));

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-300">{label}</legend>
      <ul className="space-y-2">
        {values.map((value, index) => (
          <li key={index} className="flex items-center gap-2">
            <input
              id={`${id}-${index}`}
              type={type}
              value={value}
              onChange={(event) => update(index, event.target.value)}
              placeholder={placeholder}
              aria-label={`${label} ${index + 1}`}
              className="focus-ring min-h-11 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/25 px-3 text-white shadow-[inset_0_2px_6px_rgba(0,0,0,.35)] placeholder:text-slate-400 hover:border-white/25 focus:border-cyanx/60"
            />
            <button type="button" onClick={() => onChange(values.filter((_, position) => position !== index))} className="focus-ring rounded-lg p-2.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}>
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" className="min-h-9 px-3 py-1" disabled={values.length >= max} onClick={() => onChange([...values, ""])}>
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
        {error && <p className="text-xs text-rose-200">{error}</p>}
      </div>
    </fieldset>
  );
}
