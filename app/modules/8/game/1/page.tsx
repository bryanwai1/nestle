import NavHeader from "@/components/NavHeader";
import MediaProofClient, { type ProofConfig } from "@/components/MediaProofClient";

export const metadata = { title: "Safe Lifting Video Proof - Module 8 - Nestle SHE Day" };

const CONFIG: ProofConfig = {
  moduleId: 8, gameId: 1,
  title: "Safe Lifting Video Proof",
  icon: "LIFT",
  mediaType: "video",
  memberCount: 3,
  maxPointsPerMember: 10,
  videoMaxSeconds: 10,
  instructions: [
    "Find a box or equivalent object to demonstrate with.",
    "Each team member takes a turn lifting it using correct technique.",
    "One member operates the camera while the other demonstrates.",
  ],
  techniqueCues: [
    "Feet shoulder-width apart, close to the load",
    "Bend at the knees, not at the back",
    "Keep the back straight throughout the lift",
    "Grip the load firmly with both hands",
    "Drive upward through the legs, not the spine",
    "Avoid twisting the body while carrying the load",
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/8" backLabel="Module 8" />
      <div className="bg-gray-600 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">LIFT</div>
        <div>
          <p className="text-white font-bold text-[14px]">Safe Lifting Video Proof</p>
          <p className="text-white/70 text-[11px]">Module 8 . Game 1 of 3 . Ergonomics & Lifting</p>
        </div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 3</span></div>
      </div>
      <main className="px-4 py-5"><MediaProofClient config={CONFIG} teamId="3" /></main>
    </div>
  );
}
