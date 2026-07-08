import { useQuery } from "@tanstack/react-query";
import { getMyStats, getLeaderboard, LeaderboardPeriod } from "@/lib/api";

export function useMyStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: getMyStats,
  });
}

export function useLeaderboard(period: LeaderboardPeriod) {
  return useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => getLeaderboard(period),
  });
}
