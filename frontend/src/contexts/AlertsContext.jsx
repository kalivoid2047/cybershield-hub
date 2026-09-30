import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import useAsync from "../hooks/useAsync.js";
import { alertService } from "../services/cyberShieldApi.js";

const AlertsContext = createContext(null);
const POLL_MS = 90_000;

// Single source of truth for the signed-in user's notifications so the sidebar
// badge, the header bell and the Alerts page never disagree about "unread".
export function AlertsProvider({ children }) {
  const { data, loading, error, reload, setData } = useAsync(() => alertService.notifications().then((items) => (Array.isArray(items) ? items : [])), []);

  // Quiet background refresh: keeps the badge current without flashing the
  // page into a loading state.
  useEffect(() => {
    const timer = setInterval(() => {
      alertService
        .notifications()
        .then((items) => Array.isArray(items) && setData(items))
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [setData]);

  const notifications = useMemo(() => data || [], [data]);
  const latest = useRef(notifications);
  latest.current = notifications;

  // Optimistic: the UI updates immediately and rolls back if the request fails,
  // so the caller can just surface the error.
  const markRead = useCallback(
    async (id) => {
      const previous = latest.current;
      setData(previous.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
      try {
        await alertService.markRead(id);
      } catch (error) {
        setData(previous);
        throw error;
      }
    },
    [setData],
  );

  const markAllRead = useCallback(async () => {
    const previous = latest.current;
    setData(previous.map((item) => ({ ...item, is_read: true })));
    try {
      await alertService.markAllRead();
    } catch (error) {
      setData(previous);
      throw error;
    }
  }, [setData]);

  const value = useMemo(
    () => ({
      notifications,
      unread: notifications.filter((item) => !item.is_read).length,
      loading,
      error,
      reload,
      markRead,
      markAllRead,
    }),
    [notifications, loading, error, reload, markRead, markAllRead],
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) throw new Error("useAlerts must be used inside AlertsProvider");
  return context;
}
