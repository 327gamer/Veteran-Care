import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Z } from "@/lib/layers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  MessageSquare,
  Zap,
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  ChevronLeft,
  Lock,
  TrendingUp,
  Users,
  UserX,
  Handshake,
  Ban,
  Search,
} from "lucide-react";
import { useLocation } from "wouter";

interface AiInsightsData {
  totalConversations: number;
  guestCount: number;
  authCount: number;
  topCategories: { category: string; count: number }[];
  crisisCount: number;
  blockedCount: number;
  fallbackCount: number;
  safetyFilterCount: number;
  navigatorSuggestedCount: number;
  tokens: { total: number; input: number; output: number };
  cost: { total: number; today: number; week: number };
  today: { tokens: number; conversations: number };
  week: { tokens: number; conversations: number };
  dailyUsage: { date: string; tokens: number; conversations: number; cost: number }[];
  resourceGaps: { category: string; demand: number; supply: number; ratio: number }[];
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatCost(n: number): string {
  return "$" + n.toFixed(4);
}

function formatCategory(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function AdminAiInsightsInner() {
  const [adminKey, setAdminKey] = useState("");
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<AiInsightsData>({
    queryKey: ["/api/admin/ai-insights", adminKey],
    queryFn: () =>
      fetch("/api/admin/ai-insights", {
        headers: { "x-admin-key": adminKey },
      }).then(r => {
        if (!r.ok) throw new Error("Invalid admin key");
        return r.json();
      }),
    enabled: adminKey.length > 0,
    retry: false,
  });

  if (!adminKey || !data) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <CardTitle>AI Insights Dashboard</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your admin key to view AI usage analytics.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-3">
              <Input
                data-testid="input-admin-key-ai"
                type="password"
                placeholder="Admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
              {error && <p className="text-xs text-red-500" data-testid="text-auth-error">Invalid admin key</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxBarTokens = Math.max(...(data.dailyUsage.map(d => d.tokens) || [1]));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className={`bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 sticky top-0 ${Z.STICKY}`}>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 h-8 w-8" onClick={() => setLocation("/admin")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Brain className="h-5 w-5" />
        <h1 className="font-heading font-bold text-lg">AI Insights</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold" data-testid="text-total-conversations">{data.totalConversations}</p>
              <p className="text-xs text-muted-foreground">Total Conversations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <p className="text-2xl font-bold" data-testid="text-total-cost">{formatCost(data.cost.total)}</p>
              <p className="text-xs text-muted-foreground">Estimated Total Cost</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-bold" data-testid="text-total-tokens">{formatTokens(data.tokens.total)}</p>
              <p className="text-xs text-muted-foreground">Total Tokens Used</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto text-red-600 mb-1" />
              <p className="text-2xl font-bold" data-testid="text-crisis-count">{data.crisisCount}</p>
              <p className="text-xs text-muted-foreground">Crisis Triggers</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Today & This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Today</p>
                <p className="text-lg font-bold">{data.today.conversations} <span className="text-xs font-normal text-muted-foreground">chats</span></p>
                <p className="text-xs text-muted-foreground">{formatTokens(data.today.tokens)} tokens · {formatCost(data.cost.today)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Last 7 Days</p>
                <p className="text-lg font-bold">{data.week.conversations} <span className="text-xs font-normal text-muted-foreground">chats</span></p>
                <p className="text-xs text-muted-foreground">{formatTokens(data.week.tokens)} tokens · {formatCost(data.cost.week)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              User Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-bold text-lg">{data.guestCount}</p>
                <p className="text-[10px] text-muted-foreground">Guest</p>
              </div>
              <div>
                <p className="font-bold text-lg">{data.authCount}</p>
                <p className="text-[10px] text-muted-foreground">Logged In</p>
              </div>
              <div>
                <p className="font-bold text-lg">{data.navigatorSuggestedCount}</p>
                <p className="text-[10px] text-muted-foreground">Navigator Suggested</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              Safety & Guardrails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{data.crisisCount}</p>
                  <p className="text-[10px] text-muted-foreground">Crisis Triggers</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                <Ban className="h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{data.blockedCount}</p>
                  <p className="text-[10px] text-muted-foreground">Blocked Topics</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                <UserX className="h-4 w-4 text-orange-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{data.fallbackCount}</p>
                  <p className="text-[10px] text-muted-foreground">Fallback Mode</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <Handshake className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{data.navigatorSuggestedCount}</p>
                  <p className="text-[10px] text-muted-foreground">Navigator Hints</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Top Categories Asked About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topCategories.length === 0 && (
              <p className="text-xs text-muted-foreground">No category data yet.</p>
            )}
            {data.topCategories.slice(0, 10).map((c, i) => (
              <div key={c.category} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium">{formatCategory(c.category)}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{c.count}</Badge>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.max(4, (c.count / (data.topCategories[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {data.resourceGaps.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Resource Gap Indicators
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Categories with high demand but low resource coverage</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.resourceGaps.map(g => (
                <div key={g.category} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                  <div>
                    <p className="text-xs font-semibold">{formatCategory(g.category)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {g.demand} questions · {g.supply} approved resources
                    </p>
                  </div>
                  <Badge variant={g.ratio < 0.5 ? "destructive" : "outline"} className="text-[10px]">
                    {g.ratio < 0.5 ? "Low Coverage" : "Watch"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Daily Token Usage (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {data.dailyUsage.length === 0 && (
              <p className="text-xs text-muted-foreground">No usage data yet.</p>
            )}
            {data.dailyUsage.map(d => (
              <div key={d.date} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">{d.date}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full"
                    style={{ width: `${Math.max(2, (d.tokens / maxBarTokens) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0">{formatTokens(d.tokens)}</span>
                <span className="text-[10px] text-muted-foreground w-14 text-right shrink-0">{formatCost(d.cost)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Token & Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-bold text-sm">{formatTokens(data.tokens.input)}</p>
                <p className="text-[10px] text-muted-foreground">Input Tokens</p>
              </div>
              <div>
                <p className="font-bold text-sm">{formatTokens(data.tokens.output)}</p>
                <p className="text-[10px] text-muted-foreground">Output Tokens</p>
              </div>
              <div>
                <p className="font-bold text-sm">{formatCost(data.cost.total)}</p>
                <p className="text-[10px] text-muted-foreground">Est. Total Cost</p>
              </div>
            </div>
            <Separator className="my-3" />
            <p className="text-[10px] text-muted-foreground text-center">
              Based on gpt-4o-mini pricing: $0.15/1M input · $0.60/1M output
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function AdminAiInsights() {
  return <AdminAuthGuard><AdminAiInsightsInner /></AdminAuthGuard>;
}
