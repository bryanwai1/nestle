export interface FoodItem {
  id: string;
  name: string;
  group: "carb" | "protein" | "veg";
  price: number;
  kcal: number;
  color: string;
}

export const FOODS: FoodItem[] = [
  // Carbs - quarter section, max 2 units
  { id:"rice",     name:"White Rice (1 scoop)",       group:"carb",    price:1.00, kcal:250, color:"#F5A623" },
  { id:"bread",    name:"Wholemeal Bread (2 slices)", group:"carb",    price:1.00, kcal:180, color:"#F5A623" },
  { id:"noodles",  name:"Yellow Noodles (1 serving)", group:"carb",    price:1.50, kcal:280, color:"#F5A623" },
  { id:"potato",   name:"Boiled Potato (1 medium)",   group:"carb",    price:1.00, kcal:160, color:"#F5A623" },
  // Protein - quarter section, max 2 units
  { id:"chicken",  name:"Grilled Chicken Breast",     group:"protein", price:2.50, kcal:200, color:"#E2001A" },
  { id:"fish",     name:"Steamed Fish",               group:"protein", price:3.00, kcal:180, color:"#E2001A" },
  { id:"egg",      name:"Boiled Egg (1)",             group:"protein", price:0.50, kcal:90,  color:"#E2001A" },
  { id:"tofu",     name:"Tofu (1 serving)",           group:"protein", price:1.00, kcal:150, color:"#E2001A" },
  // Fruits & Veg - half section, max 4 units
  { id:"spinach",  name:"Spinach (1 serving)",        group:"veg",     price:1.00, kcal:50,  color:"#00853F" },
  { id:"carrot",   name:"Carrot Sticks",              group:"veg",     price:0.50, kcal:40,  color:"#00853F" },
  { id:"broccoli", name:"Broccoli",                   group:"veg",     price:1.00, kcal:55,  color:"#00853F" },
  { id:"apple",    name:"Apple",                      group:"veg",     price:0.80, kcal:95,  color:"#00853F" },
  { id:"banana",   name:"Banana",                     group:"veg",     price:0.50, kcal:105, color:"#00853F" },
  { id:"orange",   name:"Orange",                     group:"veg",     price:0.70, kcal:65,  color:"#00853F" },
];

export const SECTION_CAPS: Record<"carb"|"protein"|"veg", number> = { carb:2, protein:2, veg:4 };
export const BUDGET_MAX = 12.00;
export const MEAL_KCAL_MIN = 500;
export const MEAL_KCAL_MAX = 750;
export const TOTAL_TIME_SECONDS = 120;

export interface BmrOption { id:string; text:string; isCorrect:boolean; }
export const BMR_QUESTION = {
  question: "Using the standard estimation method taught in this briefing (Daily Calorie Need = Body Weight in kg x 30), what is the estimated daily calorie requirement for a person weighing 60kg?",
  options: [
    { id:"a", text:"1,500 kcal", isCorrect:false },
    { id:"b", text:"1,650 kcal", isCorrect:false },
    { id:"c", text:"1,800 kcal", isCorrect:true },
    { id:"d", text:"1,950 kcal", isCorrect:false },
    { id:"e", text:"2,100 kcal", isCorrect:false },
    { id:"f", text:"2,400 kcal", isCorrect:false },
  ] as BmrOption[],
};
