import NavHeader from "@/components/NavHeader";
import SetupSelectorClient from "./SetupSelectorClient";
export const metadata = { title: "Tick the Right Setup - Module 8 - Nestle SHE Day" };
export default function SetupSelectorPage() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/8" backLabel="Module 8"/>
      <div className="bg-gray-600 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">SET</div>
        <div>
          <p className="text-white font-bold text-[14px]">Tick the Right Setup</p>
          <p className="text-white/70 text-[11px]">Module 8 . Game 3 of 3 . Ergonomics & Lifting</p>
        </div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 3</span></div>
      </div>
      <main className="px-4 py-5"><SetupSelectorClient teamId="3"/></main>
    </div>
  );
}
