"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import NestleLogo from "./NestleLogo";
import { useTeam } from "@/lib/useTeam";
import { createClient } from "@/lib/supabase/client";

interface NavHeaderProps {
  teamName?: string;
  teamPoints?: number;
  gameCards?: number;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
}

export default function NavHeader({
  teamName = "No Team Yet",
  teamPoints = 0,
  gameCards = 0,
  showBack = false,
  backHref = "/",
  backLabel = "All Modules",
}: NavHeaderProps) {
  const { teamId, teamName: activeTeamName, hasTeam } = useTeam();
  const [livePoints, setLivePoints] = useState<number | null>(null);
  const [liveCards, setLiveCards] = useState<number | null>(null);

  useEffect(() => {
    if (!hasTeam || !teamId) return;
    const sb = createClient();
    if (!sb) return;
    sb.from("team_leaderboard").select("total_points,total_game_cards").eq("team_id", teamId).single().then(({ data }) => {
      if (data) { setLivePoints(data.total_points); setLiveCards(data.total_game_cards); }
    });
  }, [hasTeam, teamId]);

  const displayName = hasTeam ? activeTeamName : teamName;
  const displayPoints = hasTeam ? (livePoints ?? 0) : teamPoints;
  const displayCards = hasTeam ? (liveCards ?? 0) : gameCards;

  return (
    <header className="sticky top-0 z-50 bg-nestle-blue shadow-md">
      <div className="flex items-center justify-between h-[60px] px-4 md:px-6 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <NestleLogo size={36} />
          <div>
            <span className="block text-white font-bold text-[17px] leading-tight tracking-tight group-hover:text-white/90 transition-colors">Nestle</span>
            <span className="block text-white/60 text-[10px] font-medium tracking-[0.8px] uppercase leading-none">SHE Day 2025</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {showBack ? (
            <Link href={backHref} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/25 text-white text-[13px] font-medium px-3.5 py-1.5 rounded-lg transition-colors no-underline">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8.5 11L4.5 7L8.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {backLabel}
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full px-3 py-1.5 transition-colors no-underline">
              <span className={`w-2 h-2 rounded-full inline-block ${hasTeam ? "bg-nestle-gold animate-pulse" : "bg-white/40"}`} />
              <span className="text-white text-[12px] font-medium">{displayName}</span>
              <span className="text-white/40 text-[11px]">.</span>
              <span className="text-nestle-gold text-[13px] font-bold">{displayPoints} pts</span>
              {displayCards > 0 && (<><span className="text-white/40 text-[11px]">.</span><span className="text-white/70 text-[11px]">{displayCards} cards</span></>)}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
