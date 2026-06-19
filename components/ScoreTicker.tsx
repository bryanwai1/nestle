"use client";

interface TickerEntry {
  rank: number;
  teamName: string;
  points: number;
  gameCards: number;
  isMe?: boolean;
}

interface ScoreTickerProps {
  entries: TickerEntry[];
  totalGameCards?: number;
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function ScoreTicker({ entries, totalGameCards = 0 }: ScoreTickerProps) {
  const tickerItems = entries
    .map(
      (e) =>
        `${RANK_MEDALS[e.rank - 1] ?? `#${e.rank}`} ${e.teamName}${e.isMe ? " (You)" : ""} — ${e.points} pts`
    )
    .join("   ·   ");

  const full = `${tickerItems}   ·   🃏 Game Cards Awarded Today: ${totalGameCards}   ·   ${tickerItems}`;

  return (
    <div
      className="bg-nestle-blue-mid overflow-hidden h-8 flex items-center"
      aria-label="Live scoreboard ticker"
    >
      <div className="ticker-track whitespace-nowrap text-white/80 text-[11.5px] font-medium flex items-center gap-0">
        <span className="px-3 text-nestle-gold font-bold shrink-0">⚡ LIVE</span>
        <span>{full}</span>
      </div>
    </div>
  );
}
