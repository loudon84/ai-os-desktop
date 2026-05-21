import { useCallback, useEffect, useMemo, useState } from "react";
import { aiosWorkspaceApi } from "../api/aiosWorkspaceApi";
import type { AIOSSkill } from "../types";

export function useProfileSkills(profileId: string | null, search: string): {
  skills: AIOSSkill[];
  grouped: Record<string, AIOSSkill[]>;
  loading: boolean;
  error: string | null;
  selectedSkill: AIOSSkill | null;
  skillContent: string;
  selectSkill: (skill: AIOSSkill | null) => void;
  refetch: () => Promise<void>;
} {
  const [skills, setSkills] = useState<AIOSSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<AIOSSkill | null>(null);
  const [skillContent, setSkillContent] = useState("");

  const refetch = useCallback(async () => {
    if (!profileId) {
      setSkills([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSkills(await aiosWorkspaceApi.listSkills(profileId));
    } catch (err) {
      setError(String(err));
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void refetch();
    setSelectedSkill(null);
    setSkillContent("");
  }, [profileId, refetch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.sourceType.includes(q),
    );
  }, [skills, search]);

  const grouped = useMemo(() => {
    const map: Record<string, AIOSSkill[]> = {};
    for (const s of filtered) {
      const cat = s.category || "general";
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    }
    return map;
  }, [filtered]);

  const selectSkill = useCallback(async (skill: AIOSSkill | null) => {
    setSelectedSkill(skill);
    if (!skill) {
      setSkillContent("");
      return;
    }
    try {
      setSkillContent(await aiosWorkspaceApi.readSkillContent(skill.path));
    } catch (err) {
      setSkillContent(String(err));
    }
  }, []);

  return {
    skills: filtered,
    grouped,
    loading,
    error,
    selectedSkill,
    skillContent,
    selectSkill,
    refetch,
  };
}
