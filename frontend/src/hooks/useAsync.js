import { useCallback, useEffect, useRef, useState } from "react";

// Runs an async loader on mount (and whenever `deps` change) and exposes
// loading / error state plus a `reload` for Retry buttons. `setData` lets pages
// apply optimistic updates without re-fetching.
export default function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));
    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  const setData = useCallback(
    (updater) => setState((current) => ({ ...current, data: typeof updater === "function" ? updater(current.data) : updater })),
    [],
  );

  return { ...state, reload, setData };
}
