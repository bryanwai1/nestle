import NavHeader from "@/components/NavHeader";
import ReactionClient from "./ReactionClient";
export const metadata = { title: "Reaction Brake Test - Module 1 - Nestle SHE Day" };
export default function ReactionPage() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/1" backLabel="Module 1" />
      <div className="bg-red-600 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">RX</div>
        <div>
          <p className="text-white font-bold text-[14px]">Reaction Brake Test</p>
          <p className="text-white/70 text-[11px]">Module 1 . Game 4 of 4 . Safe Driving</p>
        </div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 1</span></div>
      </div>
      <main className="px-4 py-5"><ReactionClient teamId="3" /></main>
    </div>
  );
}
