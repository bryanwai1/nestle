import NavHeader from "@/components/NavHeader";
import QuizClient from "./QuizClient";

export const metadata = {
  title: "Rapid-Fire Quiz — Module 1 · Nestlé SHE Day",
};

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader
        teamName="Team Alpha"
        teamPoints={480}
        showBack
        backHref="/modules/1"
        backLabel="Module 1"
      />

      {/* Game header strip */}
      <div className="bg-nestle-red px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">
          ⚡
        </div>
        <div>
          <p className="text-white font-bold text-[14px] leading-tight">Rapid-Fire Quiz</p>
          <p className="text-white/70 text-[11px]">Module 1 · Game 1 of 3 · Safe Driving</p>
        </div>
        <div className="ml-auto">
          <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md">
            Priority 1
          </span>
        </div>
      </div>

      <main className="px-4 py-5">
        {/* 
          teamId is hardcoded to "3" (Team Alpha) for now.
          Replace with real session/auth when you add Supabase Auth.
        */}
        <QuizClient teamId="3" />
      </main>
    </div>
  );
}
