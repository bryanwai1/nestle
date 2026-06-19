// @ts-nocheck
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SCENES, POINTS_PER_HAZARD, SPEED_BONUS, GAME_CARD_THRESHOLD } from "./hazard-data";
import { useTeam } from "@/lib/useTeam";

type Phase = "intro"|"playing"|"review"|"results";
interface SceneResult { sceneId:number; found:string[]; missed:string[]; points:number; timeUsed:number; }
interface Ripple { x:number; y:number; id:number; hit:boolean; }

function OfficeSVG({ found, reveal }: { found:string[]; reveal:boolean }) {
  const show = (id:string) => found.includes(id)||reveal;
  return (
    <svg viewBox="0 0 160 100" style={{width:"100%",aspectRatio:"16/10",display:"block"}}>
      {/* Room */}
      <rect width="160" height="100" fill="#F5F5F5"/>
      <rect width="160" height="12" fill="#CFD8DC"/>
      {/* Floor */}
      <rect y="88" width="160" height="12" fill="#BDBDBD"/>
      {/* Window */}
      <rect x="60" y="2" width="40" height="8" rx="1" fill="#90CAF9" opacity="0.7"/>
      <line x1="80" y1="2" x2="80" y2="10" stroke="#90CAF9" strokeWidth="0.5"/>
      {/* Desks */}
      <rect x="5" y="35" width="30" height="18" rx="1" fill="#A1887F"/>
      <rect x="7" y="33" width="26" height="3" rx="0.5" fill="#8D6E63"/>
      <rect x="8" y="37" width="12" height="8" rx="1" fill="#90CAF9" opacity="0.8"/>
      <rect x="55" y="30" width="35" height="20" rx="1" fill="#A1887F"/>
      <rect x="57" y="28" width="31" height="3" rx="0.5" fill="#8D6E63"/>
      <rect x="60" y="32" width="20" height="13" rx="1" fill="#90CAF9" opacity="0.8"/>
      {/* Filing cabinet */}
      <rect x="10" y="50" width="14" height="22" rx="1" fill="#78909C"/>
      <rect x="11" y="53" width="12" height="6" rx="0.5" fill="#607D8B"/>
      <rect x="15" y="55" width="4" height="1" rx="0.3" fill="#CFD8DC"/>
      {/* OPEN DRAWER hazard */}
      <rect x="24" y="53" width="10" height="5" rx="0.5" fill="#546E7A"/>
      {show("drawer")&&<><circle cx="29" cy="55" r="5" fill="none" stroke="#FF5722" strokeWidth="1.5"/><text x="29" y="55.7" textAnchor="middle" fontSize="4" fill="#FF5722" fontWeight="bold">!</text></>}
      {/* Printer */}
      <rect x="60" y="52" width="18" height="10" rx="1" fill="#616161"/>
      <rect x="62" y="54" width="14" height="5" rx="0.5" fill="#424242"/>
      {/* SPILL near printer */}
      <ellipse cx="72" cy="65" rx="10" ry="4" fill="#90CAF9" opacity="0.5"/>
      <ellipse cx="68" cy="64" rx="4" ry="2" fill="#64B5F6" opacity="0.4"/>
      {show("spill")&&<><circle cx="72" cy="64" r="5.5" fill="none" stroke="#FF5722" strokeWidth="1.5"/><text x="72" y="64.7" textAnchor="middle" fontSize="4" fill="#FF5722" fontWeight="bold">!</text></>}
      {/* CABLE across floor */}
      <path d="M18 88 Q30 78 42 82 Q50 85 55 78" stroke="#212121" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {show("cable")&&<><circle cx="42" cy="82" r="5.5" fill="none" stroke="#FF5722" strokeWidth="1.5"/><text x="42" y="82.7" textAnchor="middle" fontSize="4" fill="#FF5722" fontWeight="bold">!</text></>}
      {/* BOXES blocking aisle */}
      <rect x="118" y="68" width="12" height="10" rx="0.5" fill="#FF8F00"/>
      <rect x="120" y="62" width="10" height="8" rx="0.5" fill="#FFA726"/>
      <rect x="116" y="74" width="14" height="8" rx="0.5" fill="#FFB74D"/>
      <line x1="118" y1="68" x2="130" y2="68" stroke="#E65100" strokeWidth="0.5"/>
      <line x1="116" y1="74" x2="132" y2="74" stroke="#E65100" strokeWidth="0.5"/>
      {show("box")&&<><circle cx="125" cy="72" r="6" fill="none" stroke="#FF5722" strokeWidth="1.5"/><text x="125" y="72.7" textAnchor="middle" fontSize="4" fill="#FF5722" fontWeight="bold">!</text></>}
      {/* Chair */}
      <circle cx="40" cy="50" r="5" fill="#9E9E9E" opacity="0.5"/>
      <rect x="38" y="48" width="4" height="6" fill="#BDBDBD" opacity="0.6"/>
      {/* Plant */}
      <rect x="145" y="78" width="8" height="10" rx="0.5" fill="#795548"/>
      <ellipse cx="149" cy="76" rx="7" ry="8" fill="#388E3C"/>
      <ellipse cx="145" cy="73" rx="4" ry="5" fill="#2E7D32"/>
    </svg>
  );
}

function StoreSVG({ found, reveal }: { found:string[]; reveal:boolean }) {
  const show = (id:string) => found.includes(id)||reveal;
  return (
    <svg viewBox="0 0 160 100" style={{width:"100%",aspectRatio:"16/10",display:"block"}}>
      {/* Store floor */}
      <rect width="160" height="100" fill="#FAFAFA"/>
      {/* Ceiling */}
      <rect width="160" height="10" fill="#E0E0E0"/>
      {/* Ceiling lights */}
      {[20,60,100,140].map(x=><g key={x}><rect x={x-5} y="4" width="10" height="3" rx="1" fill="#FFF9C4"/><rect x={x-3} y="7" width="6" height="1" fill="#F5F5F5"/></g>)}
      {/* Shelving aisles */}
      <rect x="0" y="20" width="12" height="60" fill="#90A4AE"/>
      <rect x="14" y="20" width="12" height="60" fill="#B0BEC5"/>
      {[22,30,38,46,54,62].map(y=><rect key={y} x="14" y={y} width="12" height="5" rx="0.3" fill="#FF8F00" opacity="0.6"/>)}
      <rect x="60" y="20" width="12" height="60" fill="#90A4AE"/>
      <rect x="74" y="20" width="12" height="60" fill="#B0BEC5"/>
      {[22,30,38,46,54,62].map(y=><rect key={y} x="74" y={y} width="12" height="5" rx="0.3" fill="#4CAF50" opacity="0.6"/>)}
      <rect x="120" y="20" width="12" height="60" fill="#90A4AE"/>
      <rect x="134" y="20" width="12" height="60" fill="#B0BEC5"/>
      {/* Floor tiles */}
      {[0,20,40,60,80,100,120,140].map(x=>[20,40,60,80].map(y=><rect key={`${x}-${y}`} x={x} y={y} width="20" height="20" fill="none" stroke="#E0E0E0" strokeWidth="0.3"/>))}
      {/* WET FLOOR no sign */}
      <ellipse cx="55" cy="82" rx="14" ry="5" fill="#4FC3F7" opacity="0.4"/>
      <ellipse cx="52" cy="80" rx="6" ry="3" fill="#29B6F6" opacity="0.3"/>
      {show("wetfloor")&&<><circle cx="55" cy="81" r="6" fill="none" stroke="#FF5722" strokeWidth="1.5"/><text x="55" y="81.7" textAnchor="middle" fontSize="4" fill="#FF5722" fontWeight="bold">!</text></>}
      {/* UNSECURED LADDER */}
      <rect x="20" y="32" width="2" height="28" fill="#9E9E9E"/>
      <rect x="28" y="32" width="2" height="28" fill="#9E9E9E"/>
      {[36,44,52].map(y=><rect key={y} x="22" y={y} width="6" height="1.5" rx="0.5" fill="#757575"/>)}
      <rect x="18" y="58" width="6" height="2" rx="0.5" fill="#9E9E9E" transform="rotate(15 21 59)"/>
      <rect x="26" y="58" width="6" height="2" rx="0.5" fill="#9E9E9E" transform="rotate(-15 32 59)"/>
      {show("ladder")&&<><circle cx="25" cy="48" r="6" fill="none" stroke="#FF5722" strokeWidth="1.5"/><text x="25" y="48.7" textAnchor="middle" fontSize="4" fill="#FF5722" fontWeight="bold">!</text></>}
      {/* PALLET EDGE */}
      <rect x="90" y="55" width="25" height="12" rx="0.5" fill="#A1887F" style={{ opacity: 0.9 }}/>
      <rect x="90" y="53" width="25" height="4" rx="0.5" fill="#8D6E63"/>
      <rect x="100" y="57" width="5" height="10" rx="0.3" fill="#795548"/>
      {show("pallet")&&<><circle cx="103" cy="61" r="6" fill="none" stroke="#FF5722" strokeWidth="1.5"/><text x="103" y="61.7" textAnchor="middle" fontSize="4" fill="#FF5722" fontWeight="bold">!</text></>}
      {/* CURLED MAT at entrance */}
      <rect x="30" y="85" width="30" height="8" rx="1" fill="#795548" opacity="0.8"/>
      <path d="M55 85 Q58 85 60 89 Q60 93 56 93" fill="#5D4037" style={{ opacity: 0.9 }}/>
      {show("mat")&&<><circle cx="48" cy="88" r="6" fill="none" stroke="#FF5722" strokeWidth="1.5"/><text x="48" y="88.7" textAnchor="middle" fontSize="4" fill="#FF5722" fontWeight="bold">!</text></>}
    </svg>
  );
}

export default function HazardClient({ teamId: teamIdProp = "3" }: { teamId?: string }) {
  const { teamId: __activeTeamId } = useTeam();
  const teamId = __activeTeamId || teamIdProp;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sIdx, setSIdx] = useState(0);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<SceneResult[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [saving, setSaving] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const timerRef = useRef<NodeJS.Timeout|null>(null);
  const startRef = useRef(0);
  const ridRef = useRef(0);

  const scene = SCENES[sIdx];
  const totalHazards = SCENES.reduce((s,sc)=>s+sc.hazards.length,0);
  const allResults = results;
  const totalFound = allResults.reduce((s,r)=>s+r.found.length,0);
  const totalPts = allResults.reduce((s,r)=>s+r.points,0);
  const passed = totalFound >= GAME_CARD_THRESHOLD;

  const stopTimer = useCallback(()=>{if(timerRef.current)clearInterval(timerRef.current);},[]);

  function endScene(fids:string[]) {
    stopTimer();
    const timeUsed = Math.round((Date.now()-startRef.current)/1000);
    const missed = scene.hazards.filter(h=>!fids.includes(h.id)).map(h=>h.id);
    const pts = fids.reduce((s,id)=>{
      const elapsed = timeUsed;
      return s + POINTS_PER_HAZARD + Math.round(SPEED_BONUS*Math.max(0,1-elapsed/scene.timeLimit));
    },0);
    setResults(prev=>[...prev,{sceneId:scene.id,found:fids,missed,points:pts,timeUsed}]);
    setTimeout(()=>setPhase("review"),200);
  }

  useEffect(()=>{
    if(phase!=="playing")return;
    setFoundIds([]);setTimeLeft(scene.timeLimit);startRef.current=Date.now();
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){stopTimer();setFoundIds(fids=>{endScene(fids);return fids;});return 0;}
        return t-1;
      });
    },1000);
    return stopTimer;
  },[phase,sIdx]); // eslint-disable-line

  function handleClick(e:React.MouseEvent<SVGSVGElement>) {
    if(phase!=="playing"||!svgRef.current)return;
    const rect=svgRef.current.getBoundingClientRect();
    const px=((e.clientX-rect.left)/rect.width)*160;
    const py=((e.clientY-rect.top)/rect.height)*100;
    const hit=scene.hazards.find(h=>!foundIds.includes(h.id)&&Math.hypot(px-h.x,py-h.y)<h.r+4)||null;
    const pctX=((e.clientX-rect.left)/rect.width)*100;
    const pctY=((e.clientY-rect.top)/rect.height)*100;
    const id=++ridRef.current;
    setRipples(r=>[...r,{x:pctX,y:pctY,id,hit:!!hit}]);
    setTimeout(()=>setRipples(r=>r.filter(rr=>rr.id!==id)),700);
    if(hit){
      setFoundIds(prev=>{
        const next=[...prev,hit.id];
        if(next.length===scene.hazards.length)endScene(next);
        return next;
      });
    }
  }

  function nextScene(){
    if(sIdx+1<SCENES.length){setSIdx(s=>s+1);setPhase("playing");}
    else setPhase("results");
  }

  useEffect(()=>{
    if(phase!=="results")return;
    const save=async()=>{
      const sb=createClient();if(!sb)return;
      setSaving(true);
      try{// @ts-ignore
      await sb.from("scores").upsert({team_id:teamId,module_id:2,game_id:2,points:totalPts,time_seconds:allResults.reduce((s,r)=>s+r.timeUsed,0),game_cards:passed?1:0});}catch(_){}
      setSaving(false);
    };
    save();
  },[phase]); // eslint-disable-line

  if(phase==="intro")return(
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-5xl">🔍</div>
        <h2 className="text-[22px] font-bold text-gray-900">Hazard Image Spotter</h2>
        <p className="text-[13px] text-gray-500">Module 2 · Game 2 of 3</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {[["🏢","2 workplace scenes","Corporate office and grocery outlet"],["👆","Tap the hazards","Find loose cables, spills, blocked paths and more"],["⚡","Speed bonus","Faster finds = more points"],["🃏","Game Card",`Find ${GAME_CARD_THRESHOLD}/${totalHazards} hazards to earn one`]].map(([i,l,s])=>(
          <div key={String(l)} className="flex items-start gap-3 px-4 py-3">
            <span className="text-xl mt-0.5">{i}</span>
            <div><p className="text-[13px] font-semibold text-gray-900">{l}</p><p className="text-[12px] text-gray-400">{s}</p></div>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={()=>setPhase("playing")}>Start Spotting ▶</button>
    </div>
  );

  if(phase==="review"){
    const sr=results[results.length-1];
    return(
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scene {sIdx+1} Results — {scene.title}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{sr.found.length}/{scene.hazards.length} found · {sr.points} pts</p>
          </div>
          <div className="p-3 bg-gray-900 rounded-none">
            <div className="rounded-xl overflow-hidden">
              {sIdx===0?<OfficeSVG found={scene.hazards.map(h=>h.id)} reveal={true}/>:<StoreSVG found={scene.hazards.map(h=>h.id)} reveal={true}/>}
            </div>
          </div>
          <ul className="divide-y divide-gray-100">
            {scene.hazards.map(h=>{
              const found=sr.found.includes(h.id);
              return(
                <li key={h.id} className="px-4 py-3 flex items-start gap-3">
                  <span className={`text-[18px] shrink-0 ${found?"":"grayscale opacity-40"}`}>{found?"✅":"❌"}</span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-900">{h.label}</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{h.explanation}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <button className="btn-primary" onClick={nextScene}>
          {sIdx+1<SCENES.length?`Next Scene (${sIdx+2}/${SCENES.length}) →`:"See Results →"}
        </button>
      </div>
    );
  }

  if(phase==="results")return(
    <div className="flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center ${passed?"bg-green-50":"bg-red-50"}`}>
        <div className="text-5xl mb-3">{passed?"🏆":"🔍"}</div>
        <p className={`text-[13px] font-bold uppercase tracking-wide mb-1 ${passed?"text-green-700":"text-red-600"}`}>{passed?"Safety Expert!":"Keep Practising"}</p>
        <p className="text-[32px] font-black text-gray-900 leading-none mb-1">{totalFound}/{totalHazards}</p>
        <p className="text-[13px] text-gray-500">hazards found · {totalPts} pts</p>
        {passed&&<div className="mt-3 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-[12px] font-bold">🃏 Game Card Earned!</div>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Points",totalPts.toLocaleString(),"text-blue-700"],["Found",`${totalFound}/${totalHazards}`,passed?"text-green-700":"text-red-600"],["Card",passed?"1":"0","text-yellow-600"]].map(([l,v,c])=>(
          <div key={String(l)} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-[20px] font-bold ${c}`}>{v}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      {saving&&<p className="text-center text-[12px] text-gray-400">Saving…</p>}
      <button className="btn-primary" onClick={()=>router.push("/modules/2")}>← Back to Module 2</button>
      
    </div>
  );

  const timerPct=(timeLeft/scene.timeLimit)*100;
  return(
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] text-gray-400">Scene {sIdx+1}/{SCENES.length} · {scene.title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{foundIds.length}/{scene.hazards.length} hazards found</p>
        </div>
        <div className={`text-[22px] font-black ${timeLeft<=8?"text-red-500 animate-pulse":"text-blue-700"}`}>{timeLeft}s</div>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timerPct>50?"bg-green-500":timerPct>25?"bg-yellow-400":"bg-red-500"}`} style={{width:`${timerPct}%`}}/>
      </div>
      <p className="text-[12px] text-gray-500 text-center">{scene.description}</p>
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 cursor-crosshair bg-white">
        {sIdx===0
          ?<svg ref={svgRef} viewBox="0 0 160 100" style={{width:"100%",aspectRatio:"16/10",display:"block"}} onClick={handleClick}><OfficeSVG found={foundIds} reveal={false}/></svg>
          :<svg ref={svgRef} viewBox="0 0 160 100" style={{width:"100%",aspectRatio:"16/10",display:"block"}} onClick={handleClick}><StoreSVG found={foundIds} reveal={false}/></svg>
        }
        {ripples.map(rp=>(
          <div key={rp.id} className="pointer-events-none absolute" style={{left:`${rp.x}%`,top:`${rp.y}%`,transform:"translate(-50%,-50%)"}}>
            <div className={`w-10 h-10 rounded-full border-2 animate-ping ${rp.hit?"border-green-400":"border-red-400"}`} style={{animationDuration:"0.6s",animationIterationCount:"1"}}/>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {scene.hazards.map(h=>(
          <span key={h.id} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${foundIds.includes(h.id)?"bg-green-50 border-green-300 text-green-700":"bg-gray-100 border-gray-200 text-gray-400"}`}>
            {foundIds.includes(h.id)?"✓ ":""}{h.label}
          </span>
        ))}
      </div>
      <p className="text-center text-[11px] text-gray-400">Tap directly on the hazards in the scene</p>
    </div>
  );
}
