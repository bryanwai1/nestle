"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const ROUTINES = [
  { id:1,  label:"High-Intensity Interval Sprints",  category:"fatburn" },
  { id:2,  label:"Heavy Barbell Squats (low reps)",   category:"muscle"  },
  { id:3,  label:"Hamstring Stretch (held 30s)",      category:"stretch" },
  { id:4,  label:"30-Minute Jogging",                 category:"fatburn" },
  { id:5,  label:"Bench Press (heavy weight)",        category:"muscle"  },
  { id:6,  label:"Shoulder Rolls and Arm Circles",    category:"stretch" },
  { id:7,  label:"Jump Rope Circuit",                 category:"fatburn" },
  { id:8,  label:"Deadlifts (low reps, heavy load)",  category:"muscle"  },
  { id:9,  label:"Quad Stretch (standing, held)",     category:"stretch" },
  { id:10, label:"Cycling (steady moderate pace)",    category:"fatburn" },
  { id:11, label:"Pull-Ups to Failure",               category:"muscle"  },
  { id:12, label:"Cat-Cow Spinal Stretch",             category:"stretch" },
  { id:13, label:"Stair Climbing Circuit",             category:"fatburn" },
  { id:14, label:"Dumbbell Bicep Curls (heavy)",       category:"muscle"  },
  { id:15, label:"Seated Forward Fold",                category:"stretch" },
];

function shuffle<T>(arr:T[]):T[] {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

export default function FitnessSorterClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  
  const [phase, setPhase] = useState<"intro"|"playing"|"results">("intro");
  const [pool, setPool] = useState<number[]>([]);
  const [assignment, setAssignment] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number|null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  function start() {
    const order = shuffle(ROUTINES.map(r=>r.id));
    setPool(order);
    const initial: Record<number,string> = {};
    order.forEach(id => initial[id] = "unassigned");
    setAssignment(initial);
    setTimeLeft(120);
    setPhase("playing");
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if(t<=1) { submit(); return 0; } return t-1; });
    }, 1000);
  }

  function submit() {
    if(timerRef.current) clearInterval(timerRef.current);
    setPhase("results");
  }

  function placeInZone(zone: string) {
    if(!selected) return;
    setAssignment(prev => ({ ...prev, [selected]: zone }));
    setSelected(null);
  }

  const correctCount = ROUTINES.filter(r => assignment[r.id] === r.category).length;
  const totalPts = correctCount * 50;
  const passed = correctCount >= 12;

  if (phase === "intro") return (
    <div className="flex flex-col gap-5 text-center">
      <h2 className="text-2xl font-bold mt-8">Fitness Sorter</h2>
      <p className="text-gray-500">Tap a workout, then tap the box it belongs to.</p>
      <button className="btn-primary mt-4" onClick={start}>Start Sorting</button>
    </div>
  );

  if (phase === "results") return (
    <div className="flex flex-col gap-4 text-center mt-8">
      <h2 className="text-3xl font-black">{correctCount}/15 Correct</h2>
      <p className="text-gray-500">{totalPts} Points Earned</p>
      <button className="btn-primary mt-4" onClick={()=>router.push("/modules/9")}>Back to Module 9</button>
    </div>
  );

  const remaining = pool.filter(id => assignment[id] === "unassigned");
  
  return (
    <div className="flex flex-col gap-3">
      <div className="text-right font-bold text-red-500">{timeLeft}s remaining</div>
      
      {/* THE 3 TARGET BOXES */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button onClick={()=>placeInZone("fatburn")} disabled={!selected} className="p-3 bg-orange-50 border-2 border-orange-300 rounded-xl">
          <p className="text-[10px] font-bold text-orange-700">FAT BURN</p>
          <p className="text-[14px] font-black">{pool.filter(id=>assignment[id]==="fatburn").length}</p>
        </button>
        <button onClick={()=>placeInZone("muscle")} disabled={!selected} className="p-3 bg-red-50 border-2 border-red-300 rounded-xl">
          <p className="text-[10px] font-bold text-red-700">MUSCLE</p>
          <p className="text-[14px] font-black">{pool.filter(id=>assignment[id]==="muscle").length}</p>
        </button>
        <button onClick={()=>placeInZone("stretch")} disabled={!selected} className="p-3 bg-green-50 border-2 border-green-300 rounded-xl">
          <p className="text-[10px] font-bold text-green-700">STRETCH</p>
          <p className="text-[14px] font-black">{pool.filter(id=>assignment[id]==="stretch").length}</p>
        </button>
      </div>

      {selected && (
        <div className="bg-blue-50 border-2 border-blue-400 p-3 rounded-xl text-center font-bold text-blue-900 mb-2">
          Selected: {ROUTINES.find(r=>r.id===selected)?.label}
        </div>
      )}

      {/* UNSORTED POOL */}
      <div className="flex flex-col gap-2">
        {remaining.map(id => {
          const r = ROUTINES.find(x=>x.id===id)!;
          return (
            <button key={id} onClick={()=>setSelected(selected===id?null:id)}
              className={`p-3 rounded-xl border-2 text-left text-sm ${selected===id ? "border-blue-500 bg-blue-100" : "border-gray-200 bg-white"}`}>
              {r.label}
            </button>
          );
        })}
      </div>
      
      {remaining.length === 0 && <button className="btn-primary mt-4" onClick={submit}>Submit Answers</button>}
    </div>
  );
}
