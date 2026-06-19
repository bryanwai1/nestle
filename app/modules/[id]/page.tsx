import { notFound } from "next/navigation";
import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import { MODULES, PRIORITY_LABELS, PRIORITY_STYLES } from "@/lib/modules";

interface ModulePageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return MODULES.map((m) => ({ id: String(m.id) }));
}

export function generateMetadata({ params }: ModulePageProps) {
  const module = MODULES.find((m) => m.id === Number(params.id));
  if (!module) return { title: "Not Found" };
  return {
    title: `Module ${module.id}: ${module.title} — Nestlé SHE Day`,
  };
}

export default function ModulePage({ params }: ModulePageProps) {
  const module = MODULES.find((m) => m.id === Number(params.id));
  if (!module) notFound();

  const priorityStyle = PRIORITY_STYLES[module.priority];

  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader
        teamName="Team Alpha"
        teamPoints={480}
        showBack
        backHref="/"
        backLabel="All Modules"
      />

      <main className="px-4 py-5 animate-fade-in">
        {/* ── Module header card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-4 relative overflow-hidden">
          {/* Accent stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-[4px]"
            style={{ background: module.accentColor }}
          />

          <div className="flex items-start gap-4 mt-1">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-[28px] shrink-0"
              style={{ background: module.bgColor }}
            >
              {module.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[9px] font-bold uppercase tracking-[0.5px] rounded-md px-1.5 py-0.5 ${priorityStyle.badge}`}
                >
                  {PRIORITY_LABELS[module.priority]}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Module {String(module.id).padStart(2, "0")} · {module.games.length} games
                </span>
              </div>
              <h1 className="text-[20px] font-bold text-gray-900 leading-tight mb-1">
                {module.title}
              </h1>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {module.description}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="game-badge">🎮 {module.games.length} Games</span>
            <span className="game-badge">⚡ Speed Scored</span>
            <span className="game-badge">🃏 Game Cards Eligible</span>
          </div>
        </div>

        {/* ── Game mechanisms ── */}
        <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-[0.5px] mb-3">
          Game Mechanisms
        </h2>

        <ul className="space-y-3" role="list">
          {module.games.map((game, idx) => (
            <li key={game.id}>
              <Link
                href={game.route}
                className="flex items-center gap-4 bg-white rounded-xl border-[1.5px] border-gray-100 p-4 no-underline shadow-card hover:border-nestle-blue-mid hover:shadow-[0_0_0_3px_#EBF0FA] transition-all group"
              >
                {/* Game number */}
                <div className="shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[12px] font-bold text-gray-500">
                  {idx + 1}
                </div>

                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-[20px] shrink-0"
                  style={{ background: module.bgColor }}
                >
                  {game.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 mb-0.5">
                    {game.title}
                  </p>
                  <p className="text-[12px] text-gray-400 leading-snug">
                    {game.description}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  aria-hidden="true"
                  className="shrink-0 text-gray-300 group-hover:text-nestle-blue-mid transition-colors"
                >
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Start button ── */}
        <Link
          href={module.games[0].route}
          className="btn-primary block text-center mt-6 no-underline"
        >
          ▶ Start Module {module.id}
        </Link>

        {/* ── Back link ── */}
        <div className="text-center mt-4 pb-8">
          <Link href="/" className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
            ← Back to all modules
          </Link>
        </div>
      </main>
    </div>
  );
}
