import { Link } from "react-router-dom";
import { Save } from "lucide-react";
import Button from "../common/Button.jsx";

// Sticky save bar shared by the three content editors.
export default function EditorBar({ cancelTo, saving, dirty, saveLabel = "Save", note }) {
  return (
    <div className="glass-strong sticky bottom-3 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
      <p className="text-sm text-slate-300" role="status">
        {note || (dirty ? "You have unsaved changes." : "All changes saved.")}
      </p>
      <div className="flex gap-2">
        <Button as={Link} to={cancelTo} variant="ghost">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : saveLabel}
        </Button>
      </div>
    </div>
  );
}
