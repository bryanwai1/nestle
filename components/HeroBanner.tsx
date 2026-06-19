interface HeroBannerProps {
  teamName?: string;
  modulesCompleted?: number;
  totalModules?: number;
}

export default function HeroBanner({
  teamName,
  modulesCompleted = 0,
  totalModules = 10,
}: HeroBannerProps) {
  const pct = Math.round((modulesCompleted / totalModules) * 100);

  return (
    <section className="bg-gradient-to-br from-nestle-blue to-nestle-blue-mid px-5 pt-7 pb-6 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/[0.03] pointer-events-none" />
      <div className="absolute -right-4 top-16 w-28 h-28 rounded-full bg-white/[0.03] pointer-events-none" />

      <p className="text-nestle-gold text-[11px] font-semibold tracking-[1.2px] uppercase mb-1.5">
        Safety · Health · Environment
      </p>
      <h1 className="text-white text-[22px] font-bold leading-tight mb-1.5 tracking-tight">
        SHE Day Challenge{" "}
        <span className="text-white/70 font-normal">2025</span>
      </h1>
      {teamName && (
        <p className="text-white/80 text-[13px] mb-3">
          Welcome back, <span className="font-semibold text-white">{teamName}</span>
        </p>
      )}
      {!teamName && (
        <p className="text-white/70 text-[13px] leading-relaxed mb-3">
          Complete modules, earn Game Cards and compete for Touch&nbsp;'n&nbsp;Go prizes.
        </p>
      )}

      {/* Progress bar */}
      {modulesCompleted > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-white/60 mb-1">
            <span>Overall Progress</span>
            <span className="text-white font-semibold">{modulesCompleted}/{totalModules} modules</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-nestle-green rounded-full progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mt-4">
        {[
          "📍 Sales Region",
          "👥 Teams of 3",
          "🎁 TNG Prizes",
          "10 Modules",
        ].map((badge) => (
          <span
            key={badge}
            className="bg-white/10 border border-white/20 rounded-full px-3 py-1 text-white/80 text-[11px] font-medium"
          >
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}
