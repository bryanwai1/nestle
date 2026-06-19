import NavHeader from "@/components/NavHeader";
import ExamEngine from "@/components/ExamEngine";
import { CONFIG, QUESTIONS } from "./exam-data";
export const metadata = { title: "Diagnostic Accuracy - Module 6 - Nestle SHE Day" };
export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/6" backLabel="Module 6" />
      <div className="bg-blue-700 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">DX</div>
        <div><p className="text-white font-bold text-[14px]">Diagnostic Accuracy Exam</p><p className="text-white/70 text-[11px]">Module 6 . Game 2 of 4 . Heart Health</p></div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 2</span></div>
      </div>
      <main className="px-4 py-5"><ExamEngine config={CONFIG} questions={QUESTIONS} /></main>
    </div>
  );
}
