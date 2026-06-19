import Link from "next/link";
import type { Module } from "@/lib/modules";
import { PRIORITY_LABELS, PRIORITY_STYLES } from "@/lib/modules";

interface ModuleCardProps {
  module: Module;
  completed?: boolean;
  progress?: number; // 0–100
}

export default function ModuleCard({
  module,
  completed = false,
  progress = 0,
}: ModuleCardProps) {
  const priorityStyle = PRIORITY_STYLES[module.priority];

  return (
    <Link
      href={`/modules/${module.id}`}
      className="module-card block bg-white rounded-xl border-[1.5px] border-gray-100 p-4 no-underline relative overflow-hidden shadow-card"
      aria-label={`Module ${module.id}: ${module.title}`}
    >
      {/* Accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: module.accentColor }}
        aria-hidden="true"
      />

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-2.5 mt-1"
        style={{ background: module.bgColor }}
        aria-hidden="true"
      >
        {module.icon}
      </div>

      {/* Module number */}
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.6px] mb-0.5">
        Module {String(module.id).padStart(2, "0")}
      </p>

      {/* Title */}
      <h3 className="text-[13px] font-semibold text-gray-900 leading-tight mb-2.5">
        {module.shortTitle}
      </h3>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {module.games.length} game{module.games.length !== 1 ? "s" : ""}
        </span>
        <span
          className={`text-[9px] font-bold uppercase tracking-[0.5px] rounded-md px-1.5 py-0.5 ${priorityStyle.badge}`}
        >
          {PRIORITY_LABELS[module.priority]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] rounded-full bg-gray-100 mt-2.5 overflow-hidden">
        <div
          className="h-full rounded-full progress-fill"
          style={{
            width: `${completed ? 100 : progress}%`,
            background: completed ? "#00853F" : module.accentColor,
            opacity: completed || progress > 0 ? 1 : 0,
          }}
        />
      </div>

      {/* Completed badge */}
      {completed && (
        <div className="absolute top-2.5 right-2.5">
          <span className="bg-nestle-green-light text-nestle-green text-[9px] font-bold uppercase tracking-wide rounded-md px-1.5 py-0.5">
            ✓ Done
          </span>
        </div>
      )}
    </Link>
  );
}
