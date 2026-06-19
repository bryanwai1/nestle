import NavHeader from "@/components/NavHeader";
import FireScenarioClient from "./FireScenarioClient";
export const metadata = { title: "Server Room Fire Scenario — Module 3 · Nestle SHE Day" };
export default function FireScenarioPage() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/3" backLabel="Module 3"/>
      <div className="bg-blue-700 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold text-white">F</div>
        <div>
          <p className="text-white font-bold text-[14px]">Server Room Fire Scenario</p>
          <p className="text-white/70 text-[11px]">Module 3 · Game 2 of 2 · Fire Emergency</p>
        </div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 2</span></div>
      </div>
      <main className="px-4 py-5"><FireScenarioClient teamId="3"/></main>
    </div>
  );
}
