import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import clsx from "clsx";

const ToastContext = createContext(null);

const tones = {
  success: { box: "border-mint/30 text-emerald-100", icon: CheckCircle2 },
  error: { box: "border-danger/40 text-rose-100", icon: AlertCircle },
  info: { box: "border-cyanx/30 text-cyan-100", icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);

  const push = useCallback(
    (message, tone = "info", { action } = {}) => {
      const id = nextId.current++;
      setToasts((items) => [...items.slice(-3), { id, message, tone, action }]);
      // Errors and toasts with an action (e.g. Undo) stay a little longer.
      setTimeout(() => dismiss(id), tone === "error" || action ? 8000 : 5000);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      push,
      dismiss,
      success: (message, options) => push(message, "success", options),
      error: (message, options) => push(message, "error", options),
      info: (message, options) => push(message, "info", options),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const config = tones[toast.tone] || tones.info;
  const Icon = config.icon;
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);
  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={clsx(
        "glass-panel pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-3 text-sm transition duration-200 motion-reduce:transition-none",
        config.box,
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          className="focus-ring rounded px-1.5 font-semibold underline"
          onClick={() => {
            toast.action.onClick();
            onDismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className="focus-ring rounded p-0.5 text-slate-400 hover:text-white" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
