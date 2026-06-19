import NavHeader from "@/components/NavHeader";
import ScavengerClient from "./ScavengerClient";
export const metadata = { title: "Plastic Scavenger Hunt — Module 4 · Nestle SHE Day" };
export default function ScavengerPage() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/4" backLabel="Module 4"/>
      <div className="bg-blue-700 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">S</div>
        <div>
          <p className="text-white font-bold text-[14px]">Plastic Scavenger Hunt</p>
          <p className="text-white/70 text-[11px]">Module 4 · Game 2 of 3 · Plastic Recycling</p>
        </div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 2</span></div>
      </div>
      <main className="px-4 py-5"><ScavengerClient teamId="3"/></main>
    </div>
  );
}
