"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/lib/useTeam";

const COLORS = ["#E2001A","#2B5BA8","#00853F","#F5A623","#8B5CF6","#EC4899","#0EA5E9","#F97316"];

function initialsOf(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase() || "TM";
}

interface ExistingTeam { id: string; name: string; color: string; initials: string; }

export default function TeamSetup() {
  const { teamId, teamName, members, hasTeam, loading, setActiveTeam, clearActiveTeam } = useTeam();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [member1, setMember1] = useState("");
  const [member2, setMember2] = useState("");
  const [member3, setMember3] = useState("");
  const [existingTeams, setExistingTeams] = useState<ExistingTeam[]>([]);
  const [selectedExisting, setSelectedExisting] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasTeam) return;
    const sb = createClient();
    if (!sb) return;
    sb.from("teams").select("id,name,color,initials").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setExistingTeams(data as ExistingTeam[]);
    });
  }, [hasTeam]);

  async function handleCreate() {
    setError("");
    if (!name.trim() || !member1.trim() || !member2.trim() || !member3.trim()) {
      setError("Enter a team name and all 3 member names.");
      return;
    }
    const sb = createClient();
    if (!sb) { setError("Database not connected yet."); return; }
    setSubmitting(true);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const { data, error: insertError } = await sb.from("teams").insert({
      name: name.trim(), color, initials: initialsOf(name),
      member1: member1.trim(), member2: member2.trim(), member3: member3.trim(),
    }).select().single();
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message.includes("duplicate") ? "That team name is already taken." : "Could not create team. Try again.");
      return;
    }
    setActiveTeam({ teamId: data.id, teamName: data.name, members: [member1.trim(), member2.trim(), member3.trim()] });
  }

  async function handleJoin() {
    setError("");
    if (!selectedExisting) { setError("Select a team to join."); return; }
    const sb = createClient();
    if (!sb) return;
    const { data } = await sb.from("teams").select("id,name,member1,member2,member3").eq("id", selectedExisting).single();
    if (data) {
      setActiveTeam({ teamId: data.id, teamName: data.name, members: [data.member1, data.member2, data.member3].filter(Boolean) });
    }
  }

  if (loading) return null;

  if (hasTeam) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 mb-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Playing as</p>
          <p className="text-[16px] font-bold text-nestle-blue">{teamName}</p>
          <p className="text-[12px] text-gray-500 mt-0.5">{members.join(" Â· ")}</p>
        </div>
        <button onClick={clearActiveTeam} className="text-[12px] font-semibold text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          Switch Team
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border-2 border-nestle-blue/20 shadow-card p-4 mb-2">
      <p className="text-[15px] font-bold text-gray-900 mb-1">Set Up Your Team</p>
      <p className="text-[12px] text-gray-500 mb-3">Every team has exactly 3 members. Create a new team or join one already created by your group.</p>

      <div className="flex gap-2 mb-3">
        <button onClick={() => setMode("create")} className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-colors ${mode==="create"?"bg-nestle-blue text-white":"bg-gray-100 text-gray-500"}`}>Create New Team</button>
        <button onClick={() => setMode("join")} className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-colors ${mode==="join"?"bg-nestle-blue text-white":"bg-gray-100 text-gray-500"}`}>Join Existing Team</button>
      </div>

      {error && <p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}

      {mode === "create" ? (
        <div className="flex flex-col gap-2.5">
          <input className="border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-400" placeholder="Team name (e.g. Team Thunder)" value={name} onChange={e=>setName(e.target.value)} />
          <input className="border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-400" placeholder="Member 1 full name" value={member1} onChange={e=>setMember1(e.target.value)} />
          <input className="border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-400" placeholder="Member 2 full name" value={member2} onChange={e=>setMember2(e.target.value)} />
          <input className="border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-400" placeholder="Member 3 full name" value={member3} onChange={e=>setMember3(e.target.value)} />
          <button className="btn-primary mt-1" onClick={handleCreate} disabled={submitting}>{submitting ? "Creating..." : "Create Team"}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {existingTeams.length === 0 ? (
            <p className="text-[12px] text-gray-400 italic">No teams created yet - create one instead.</p>
          ) : (
            <select className="border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-400" value={selectedExisting} onChange={e=>setSelectedExisting(e.target.value)}>
              <option value="">Select your team...</option>
              {existingTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <button className="btn-primary mt-1" onClick={handleJoin}>Join This Team</button>
        </div>
      )}
    </div>
  );
}
