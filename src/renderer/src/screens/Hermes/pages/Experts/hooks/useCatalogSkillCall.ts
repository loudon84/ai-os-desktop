import { useCallback, useEffect, useState } from "react";
import type { RemoteExpertSkill } from "../../../../../../../shared/hermes-experts/hermes-experts-contract";

export function useCatalogSkills(slug: string | undefined, open: boolean) {
  const [skills, setSkills] = useState<RemoteExpertSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !slug?.trim() || typeof window.hermesExperts === "undefined") {
      setSkills([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void window.hermesExperts.listCatalogSkills(slug).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.data?.length) {
        setSkills([]);
        setError(res.error ?? "No skills available");
        return;
      }
      setSkills(res.data.filter((s) => s.callEnabled));
    });

    return () => {
      cancelled = true;
    };
  }, [open, slug]);

  return { skills, loading, error };
}

export function useCatalogSkillCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (input: {
      slug: string;
      catalogKind: "expert" | "expert_team";
      skillName: string;
      prompt: string;
      context?: Record<string, unknown>;
    }) => {
      if (typeof window.hermesExperts === "undefined") {
        return { ok: false as const, errorCode: "EXPERT_MCP_CALL_FAILED", message: "API unavailable" };
      }
      setLoading(true);
      setError(null);
      const result = await window.hermesExperts.callCatalogSkill(input);
      setLoading(false);
      if (!result.ok) {
        setError(result.message ?? result.errorCode ?? "Call failed");
      }
      return result;
    },
    [],
  );

  return { call, loading, error, setError };
}
