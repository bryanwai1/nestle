import NavHeader from "@/components/NavHeader";
import MediaProofClient, { type ProofConfig } from "@/components/MediaProofClient";

export const metadata = { title: "Push-Up Photo Proof - Module 9 - Nestle SHE Day" };

const CONFIG: ProofConfig = {
  moduleId: 9, gameId: 2,
  title: "Push-Up Photo Proof",
  icon: "PU",
  mediaType: "photo",
  memberCount: 3,
  maxPointsPerMember: 10,
  instructions: [
    "Each member gets into the top push-up position.",
    "Photograph from the side to show full body alignment.",
    "Repeat for each of the 3 team members.",
  ],
  techniqueCues: [
    "Hands directly under the shoulders",
    "Body forms a straight line from head to heel",
    "Hips neither sagging down nor piked up",
    "Neck in a neutral position, gaze slightly ahead",
    "Elbows close to the body at roughly 45 degrees",
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/9" backLabel="Module 9" />
      <div className="bg-gray-600 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">PU</div>
        <div>
          <p className="text-white font-bold text-[14px]">Push-Up Photo Proof</p>
          <p className="text-white/70 text-[11px]">Module 9 . Game 2 of 3 . Exercise & Stretching</p>
        </div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 3</span></div>
      </div>
      <main className="px-4 py-5"><MediaProofClient config={CONFIG} teamId="3" /></main>
    </div>
  );
}
