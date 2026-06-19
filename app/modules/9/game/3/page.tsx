import NavHeader from "@/components/NavHeader";
import FitnessSorterClient from "./FitnessSorterClient";
export const metadata = { title: "Fitness Category Sorter - Module 9 - Nestle SHE Day" };
export default function FitnessSorterPage() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/9" backLabel="Module 9"/>
      <div className="bg-gray-600 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">FS</div>
        <div>
          <p className="text-white font-bold text-[14px]">Fitness Category Sorter</p>
          <p className="text-white/70 text-[11px]">Module 9 . Game 3 of 3 . Exercise & Stretching</p>
        </div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 3</span></div>
      </div>
      <main className="px-4 py-5"><FitnessSorterClient teamId="3"/></main>
    </div>
  );
}
