import { useCallback, useEffect, useState } from "react";
import type { ExpertRunEvent, HermesExpertRun } from "../../../../../../../shared/hermes-experts/hermes-experts-contract";

export function useExpertRuns(initialFilter?: { status?: string }) {
  const [runs, setRuns] = useState<HermesExpertRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (typeof window.hermesExperts === "undefined") return;
    setLoading(true);
    setError(null);
    try {
      const list = await window.hermesExperts.listExpertRuns(
        initialFilter?.status ? { status: initialFilter.status as HermesExpertRun["status"] } : undefined,
      );
      setRuns(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [initialFilter?.status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { runs, loading, error, refresh };
}

export function useExpertRunEvents(runId: string | null) {
  const [events, setEvents] = useState<ExpertRunEvent[]>([]);
  const [run, setRun] = useState<HermesExpertRun | null>(null);

  const load = useCallback(async () => {
    if (!runId || typeof window.hermesExperts === "undefined") return;
    const detail = await window.hermesExperts.getExpertRun(runId);
    setRun(detail);
    const timeline = await window.hermesExperts.getRunTimeline(runId);
    if (timeline.ok && timeline.data?.length) {
      setEvents(timeline.data);
    } else {
      setEvents(detail?.events ?? []);
    }
  }, [runId]);

  useEffect(() => {
    void load();
    if (!runId || typeof window.hermesExperts === "undefined") return;

    const unsub = window.hermesExperts.onExpertRuntimeEvent((event) => {
      if (event.runId === runId) void load();
    });

    return () => {
      unsub();
    };
  }, [runId, load]);

  return { run, events, reload: load };
}
