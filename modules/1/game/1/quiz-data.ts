// ─────────────────────────────────────────────────────────────
// Module 1 · Game 1 — Rapid-Fire Driving Quiz Data
// ─────────────────────────────────────────────────────────────

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  explanation: string; // shown after answering
  timeLimit: number;   // seconds
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "On a long journey, how often should you stop and rest?",
    options: [
      { id: "a", text: "Every 4 hours", isCorrect: false },
      { id: "b", text: "Every 2 hours for at least 15 minutes", isCorrect: true },
      { id: "c", text: "Only when you feel very tired", isCorrect: false },
      { id: "d", text: "Every 3 hours for 5 minutes", isCorrect: false },
    ],
    explanation: "Take a break of at least 15 minutes after every 2 hours of driving to prevent fatigue buildup.",
    timeLimit: 20,
  },
  {
    id: 2,
    question: "What is the BEST action if you feel fatigued while driving?",
    options: [
      { id: "a", text: "Open the windows for fresh air", isCorrect: false },
      { id: "b", text: "Turn up the music volume", isCorrect: false },
      { id: "c", text: "Stop and rest immediately", isCorrect: true },
      { id: "d", text: "Drink coffee and continue", isCorrect: false },
    ],
    explanation: "The only safe option is to stop and rest immediately. Opening windows or music only mask fatigue temporarily.",
    timeLimit: 20,
  },
  {
    id: 3,
    question: "What does the '3-second rule' help you maintain while driving?",
    options: [
      { id: "a", text: "Speed limit compliance", isCorrect: false },
      { id: "b", text: "Safe following distance from the vehicle ahead", isCorrect: true },
      { id: "c", text: "Lane change timing", isCorrect: false },
      { id: "d", text: "Fuel consumption rate", isCorrect: false },
    ],
    explanation: "Count 1001, 1002, 1003 using a fixed road object. A 3-second gap gives sufficient reaction time and prevents rear-end collisions.",
    timeLimit: 20,
  },
  {
    id: 4,
    question: "When counting the 3-second rule, which fixed object do you use as reference?",
    options: [
      { id: "a", text: "The vehicle in front of you", isCorrect: false },
      { id: "b", text: "A moving vehicle in the opposite lane", isCorrect: false },
      { id: "c", text: "A stationary object on the road (sign, tree, marking)", isCorrect: true },
      { id: "d", text: "Your own vehicle's hood", isCorrect: false },
    ],
    explanation: "You count from when the vehicle ahead passes a fixed stationary object until your vehicle reaches the same object.",
    timeLimit: 20,
  },
  {
    id: 5,
    question: "Which of these is a VALID reason to use your horn?",
    options: [
      { id: "a", text: "To express anger at another driver", isCorrect: false },
      { id: "b", text: "To warn pedestrians or cyclists of your presence", isCorrect: true },
      { id: "c", text: "To greet a friend on the road", isCorrect: false },
      { id: "d", text: "To tell a slow driver to speed up", isCorrect: false },
    ],
    explanation: "Valid horn uses: warn of danger, alert pedestrians/cyclists, signal in blind spots or poor visibility, and when overtaking.",
    timeLimit: 15,
  },
  {
    id: 6,
    question: "The 3-second rule provides which of these safety benefits? (Choose the MOST complete answer)",
    options: [
      { id: "a", text: "Sufficient reaction time only", isCorrect: false },
      { id: "b", text: "Prevents tailgating only", isCorrect: false },
      { id: "c", text: "Reaction time, prevents tailgating, enables controlled braking and better hazard visibility", isCorrect: true },
      { id: "d", text: "Better fuel efficiency", isCorrect: false },
    ],
    explanation: "The 3-second gap delivers: sufficient reaction time, no rear-end tailgating, controlled braking distance, and improved forward hazard visibility.",
    timeLimit: 25,
  },
  {
    id: 7,
    question: "Which car maintenance item is checked FIRST on a pre-drive inspection?",
    options: [
      { id: "a", text: "Fuel level", isCorrect: false },
      { id: "b", text: "Brake condition", isCorrect: true },
      { id: "c", text: "Air freshener", isCorrect: false },
      { id: "d", text: "Seat adjustment", isCorrect: false },
    ],
    explanation: "Brakes are a primary safety system. Verify brake condition before any other check on the pre-drive maintenance checklist.",
    timeLimit: 15,
  },
  {
    id: 8,
    question: "Which is NOT a valid use of your vehicle's horn?",
    options: [
      { id: "a", text: "Alerting a cyclist you're overtaking", isCorrect: false },
      { id: "b", text: "Warning of danger at a blind bend", isCorrect: false },
      { id: "c", text: "Expressing frustration at traffic", isCorrect: true },
      { id: "d", text: "Signalling your presence in poor visibility", isCorrect: false },
    ],
    explanation: "Using the horn to express rage or anger is never acceptable and can escalate road situations dangerously.",
    timeLimit: 15,
  },
  {
    id: 9,
    question: "If you feel sleepy on the highway, which is a TEMPORARY measure only?",
    options: [
      { id: "a", text: "Stop and take a short nap at R&R", isCorrect: false },
      { id: "b", text: "Open windows and stretch at R&R", isCorrect: true },
      { id: "c", text: "Stop and rest immediately", isCorrect: false },
      { id: "d", text: "Call someone to pick you up", isCorrect: false },
    ],
    explanation: "Opening windows and stretching buys short-term alertness only. The only safe long-term solution is stopping to rest or sleep.",
    timeLimit: 20,
  },
  {
    id: 10,
    question: "Which car maintenance item from the checklist relates to signalling and visibility at night?",
    options: [
      { id: "a", text: "Horn condition", isCorrect: false },
      { id: "b", text: "Wiper condition", isCorrect: false },
      { id: "c", text: "Lighting condition", isCorrect: true },
      { id: "d", text: "Brake condition", isCorrect: false },
    ],
    explanation: "Lighting condition covers headlights, taillights, brake lights and indicators — critical for night driving and signalling.",
    timeLimit: 15,
  },
  {
    id: 11,
    question: "A 3-second gap is particularly important because it gives you controlled braking. Why?",
    options: [
      { id: "a", text: "You have time to increase speed before braking", isCorrect: false },
      { id: "b", text: "Emergency braking rarely fails at high speed", isCorrect: false },
      { id: "c", text: "Gradual braking is safer than sudden braking and prevents skidding", isCorrect: true },
      { id: "d", text: "Modern ABS systems make distance irrelevant", isCorrect: false },
    ],
    explanation: "Adequate following distance allows controlled, gradual braking rather than emergency stops which risk skidding and loss of control.",
    timeLimit: 20,
  },
  {
    id: 12,
    question: "Which 5 items are on the mandatory Car Maintenance Checklist before a journey?",
    options: [
      { id: "a", text: "Fuel, oil, water, tyres, engine", isCorrect: false },
      { id: "b", text: "Brake, lighting, wipers, horn, side mirrors", isCorrect: true },
      { id: "c", text: "Seat, mirror, belt, music, air-con", isCorrect: false },
      { id: "d", text: "GPS, charging cable, tyres, fuel, water", isCorrect: false },
    ],
    explanation: "The SHE Day checklist covers: Brake condition, Lighting condition, Wipers, Horn, and Side mirrors — all primary safety systems.",
    timeLimit: 25,
  },
];

// ── Scoring config ───────────────────────────────────────────
export const POINTS_CORRECT_BASE   = 100;   // base pts per correct answer
export const POINTS_SPEED_BONUS    = 50;    // max bonus for fast answers
export const GAME_CARD_THRESHOLD   = 10;    // correct answers needed for a Game Card
export const PASSING_SCORE_PCT     = 70;    // % to pass the quiz
