"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "she-day-active-team";

export interface ActiveTeam {
  teamId: string;
  teamName: string;
  members: string[];
}

export function useTeam() {
  const [team, setTeam] = useState<ActiveTeam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTeam(JSON.parse(raw));
    } catch (_) {}
    setLoading(false);
  }, []);

  const setActiveTeam = useCallback((t: ActiveTeam) => {
    setTeam(t);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch (_) {}
  }, []);

  const clearActiveTeam = useCallback(() => {
    setTeam(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }, []);

  return {
    teamId: team?.teamId || "",
    teamName: team?.teamName || "",
    members: team?.members || [],
    hasTeam: !!team,
    loading,
    setActiveTeam,
    clearActiveTeam,
  };
}
