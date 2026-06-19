// ─────────────────────────────────────────────────────────────
// Nestlé SHE Day — Module & Game Definitions
// Single source of truth — imported everywhere
// ─────────────────────────────────────────────────────────────

export type Priority = 1 | 2 | 3;

export interface GameMechanism {
  id: number;
  icon: string;
  title: string;
  description: string;
  route: string; // e.g. "/modules/1/game/1"
}

export interface Module {
  id: number;
  icon: string;
  title: string;
  shortTitle: string;
  priority: Priority;
  accentColor: string;
  bgColor: string;
  description: string;
  games: GameMechanism[];
}

export const MODULES: Module[] = [
  {
    id: 1,
    icon: "🚗",
    title: "Safe Driving",
    shortTitle: "Safe Driving",
    priority: 1,
    accentColor: "#E2001A",
    bgColor: "#FDEAEA",
    description:
      "Master defensive driving techniques, the 3-second rule, fatigue management and real-time hazard recognition.",
    games: [
      {
        id: 1,
        icon: "⚡",
        title: "Rapid-Fire Quiz",
        description: "10–15 timed questions on road safety rules, horn usage and rest routines",
        route: "/modules/1/game/1",
      },
      {
        id: 2,
        icon: "🔧",
        title: "Car Checklist Validator",
        description: "Verify brake, lighting, wipers, horn and side mirror conditions",
        route: "/modules/1/game/2",
      },
      {
        id: 3,
        icon: "🎯",
        title: "Hazard Spotter",
        description: "Tap real-time road hazards on a driving simulation canvas",
        route: "/modules/1/game/3",
      },
      {
        id: 4,
        icon: "⏱️",
        title: "Reaction Brake Test",
        description: "Stop the car in time when a pedestrian suddenly crosses",
        route: "/modules/1/game/4",
      },
    ],
  },
  {
    id: 2,
    icon: "⚠️",
    title: "Slips, Trips & Falls",
    shortTitle: "STF & Unsafe Conditions",
    priority: 1,
    accentColor: "#E2001A",
    bgColor: "#FDEAEA",
    description:
      "Identify office and outlet hazards, photograph real STF risks around the venue, and master ladder safety procedures.",
    games: [
      {
        id: 1,
        icon: "📸",
        title: "Snap & Upload",
        description: "Photograph real STF hazards around the venue and submit with explanation",
        route: "/modules/2/game/1",
      },
      {
        id: 2,
        icon: "🔍",
        title: "Hazard Image Spotter",
        description: "Tap loose cables, liquid spills and blocked pathways in office & outlet scenes",
        route: "/modules/2/game/2",
      },
      {
        id: 3,
        icon: "🪜",
        title: "Ladder Safety Sequencer",
        description: "Drag-and-drop 4 portable ladder safety steps into the correct order",
        route: "/modules/2/game/3",
      },
    ],
  },
  {
    id: 3,
    icon: "🔥",
    title: "Fire Emergency Response",
    shortTitle: "Fire Emergency",
    priority: 2,
    accentColor: "#2B5BA8",
    bgColor: "#EBF0FA",
    description:
      "Execute the PASS extinguisher technique, manage electrical fire scenarios and lead safe evacuation procedures.",
    games: [
      {
        id: 1,
        icon: "🧯",
        title: "PASS Technique Exam",
        description: "Type the exact Pull-Aim-Squeeze-Sweep sequence - 100% accuracy required",
        route: "/modules/3/game/1",
      },
      {
        id: 2,
        icon: "🖥️",
        title: "Server Room Fire Scenario",
        description: "Manage a 5-step chronological electrical fire response",
        route: "/modules/3/game/2",
      },
    ],
  },
  {
    id: 4,
    icon: "♻️",
    title: "Plastic Recycling",
    shortTitle: "Plastic Recycling",
    priority: 2,
    accentColor: "#2B5BA8",
    bgColor: "#EBF0FA",
    description:
      "Match the 7 resin codes, photograph plastic items around the venue, and sort recyclables at speed.",
    games: [
      {
        id: 1,
        icon: "🔢",
        title: "7 Resin Codes Puzzle",
        description: "Match all 7 plastic types to their classification numbers",
        route: "/modules/4/game/1",
      },
      {
        id: 2,
        icon: "📷",
        title: "Plastic Scavenger Hunt",
        description: "Photograph 5 distinct plastic categories around the venue",
        route: "/modules/4/game/2",
      },
      {
        id: 3,
        icon: "⚡",
        title: "Waste Speed Sorter",
        description: "Classify items by resin code: PET/HDPE/LDPE/PP recyclable, PVC/PS/Other not",
        route: "/modules/4/game/3",
      },
    ],
  },
  {
    id: 5,
    icon: "🍱",
    title: "Balanced Diet",
    shortTitle: "Balanced Diet",
    priority: 2,
    accentColor: "#2B5BA8",
    bgColor: "#EBF0FA",
    description:
      "Build the Suku Suku Separuh plate within a RM12 budget and calorie target, then commit to a team goal.",
    games: [
      {
        id: 1,
        icon: "🍽️",
        title: "Suku Suku Separuh Challenge",
        description: "Calculate calories, then build a balanced plate within a RM12 budget",
        route: "/modules/5/game/1",
      },
      {
        id: 2,
        icon: "📊",
        title: "Weight Loss Tracker",
        description: "Log team behavioural commitments",
        route: "/modules/5/game/2",
      },
    ],
  },
  {
    id: 6,
    icon: "❤️",
    title: "Heart Health",
    shortTitle: "Heart Health",
    priority: 2,
    accentColor: "#2B5BA8",
    bgColor: "#EBF0FA",
    description:
      "Diagnose heart attack warning signs, compare diagnostic accuracy, calculate safe heart rate zones, and distinguish heart attack from cardiac arrest.",
    games: [
      {
        id: 1,
        icon: "🩺",
        title: "Heart Attack Assessment Exam",
        description: "12-question exam on symptoms and emergency first-aid practices",
        route: "/modules/6/game/1",
      },
      {
        id: 2,
        icon: "📈",
        title: "Diagnostic Accuracy Exam",
        description: "Stress Test (70%) vs CT Scan (90%) vs Angiogram (99%)",
        route: "/modules/6/game/2",
      },
      {
        id: 3,
        icon: "💓",
        title: "Max Heart Rate Calculation",
        description: "Calculate MHR yourself: MHR = 220 minus Age",
        route: "/modules/6/game/3",
      },
      {
        id: 4,
        icon: "⚡",
        title: "Heart Attack vs Cardiac Arrest",
        description: "Sort 12 characteristics into the correct condition - watch for traps",
        route: "/modules/6/game/4",
      },
    ],
  },
  {
    id: 7,
    icon: "🧠",
    title: "Stress & Mental Health",
    shortTitle: "Mental Health",
    priority: 2,
    accentColor: "#2B5BA8",
    bgColor: "#EBF0FA",
    description:
      "Complete the 10Q mental well-being assessment, evaluate workplace stress impact, and log team coping strategies.",
    games: [
      {
        id: 1,
        icon: "📝",
        title: "10Q Mental Assessment",
        description: "10-question diagnostic with instant personalised feedback profile",
        route: "/modules/7/game/1",
      },
      {
        id: 2,
        icon: "💼",
        title: "Workplace Stress Quiz",
        description: "Evaluate how chronic stress affects focus, errors and safety compliance",
        route: "/modules/7/game/2",
      },
      {
        id: 3,
        icon: "💬",
        title: "Reflection Console",
        description: "Submit team ideas for stress symptoms, resilience and coping blueprints",
        route: "/modules/7/game/3",
      },
    ],
  },
  {
    id: 8,
    icon: "🪑",
    title: "Ergonomics & Lifting",
    shortTitle: "Ergonomics",
    priority: 3,
    accentColor: "#4A5568",
    bgColor: "#EBEEF4",
    description:
      "View safe box lifting technique, validate your sitting posture setup and select correct ergonomic configurations.",
    games: [
      {
        id: 1,
        icon: "📦",
        title: "Safe Lifting Video",
        description: "Watch and confirm correct lower-body box lifting technique",
        route: "/modules/8/game/1",
      },
      {
        id: 2,
        icon: "🖥️",
        title: "Sitting Posture Checklist",
        description: "Validate correct typing angles and lumbar support settings",
        route: "/modules/8/game/2",
      },
      {
        id: 3,
        icon: "✅",
        title: "Tick the Right Setup",
        description: "Select correct ergonomic frames and filter out incorrect ones",
        route: "/modules/8/game/3",
      },
    ],
  },
  {
    id: 9,
    icon: "🏃",
    title: "Exercise & Stretching",
    shortTitle: "Exercise",
    priority: 3,
    accentColor: "#4A5568",
    bgColor: "#EBEEF4",
    description:
      "Follow squat and push-up technique guides, then drag routines into the correct fitness category.",
    games: [
      {
        id: 1,
        icon: "🦵",
        title: "Squat Video Proof",
        description: "Every member records a short video demonstrating a correct squat",
        route: "/modules/9/game/1",
      },
      {
        id: 2,
        icon: "💪",
        title: "Push-Up Photo Proof",
        description: "Every member photographs correct top-position push-up form",
        route: "/modules/9/game/2",
      },
      {
        id: 3,
        icon: "🗂️",
        title: "Fitness Category Sorter",
        description: "Sort routines into Fat Burning, Muscle Building or Stretching",
        route: "/modules/9/game/3",
      },
    ],
  },
  {
    id: 10,
    icon: "🚨",
    title: "CPR & Medical Emergency",
    shortTitle: "CPR & Emergency",
    priority: 3,
    accentColor: "#4A5568",
    bgColor: "#EBEEF4",
    description:
      "Sequence DRBAC life-support checks, document rescue actions and identify the correct recovery position.",
    games: [
      {
        id: 1,
        icon: "⏱️",
        title: "CPR Sequence Exam",
        description: "Build the correct 6-step CPR sequence from 8 cards - 2 are decoys",
        route: "/modules/10/game/1",
      },
      {
        id: 2,
        icon: "🎥",
        title: "Medical Response Drill",
        description: "Team video drill following the C-A-L-M response framework",
        route: "/modules/10/game/2",
      },
      {
        id: 3,
        icon: "📸",
        title: "Rescue Action Snapshot",
        description: "Camera-log each step of a local rescue action",
        route: "/modules/10/game/3",
      },
      {
        id: 4,
        icon: "🛌",
        title: "Recovery Position Blueprint",
        description: "Identify correct unconscious casualty positioning",
        route: "/modules/10/game/4",
      },
    ],
  },
];

// ── Priority helpers ─────────────────────────────────────────
export const PRIORITY_LABELS: Record<Priority, string> = {
  1: "Priority 1",
  2: "Priority 2",
  3: "Priority 3",
};

export const PRIORITY_STYLES: Record<Priority, { badge: string; text: string }> = {
  1: { badge: "bg-nestle-red-light text-nestle-red", text: "text-nestle-red" },
  2: { badge: "bg-nestle-blue-light text-nestle-blue", text: "text-nestle-blue" },
  3: { badge: "bg-gray-100 text-gray-600", text: "text-gray-500" },
};
