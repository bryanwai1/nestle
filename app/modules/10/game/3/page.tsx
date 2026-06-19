import NavHeader from "@/components/NavHeader";
import RescueSnapshotClient from "./RescueSnapshotClient";
export const metadata = { title: "Rescue Action Snapshot - Module 10 - Nestle SHE Day" };
export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/10" backLabel="Module 10" />
      <div className="bg-red-700 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">SS</div>
        <div>
          <p className="text-white font-bold text-[14px]">Rescue Action Snapshot</p>
          <p className="text-white/70 text-[11px]">Module 10 . Game 3 of 4 . CPR & Medical Emergency</p>
        </div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 3</span></div>
      </div>
      <main className="px-4 py-5"><RescueSnapshotClient teamId="3" /></main>
    </div>
  );
}
