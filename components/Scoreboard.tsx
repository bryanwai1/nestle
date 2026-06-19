import type { TeamLeaderboard } from "@/types/database";

interface ScoreboardProps {
  teams: TeamLeaderboard[];
  myTeamId?: string;
}

const RANK_CONFIG = [
  { medal: "🥇", textClass: "text-amber-500", label: "1st" },
  { medal: "🥈", textClass: "text-gray-400", label: "2nd" },
  { medal: "🥉", textClass: "text-amber-700", label: "3rd" },
  { medal: "",   textClass: "text-gray-400", label: "" },
  { medal: "",   textClass: "text-gray-400", label: "" },
];

export default function Scoreboard({ teams, myTeamId }: ScoreboardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <span className="text-nestle-gold text-[15px]" aria-hidden="true">🏆</span>
        <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-[0.6px]">
          Team Rankings
        </span>
      </div>

      {/* Team rows */}
      <ul className="divide-y divide-gray-100" role="list">
        {teams.slice(0, 5).map((team, idx) => {
          const rank = RANK_CONFIG[idx] ?? RANK_CONFIG[3];
          const isMe = team.team_id === myTeamId;

          return (
            <li
              key={team.team_id}
              className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                isMe ? "bg-nestle-blue-light/40" : "hover:bg-gray-50"
              }`}
            >
              {/* Rank */}
              <div className={`w-6 text-center text-[13px] font-bold shrink-0 ${rank.textClass}`}>
                {rank.medal || idx + 1}
              </div>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                style={{ backgroundColor: team.team_color || "#1B3A6B" }}
                aria-hidden="true"
              >
                {team.team_initials}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[13px] truncate ${
                    isMe
                      ? "font-bold text-nestle-blue"
                      : "font-medium text-gray-900"
                  }`}
                >
                  {team.team_name}
                  {isMe && (
                    <span className="ml-1.5 text-[10px] text-nestle-red font-bold">(You)</span>
                  )}
                </p>
                <p className="text-[11px] text-gray-400">
                  {team.modules_completed}/10 modules · 🃏 {team.total_game_cards} cards
                </p>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <p className="text-[15px] font-bold text-nestle-blue">
                  {team.total_points.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">pts</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
