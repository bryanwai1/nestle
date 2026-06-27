// app/leaderboard/page.tsx
//
// Standalone projector screen for the live leaderboard (hearts theme).
// Pulls live scores for ALL teams via useRealtimeLeaderboard() and renders
// the full-screen HeartsLeaderboard. Open in a new tab from the admin
// dashboard and cast it to the room screen.

'use client';

import { useRealtimeLeaderboard } from '@/lib/hooks/useRealtimeLeaderboard';
import { HeartsLeaderboard } from '@/components/team/HeartsLeaderboard';

export default function LeaderboardScreen() {
  const { teams, loading } = useRealtimeLeaderboard();
  return <HeartsLeaderboard teams={teams} loading={loading} />;
}
