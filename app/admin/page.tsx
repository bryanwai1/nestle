"use client";
import { useState, useEffect } from "react";

// FAKE DATA
const MOCK_TEAMS = [
  { id: "1", name: "Team Alpha", score: 4850, completed: 12, trend: "+120" },
  { id: "2", name: "Team Bravo", score: 4200, completed: 10, trend: "+80" },
  { id: "3", name: "Team Charlie", score: 3900, completed: 9, trend: "+45" },
  { id: "4", name: "Team Delta", score: 3100, completed: 7, trend: "+10" },
];

const MOCK_ACTIVITY = [
  { time: "Just now", action: "Team Alpha completed Hazard Spotter (Module 2)" },
  { time: "2 mins ago", action: "Team Bravo earned a Game Card in Safe Driving!" },
  { time: "5 mins ago", action: "Team Charlie started Suku Suku Separuh" },
  { time: "12 mins ago", action: "Team Alpha completed Reaction Brake Test" },
  { time: "18 mins ago", action: "Team Delta scored 100% on the Knowledge Exam" },
];

export default function AdminDashboard() {
  // Simulate live updates for the presentation
  const [teams, setTeams] = useState(MOCK_TEAMS);

  useEffect(() => {
    const interval = setInterval(() => {
      setTeams(prev => {
        const updated = [...prev].map(t => ({
          ...t,
          score: t.score + Math.floor(Math.random() * 15) // Randomly tick scores up
        }));
        return updated.sort((a, b) => b.score - a.score);
      });
    }, 2500); // Updates every 2.5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Live Command Center</h1>
            <p className="text-gray-500 mt-1">Nestlé SHE Day 2026 - Admin Overview</p>
          </div>
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-[13px] flex items-center gap-2 animate-pulse shadow-sm">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
            SYSTEM LIVE
          </div>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Participants", val: "128" },
            { label: "Modules Completed", val: "48" },
            { label: "Avg Team Score", val: "4012" },
            { label: "Active Sessions", val: "4" }
          ].map(s => (
            <div key={s.label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-3xl font-black text-blue-900 mt-2">{s.val}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Leaderboard */}
          <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-700">Live Team Leaderboard</h2>
            </div>
            <div className="p-0">
              {teams.map((t, i) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i===0 ? 'bg-yellow-100 text-yellow-700' : i===1 ? 'bg-gray-200 text-gray-700' : i===2 ? 'bg-orange-100 text-orange-800' : 'bg-blue-50 text-blue-700'}`}>
                      {i+1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t.name}</p>
                      <p className="text-[12px] text-gray-400">{t.completed} modules completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-blue-700 transition-all">{t.score.toLocaleString()} pts</p>
                    <p className="text-[11px] font-bold text-green-500">{t.trend} in last hour</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-700">Recent Activity</h2>
            </div>
            <div className="p-5 space-y-5">
              {MOCK_ACTIVITY.map((act, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-400 shrink-0"></div>
                  <div>
                    <p className="text-[13px] text-gray-800 leading-snug">{act.action}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
