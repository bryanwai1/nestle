export interface Hazard {
  id: string;
  label: string;
  explanation: string;
  x: number; y: number; r: number; // center x, center y, radius (% of canvas)
}
export interface Scene {
  id: number;
  title: string;
  description: string;
  timeLimit: number;
  hazards: Hazard[];
}

export const SCENES: Scene[] = [
  {
    id: 1,
    title: "Highway Driving",
    description: "You are driving on the highway. Tap every hazard you can spot before time runs out.",
    timeLimit: 30,
    hazards: [
      { id:"tailgate", label:"Tailgating", explanation:"The car ahead is dangerously close — violating the 3-second rule.", x:50, y:38, r:10 },
      { id:"phone", label:"Driver on Phone", explanation:"The driver in the left lane is holding a phone — distracted driving.", x:22, y:52, r:9 },
      { id:"debris", label:"Road Debris", explanation:"A large object is on the road ahead — collision risk.", x:63, y:72, r:8 },
      { id:"blindspot", label:"Blind Spot Vehicle", explanation:"A vehicle is sitting in the truck's blind spot — very dangerous.", x:80, y:45, r:9 },
    ]
  },
  {
    id: 2,
    title: "Urban Junction",
    description: "Approaching a busy junction. Identify all hazards before the timer expires.",
    timeLimit: 35,
    hazards: [
      { id:"redlight", label:"Running Red Light", explanation:"The vehicle on the right is crossing on a red light.", x:78, y:48, r:9 },
      { id:"pedestrian", label:"Pedestrian Crossing", explanation:"A pedestrian is stepping onto the road without checking traffic.", x:50, y:68, r:8 },
      { id:"cyclist", label:"Cyclist in Blind Spot", explanation:"A cyclist is filtering up on the left — check before turning.", x:18, y:55, r:8 },
      { id:"wetroad", label:"Wet Road Marking", explanation:"Wet painted road markings are extremely slippery for bikes and braking vehicles.", x:50, y:85, r:10 },
      { id:"parked", label:"Illegally Parked Van", explanation:"The parked van is blocking sightlines — hidden pedestrians may emerge.", x:15, y:38, r:9 },
    ]
  },
  {
    id: 3,
    title: "Rainy Night Road",
    description: "Driving at night in the rain. Multiple hazards present — tap them all.",
    timeLimit: 35,
    hazards: [
      { id:"nolight", label:"No Headlights", explanation:"The oncoming vehicle has no headlights on — invisible until very close.", x:35, y:40, r:9 },
      { id:"aquaplane", label:"Aquaplaning Zone", explanation:"Standing water on the road — risk of losing tyre contact completely.", x:55, y:70, r:10 },
      { id:"fatigue", label:"Fatigue Warning Sign", explanation:"You have been driving 2+ hours — a rest break is overdue.", x:82, y:25, r:8 },
      { id:"foglight", label:"Blinding Fog Lights", explanation:"The vehicle behind has full fog lights on dry road — dangerously blinding.", x:50, y:88, r:9 },
    ]
  },
];

export const POINTS_PER_HAZARD = 120;
export const SPEED_BONUS = 60;
export const GAME_CARD_THRESHOLD = 10;
