"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Team = Database["public"]["Tables"]["teams"]["Row"];

export function useRealtimeLeaderboard(limit?: number) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data: session } = await (supabase as any).from("event_sessions").select("id").eq("is_active", true).single();
      const sessionId = session?.id;
      let query = (supabase as any)
        .from("teams")
        .select("*")
        .order("current_total_score", { ascending: false });
      if (sessionId) query = query.eq("session_id", sessionId);
      if (limit) query = query.limit(limit);
      const { data } = await query;
      if (!cancelled && data) setTeams(data);
      if (!cancelled) setLoading(false);
    }
    load();

    const channel = supabase
      .channel("leaderboard-teams-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { teams, loading };
}
