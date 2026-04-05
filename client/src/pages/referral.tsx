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
  MessageSquare,
  Phone,
  Send,
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
  const [msgCopied, setMsgCopied] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [view, setView] = useState<"card" | "leaderboard">("card");
  const [msgVariant, setMsgVariant] = useState(0);

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

  const { data: prizeData } = useQuery<{
    month: string; prizeTitle: string | null; prizeDescription: string | null;
    prizeValue: number | null; prizeImageUrl: string | null; rulesText: string | null;
  }>({
    queryKey: ["/api/sweepstakes/current-prize"],
    queryFn: () => fetch("/api/sweepstakes/current-prize").then(r => r.ok ? r.json() : null),
  });

  const { data: leaderboardData, isLoading: lbLoading } = useQuery<LeaderboardData>({
    queryKey: ["/api/referral/leaderboard"],
    queryFn: () =>
      fetch("/api/referral/leaderboard").then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
  });

  const shareMessages = [
    (link: string) => `Veteran Care helps veterans and families find real support in one place. If you know someone who could use it, here's my link: ${link}`,
    (link: string) => `This platform helps connect veterans to real resources and support. Sharing in case it helps someone you know: ${link}`,
    (link: string) => `If you or someone you know needs support, this is worth checking out: ${link}`,
  ];

  const shareLabels = ["Friendly", "Mission", "Direct"];

  const getShareMessage = () => {
    if (!referralData?.referralLink) return "";
    return shareMessages[msgVariant](referralData.referralLink);
  };

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

  const handleCopyMessage = async () => {
    const msg = getShareMessage();
    if (!msg) return;
    try {
      await navigator.clipboard.writeText(msg);
      setMsgCopied(true);
      setTimeout(() => setMsgCopied(false), 2000);
    } catch {
      const input = document.createElement("textarea");
      input.value = msg;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setMsgCopied(true);
      setTimeout(() => setMsgCopied(false), 2000);
    }
  };

  const handleSms = () => {
    const msg = getShareMessage();
    if (!msg) return;
    window.open(`sms:?&body=${encodeURIComponent(msg)}`, "_self");
  };

  const handleWhatsApp = () => {
    const msg = getShareMessage();
    if (!msg) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
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

              <div className="space-y-2">
                <div className="flex gap-1.5">
                  {shareLabels.map((label, i) => (
                    <button
                      key={label}
                      data-testid={`button-msg-variant-${i}`}
                      onClick={() => setMsgVariant(i)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                        msgVariant === i
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 text-muted-foreground border-transparent hover:border-muted-foreground/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/30 rounded-lg px-3 py-2 border border-dashed">
                  {getShareMessage() || "Loading..."}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    data-testid="button-copy-message"
                    variant="outline"
                    size="sm"
                    className="text-xs h-9"
                    onClick={handleCopyMessage}
                  >
                    {msgCopied ? (
                      <><Check className="h-3.5 w-3.5 mr-1" />Copied</>
                    ) : (
                      <><MessageSquare className="h-3.5 w-3.5 mr-1" />Copy Msg</>
                    )}
                  </Button>
                  <Button
                    data-testid="button-share-sms"
                    variant="outline"
                    size="sm"
                    className="text-xs h-9"
                    onClick={handleSms}
                  >
                    <Phone className="h-3.5 w-3.5 mr-1" />
                    SMS
                  </Button>
                  <Button
                    data-testid="button-share-whatsapp"
                    variant="outline"
                    size="sm"
                    className="text-xs h-9"
                    onClick={handleWhatsApp}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    WhatsApp
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
              {prizeData?.prizeTitle ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="font-bold text-base" data-testid="text-prize-title">{prizeData.prizeTitle}</p>
                    {prizeData.prizeValue && <p className="text-green-700 font-bold text-lg mt-1" data-testid="text-prize-value">${prizeData.prizeValue}</p>}
                    {prizeData.prizeDescription && <p className="text-xs text-muted-foreground mt-1">{prizeData.prizeDescription}</p>}
                  </div>
                  <p className="text-[11px] text-muted-foreground/60">
                    The more veterans you help connect to resources, the more entries you earn.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Qualified referrals earn entries into this month's giveaway. Prize details coming soon!
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">
                    The more veterans you help connect to resources, the more entries you earn.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {prizeData?.rulesText && (
            <Card className="bg-muted/30 border-dashed mt-2">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-primary" />
                  Official Rules
                </h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{prizeData.rulesText}</p>
              </CardContent>
            </Card>
          )}

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

    </div>
  );
}
