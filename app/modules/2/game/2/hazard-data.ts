export interface Hazard { id:string; label:string; explanation:string; x:number; y:number; r:number; }
export interface Scene { id:number; title:string; setting:string; description:string; timeLimit:number; hazards:Hazard[]; }

export const SCENES: Scene[] = [
  {
    id:1, title:"Corporate Sales Office", setting:"office", timeLimit:35,
    description:"Inspect this sales office. Tap every STF hazard you can spot.",
    hazards:[
      { id:"cable",   label:"Trailing Cable",      explanation:"A power cable trails across the walkway — a serious trip hazard.", x:42, y:68, r:9 },
      { id:"spill",   label:"Liquid Spill",         explanation:"An unmarked liquid spill near the printer — slip hazard with no wet floor sign.", x:72, y:58, r:8 },
      { id:"drawer",  label:"Open Drawer",          explanation:"A filing cabinet drawer left open at shin height — trip and collision hazard.", x:20, y:55, r:8 },
      { id:"box",     label:"Boxes Blocking Aisle", explanation:"Cardboard boxes stacked in the walkway obstruct safe movement and emergency exit.", x:85, y:72, r:9 },
    ]
  },
  {
    id:2, title:"Outlet Grocery Store", setting:"store", timeLimit:35,
    description:"Inspect this grocery outlet. Find all slip, trip and fall hazards.",
    hazards:[
      { id:"wetfloor", label:"Wet Floor No Sign",   explanation:"A mopped area with no wet floor warning sign — extreme slip risk.", x:55, y:75, r:9 },
      { id:"ladder",   label:"Unsecured Ladder",    explanation:"A stepladder left open and unattended in the middle of the aisle — fall hazard.", x:25, y:50, r:8 },
      { id:"pallet",   label:"Pallet Edge",         explanation:"A pallet partially sticking into the aisle — customers and staff can trip over the edge.", x:78, y:60, r:8 },
      { id:"mat",      label:"Curled Floor Mat",    explanation:"An entrance mat with a curled edge — the most common cause of in-store trips.", x:45, y:85, r:8 },
    ]
  },
];

export const POINTS_PER_HAZARD = 100;
export const SPEED_BONUS = 50;
export const GAME_CARD_THRESHOLD = 6;
