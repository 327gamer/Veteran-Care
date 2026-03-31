import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/use-auth";
import { useLocation } from "wouter";
import {
  Copy,
  Check,
  Gift,
  Trophy,
  Users,
  ChevronRight,
  ArrowLeft,
  Crown,
  Medal,
  Star,
} from "lucide-react";
import AuthModal from "@/components/auth-modal";

interface ReferralData {
  userId: string;
  referralCode: string;
  referralLink: string;
  currentMonth: string;
  currentMonthEntryCount: number;
  currentMonthQualifiedReferralCount: number;
  leaderboardRank: number | null;
}

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  entries: number;
}

interface LeaderboardData {
  month: string;
  leaderboard: LeaderboardEntry[];
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-700" />;
  return <span className="text-xs font-bold text-muted-foreground w-4 text-center">{rank}</span>;
}

function getRankStyle(rank: number): string {
  if (rank === 1) return "border-amber-300/60 bg-amber-50/40";
  if (rank === 2) return "border-slate-300/60 bg-slate-50/40";
  if (rank === 3) return "border-amber-600/30 bg-amber-50/20";
  return "";
}

function getRankBadgeStyle(rank: number): string {
  if (rank === 1) return "bg-amber-100 text-amber-800 border-amber-200";
  if (rank === 2) return "bg-slate-100 text-slate-700 border-slate-200";
  if (rank === 3) return "bg-amber-50 text-amber-700 border-amber-200";
  return "";
}

export default function Referral() {
  const { user, session, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [view, setView] = useState<"card" | "leaderboard">("card");

  const token = session?.access_token;

  const { data: referralData, isLoading: refLoading } = useQuery<ReferralData>({
    queryKey: ["/api/referral/me"],
    queryFn: () =>
      fetch("/api/referral/me", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    enabled: !!token,
  });

  const { data: leaderboardData, isLoading: lbLoading } = useQuery<LeaderboardData>({
    queryKey: ["/api/referral/leaderboard"],
    queryFn: () =>
      fetch("/api/referral/leaderboard").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
  });

  const handleCopy = async () => {
    if (!referralData?.referralLink) return;
    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = referralData.referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div data-testid="section-referral-unauth" className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 data-testid="text-referral-title" className="text-2xl font-heading font-extrabold text-primary tracking-tight">
            Refer & Earn Entries to Win
          </h1>
          <p data-testid="text-referral-description" className="text-muted-foreground text-sm max-w-xs leading-relaxed">
            Help support more veterans by spreading the word. Every qualified referral earns you entries into this month's giveaway.
          </p>
          <Button
            data-testid="button-referral-signup"
            className="rounded-full px-8"
            onClick={() => setShowAuth(true)}
          >
            Create Account to Start
          </Button>
        </div>
        <div className="h-8"></div>
        <AuthModal open={showAuth} onOpenChange={setShowAuth} defaultMode="signup" />
      </div>
    );
  }

  if (view === "leaderboard") {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <Button
            data-testid="button-back-to-referral"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setView("card")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 data-testid="text-leaderboard-title" className="text-xl font-heading font-extrabold text-primary tracking-tight">
              Monthly Leaderboard
            </h1>
            {leaderboardData?.month && (
              <p data-testid="text-leaderboard-month" className="text-xs text-muted-foreground">{formatMonth(leaderboardData.month)}</p>
            )}
          </div>
        </div>

        {lbLoading ? (
          <div data-testid="leaderboard-loading" className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !leaderboardData?.leaderboard?.length ? (
          <Card data-testid="leaderboard-empty">
            <CardContent className="p-8 text-center space-y-2">
              <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p data-testid="text-leaderboard-empty" className="text-sm text-muted-foreground">No entries yet this month.</p>
              <p className="text-xs text-muted-foreground/70">Be the first to refer a veteran and earn entries!</p>
            </CardContent>
          </Card>
        ) : (
          <div data-testid="leaderboard-list" className="space-y-2">
            {leaderboardData.leaderboard.map((entry) => (
              <Card
                key={entry.rank}
                data-testid={`leaderboard-entry-${entry.rank}`}
                className={getRankStyle(entry.rank)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    entry.rank === 1 ? "bg-amber-100" :
                    entry.rank === 2 ? "bg-slate-100" :
                    entry.rank === 3 ? "bg-amber-50" : "bg-muted/50"
                  }`}>
                    <RankIcon rank={entry.rank} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${entry.rank <= 3 ? "font-semibold" : "font-medium"}`} data-testid={`text-leaderboard-name-${entry.rank}`}>
                      {entry.displayName}
                    </p>
                  </div>
                  <Badge
                    data-testid={`text-leaderboard-entries-${entry.rank}`}
                    variant="secondary"
                    className={`shrink-0 text-xs ${getRankBadgeStyle(entry.rank)}`}
                  >
                    {entry.entries} {entry.entries === 1 ? "entry" : "entries"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div>
        <h1 className="text-xl font-heading font-extrabold text-primary tracking-tight">
          Refer & Earn Entries to Win
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share your link. When someone signs up and completes their profile, you earn a sweepstakes entry.
        </p>
      </div>

      {refLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : referralData ? (
        <>
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Your Referral Link
                </label>
                <div className="flex gap-2">
                  <div
                    data-testid="text-referral-link"
                    className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-mono text-foreground truncate border"
                  >
                    {referralData.referralLink}
                  </div>
                  <Button
                    data-testid="button-copy-referral-link"
                    variant={copied ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 h-auto px-4"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p
                    data-testid="text-referral-entries"
                    className="text-2xl font-bold text-primary"
                  >
                    {referralData.currentMonthEntryCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                    Entries
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p
                    data-testid="text-referral-qualified"
                    className="text-2xl font-bold text-primary"
                  >
                    {referralData.currentMonthQualifiedReferralCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                    Referrals
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p
                    data-testid="text-referral-rank"
                    className="text-2xl font-bold text-primary"
                  >
                    {referralData.leaderboardRank ?? "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                    Rank
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-center text-muted-foreground/60">
                Entries are earned when a referral signs up and completes their profile.
              </p>
              {referralData.currentMonth && (
                <p className="text-xs text-center text-muted-foreground/70 mt-1">
                  {formatMonth(referralData.currentMonth)} Sweepstakes
                </p>
              )}
            </CardContent>
          </Card>

          <Card
            data-testid="card-view-leaderboard"
            className="cursor-pointer hover:border-primary/30 transition-colors group"
            onClick={() => setView("leaderboard")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  View Leaderboard
                </p>
                <p className="text-xs text-muted-foreground">
                  See the top referrers this month
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent mt-2">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-primary" />
                This Month's Giveaway
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Qualified referrals earn entries into this month's giveaway. Final prize details will be announced soon.
              </p>
              <p className="text-[11px] text-muted-foreground/60">
                The more veterans you help connect to resources, the more entries you earn.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Star className="h-4 w-4 text-primary" />
                How It Works
              </h3>
              <ol className="text-xs text-muted-foreground space-y-1.5 ml-5 list-decimal">
                <li>Share your referral link</li>
                <li>A veteran, family member, or supporter signs up</li>
                <li>They complete the required steps</li>
                <li>You earn an entry into this month's giveaway</li>
                <li>Your standing updates on the leaderboard</li>
              </ol>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Unable to load referral data. Please try again.</p>
          </CardContent>
        </Card>
      )}

      <div className="h-8"></div>
    </div>
  );
}
