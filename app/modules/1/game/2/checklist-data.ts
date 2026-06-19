export interface CheckItem { id: string; label: string; icon: string; description: string; pass: boolean; failHint: string; }
export interface Scenario { id: number; title: string; context: string; items: CheckItem[]; }

export const SCENARIOS: Scenario[] = [
  {
    id: 1, title: "Morning Inspection — Company Van",
    context: "You are about to drive the company van for a client visit. Perform your pre-drive safety check.",
    items: [
      { id:"brake", label:"Brake Condition", icon:"🛑", description:"You press the brake pedal firmly. It feels spongy and sinks closer to the floor than usual.", pass:false, failHint:"A spongy brake pedal indicates low brake fluid or air in the lines — do not drive." },
      { id:"lighting", label:"Lighting Condition", icon:"💡", description:"You switch on headlights, taillights and indicators. All lights illuminate correctly.", pass:true, failHint:"All lights are functioning normally." },
      { id:"wipers", label:"Wiper Condition", icon:"🌧️", description:"You activate the wipers. They sweep the windscreen cleanly without streaking.", pass:true, failHint:"Wipers are in good condition." },
      { id:"horn", label:"Horn", icon:"📣", description:"You press the horn briefly. It produces a clear, consistent sound.", pass:true, failHint:"Horn is functioning normally." },
      { id:"mirrors", label:"Side Mirrors", icon:"🔲", description:"The left side mirror is cracked and the reflection is distorted.", pass:false, failHint:"A cracked side mirror reduces visibility — report for replacement before driving." },
    ]
  },
  {
    id: 2, title: "Afternoon Check — Sales Vehicle",
    context: "You are picking up the sales vehicle after it was parked all day in the sun. Run through your checklist.",
    items: [
      { id:"brake", label:"Brake Condition", icon:"🛑", description:"The brake pedal feels firm and responsive, returning to full height when released.", pass:true, failHint:"Brakes feel normal and responsive." },
      { id:"lighting", label:"Lighting Condition", icon:"💡", description:"The right rear brake light is not illuminating when you press the brake pedal.", pass:false, failHint:"A faulty brake light is a safety hazard — other drivers cannot see you braking." },
      { id:"wipers", label:"Wiper Condition", icon:"🌧️", description:"The wiper blades are torn and leave large smear marks across the windscreen.", pass:false, failHint:"Torn wiper blades severely reduce visibility in rain — replace before driving." },
      { id:"horn", label:"Horn", icon:"📣", description:"You press the horn. It makes a weak, intermittent sound.", pass:false, failHint:"An intermittent horn may fail when needed most — report for repair." },
      { id:"mirrors", label:"Side Mirrors", icon:"🔲", description:"Both side mirrors are clean, correctly angled and provide a clear wide-angle view.", pass:true, failHint:"Side mirrors are in good condition." },
    ]
  },
  {
    id: 3, title: "Early Morning — Long Journey Check",
    context: "You have a 3-hour drive ahead. Complete a thorough pre-journey vehicle inspection.",
    items: [
      { id:"brake", label:"Brake Condition", icon:"🛑", description:"The brake pedal is firm and the vehicle stops smoothly and straight when tested.", pass:true, failHint:"Brakes are performing correctly." },
      { id:"lighting", label:"Lighting Condition", icon:"💡", description:"All headlights, taillights, indicators and hazard lights function correctly.", pass:true, failHint:"All lighting is in good condition." },
      { id:"wipers", label:"Wiper Condition", icon:"🌧️", description:"Wipers clear the windscreen cleanly. The washer fluid is topped up.", pass:true, failHint:"Wipers and washer fluid are in good condition." },
      { id:"horn", label:"Horn", icon:"📣", description:"The horn produces no sound at all when pressed repeatedly.", pass:false, failHint:"A non-functioning horn means you cannot warn other road users — do not proceed." },
      { id:"mirrors", label:"Side Mirrors", icon:"🔲", description:"The right side mirror has come loose and vibrates excessively at speed.", pass:false, failHint:"A loose mirror provides unreliable visibility — secure or replace before the journey." },
    ]
  },
];

export const POINTS_PER_CORRECT = 80;
export const SPEED_BONUS = 40;
export const GAME_CARD_THRESHOLD = 12;
export const TIME_LIMIT = 18;
