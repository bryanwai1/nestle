"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";
import TeamSetup from "./TeamSetup";
import ScoreTicker from "./ScoreTicker";
import HeroBanner from "./HeroBanner";
import Scoreboard from "./Scoreboard";
import ModuleCard from "./ModuleCard";
import { MODULES } from "@/lib/modules";
import type { TeamLeaderboard } from "@/types/database";

const MOCK_TEAMS: TeamLeaderboard[] = [
  { team_id: "mock-1", team_name: "Team Delta", team_color: "#2B5BA8", team_initials: "TD", total_points: 610, total_game_cards: 5, modules_completed: 6 },
  { team_id: "mock-2", team_name: "Team Sigma", team_color: "#00853F", team_initials: "TS", total_points: 540, total_game_cards: 4, modules_completed: 5 },
  { team_id: "mock-3", team_name: "Team Omega", team_color: "#F5A623", team_initials: "TO", total_points: 430, total_game_cards: 2, modules_completed: 3 },
];

export default function HomeDashboard() {
  const { teamId, teamName, hasTeam } = useTeam();
  const [teams, setTeams] = useState<TeamLeaderboard[]>(MOCK_TEAMS);

  useEffect(() => {
    const sb = createClient();
    if (!sb) return;
    sb.from("team_leaderboard").select("*").order("total_points", { ascending: false }).limit(10).then(({ data, error }) => {
      if (!error && data && data.length > 0) setTeams(data as TeamLeaderboard[]);
    });
  }, [teamId]);

  const totalGameCards = teams.reduce((s, t) => s + t.total_game_cards, 0);
  const myTeam = teams.find(t => t.team_id === teamId);

  return (
    <>
      <ScoreTicker
        entries={teams.map((t, i) => ({ rank: i + 1, teamName: t.team_name, points: t.total_points, gameCards: t.total_game_cards, isMe: t.team_id === teamId }))}
        totalGameCards={totalGameCards}
      />
      <HeroBanner teamName={hasTeam ? teamName : undefined} modulesCompleted={myTeam?.modules_completed || 0} totalModules={10} />

      <main className="px-4 py-5 space-y-5">
        <TeamSetup />

        <section aria-labelledby="scoreboard-heading">
          <div className="flex items-baseline justify-between mb-2.5">
            <h2 id="scoreboard-heading" className="text-[13px] font-semibold text-gray-500 uppercase tracking-[0.5px]">Live Scoreboard</h2>
            <span className="text-[12px] text-gray-400">Top {Math.min(teams.length,5)} teams</span>
          </div>
          <Scoreboard teams={teams.slice(0,5)} myTeamId={teamId} />
        </section>

        <section aria-labelledby="modules-heading">
          <div className="flex items-baseline justify-between mb-2.5">
            <h2 id="modules-heading" className="text-[13px] font-semibold text-gray-500 uppercase tracking-[0.5px]">Game Modules</h2>
          </div>

          <p className="text-[11px] font-bold text-nestle-red uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-nestle-red inline-block" />Priority 1 - Core Safety
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {MODULES.filter(m=>m.priority===1).map(m => <ModuleCard key={m.id} module={m} />)}
          </div>

          <p className="text-[11px] font-bold text-nestle-blue uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-nestle-blue inline-block" />Priority 2 - Health & Environment
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {MODULES.filter(m=>m.priority===2).map(m => <ModuleCard key={m.id} module={m} />)}
          </div>

          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />Priority 3 - Wellness
          </p>
          <div className="grid grid-cols-2 gap-3">
            {MODULES.filter(m=>m.priority===3).map(m => <ModuleCard key={m.id} module={m} />)}
          </div>
        </section>

        <footer className="pt-4 pb-8 text-center">
          <p className="text-[11px] text-gray-400">Nestle SHE Day 2025 . Sales Region Challenge</p>
          <p className="text-[10px] text-gray-300 mt-1">Speed + Accuracy = Game Cards . Game Cards = TNG Prizes</p>
        </footer>
      </main>
    </>
  );
}
