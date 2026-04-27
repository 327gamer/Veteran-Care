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

// Last-known-good snapshot. Updated whenever a new state goes live so
// that, even if /api/public-stats is briefly slow or fails, the user
// never sees blatantly stale numbers (e.g. "3 States Live") flash in.
// This is NOT the source of truth — /api/public-stats is. This is only
// a graceful-degradation safety net.
// Last updated: 2026-04-27 (AL, CA, FL, GA, NC, OH, PA, SC, TX live).
export const PUBLIC_STATS_FALLBACK: PublicStats = {
  totalResources: 6363,
  totalCities: 1019,
  totalStates: 9,
  totalCategories: 17,
  liveStates: ["AL", "CA", "FL", "GA", "NC", "OH", "PA", "SC", "TX"],
  liveStateNames: [
    { code: "AL", name: "Alabama" },
    { code: "CA", name: "California" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "NC", name: "North Carolina" },
    { code: "OH", name: "Ohio" },
    { code: "PA", name: "Pennsylvania" },
    { code: "SC", name: "South Carolina" },
    { code: "TX", name: "Texas" },
  ],
  nextStateLaunching: "Coming Soon",
  coverageRegion: "Nationwide expansion",
  growthStatus: "Expanding Nationally",
  isEstimated: true,
  lastUpdated: new Date().toISOString(),
};

export function formatStatNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  return n.toLocaleString("en-US");
}

export function usePublicStats(): {
  stats: PublicStats;
  isLive: boolean;
  isLoading: boolean;
  hasLiveData: boolean;
} {
  const { data, isLoading } = useQuery<PublicStats>({
    queryKey: ["/api/public-stats"],
    staleTime: 5 * 60 * 1000,
  });
  const stats = data || PUBLIC_STATS_FALLBACK;
  return {
    stats,
    isLive: !!data && !data.isEstimated,
    isLoading,
    hasLiveData: !!data,
  };
}
