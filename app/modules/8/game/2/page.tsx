import NavHeader from "@/components/NavHeader";
import MediaProofClient, { type ProofConfig } from "@/components/MediaProofClient";

export const metadata = { title: "Sitting Posture Photo Proof - Module 8 - Nestle SHE Day" };

const CONFIG: ProofConfig = {
  moduleId: 8, gameId: 2,
  title: "Sitting Posture Photo Proof",
  icon: "SIT",
  mediaType: "photo",
  memberCount: 3,
  maxPointsPerMember: 10,
  instructions: [
    "Sit at your normal workstation as you usually would.",
    "Have a teammate photograph you from the side.",
    "Repeat for each of the 3 team members.",
  ],
  techniqueCues: [
    "Monitor top at or just below eye level",
    "Lower back supported by the chair (lumbar support engaged)",
    "Feet flat on the floor, knees at roughly 90 degrees",
    "Elbows close to the body at roughly 90 degrees",
    "Wrists straight and level while typing",
    "Shoulders relaxed, not raised or hunched",
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader teamName="Team Alpha" teamPoints={480} showBack backHref="/modules/8" backLabel="Module 8" />
      <div className="bg-gray-600 px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">SIT</div>
        <div>
          <p className="text-white font-bold text-[14px]">Sitting Posture Photo Proof</p>
          <p className="text-white/70 text-[11px]">Module 8 . Game 2 of 3 . Ergonomics & Lifting</p>
        </div>
        <div className="ml-auto"><span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">Priority 3</span></div>
      </div>
      <main className="px-4 py-5"><MediaProofClient config={CONFIG} teamId="3" /></main>
    </div>
  );
}
