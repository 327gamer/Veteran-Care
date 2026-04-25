import { useQuery } from "@tanstack/react-query";

export type PublicStats = {
  totalResources: number;
  totalCities: number;
  totalStates: number;
  totalCategories: number;
  liveStates: string[];
  liveStateNames: { code: string; name: string }[];
  nextStateLaunching: string;
  coverageRegion: string;
  growthStatus: string;
  isEstimated?: boolean;
  lastUpdated: string;
};

export const PUBLIC_STATS_FALLBACK: PublicStats = {
  totalResources: 2000,
  totalCities: 150,
  totalStates: 3,
  totalCategories: 17,
  liveStates: ["GA", "NC", "SC"],
  liveStateNames: [
    { code: "SC", name: "South Carolina" },
    { code: "NC", name: "North Carolina" },
    { code: "GA", name: "Georgia" },
  ],
  nextStateLaunching: "Florida",
  coverageRegion: "Southeast United States",
  growthStatus: "Expanding Nationally",
  isEstimated: true,
  lastUpdated: new Date().toISOString(),
};

export function formatStatNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  return n.toLocaleString("en-US");
}

export function usePublicStats(): { stats: PublicStats; isLive: boolean; isLoading: boolean } {
  const { data, isLoading } = useQuery<PublicStats>({
    queryKey: ["/api/public-stats"],
    staleTime: 5 * 60 * 1000,
  });
  const stats = data || PUBLIC_STATS_FALLBACK;
  return { stats, isLive: !!data && !data.isEstimated, isLoading };
}
