// app/leaderboard/page.tsx
//
// Standalone projector screen: the live leaderboard drawn as racing snakes.
// Reads the same realtime data the in-app leaderboard uses, top 5.

'use client';

import { useRealtimeLeaderboard } from '@/lib/hooks/useRealtimeLeaderboard';
import { SnakeLeaderboard } from '@/components/team/SnakeLeaderboard';

export default function LeaderboardScreen() {
  const { teams, loading } = useRealtimeLeaderboard(5);
  return <SnakeLeaderboard teams={teams} loading={loading} />;
}
