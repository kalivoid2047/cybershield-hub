import { useEffect } from "react";

// Warns before the tab is closed or reloaded while an editor has unsaved edits.
export default function useUnsavedChanges(dirty) {
  useEffect(() => {
    if (!dirty) return undefined;
    function onBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
