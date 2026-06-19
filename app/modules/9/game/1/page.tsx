import NavHeader from "@/components/NavHeader";
import MediaProofClient, { type ProofConfig } from "@/components/MediaProofClient";

export const metadata = { title: "Squat Video Proof - Module 9 - Nestle SHE Day" };

const CONFIG: ProofConfig = {
  moduleId: 9, gameId: 1,
  title: "Squat Video Proof",
  icon: "SQ",
  mediaType: "video",
  memberCount: 3,
  maxPointsPerMember: 10,
  videoMaxSeconds: 10,
  instructions: [
    "Clear a small space to perform a squat.",
    "Each member demonstrates 2-3 controlled squat repetitions.",
    "One member films while the other performs.",
  ],
  techniqueCues: [
    "Feet shoulder-width apart, toes slightly outward",
    "Core braced throughout the movement",
    "Hips pushed back as if sitting into a chair",
    "Thighs reach roughly parallel to the floor",
    "Knees track over the toes, not collapsing inward",
    "Drive up through the heels to stand",
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/9" backLabel="Module 9" />
      <div className="bg-gray-600 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">SQ</div>
        <div>
          <p className="text-white font-bold text-[14px]">Squat Video Proof</p>
          <p className="text-white/70 text-[11px]">Module 9 . Game 1 of 3 . Exercise & Stretching</p>
        </div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 3</span></div>
      </div>
      <main className="px-4 py-5"><MediaProofClient config={CONFIG} teamId="3" /></main>
    </div>
  );
}
