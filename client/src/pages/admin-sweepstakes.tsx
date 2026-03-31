import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Trophy,
  Crown,
  Medal,
  Gift,
  Dice5,
  UserCheck,
  Lock,
  Loader2,
  Trash2,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

interface PoolEntry {
  userId: string;
  displayName: string;
  email: string | null;
  entries: number;
}

interface Winner {
  id: string;
  placement: number;
  userId: string;
  displayName: string;
  email: string | null;
  entryCountAtDraw: number | null;
  selectionMethod: string;
  selectedByAdminId: string | null;
  prizeNotes: string | null;
  createdAt: string;
}

interface CurrentData {
  month: string;
  status: string;
  totalEntries: number;
  totalParticipants: number;
  entryPool: PoolEntry[];
  winners: Winner[];
}

interface HistoryMonth {
  month: string;
  status: string;
  notes: string | null;
  sponsorNotes: string | null;
  winnerCount: number;
  winners: Winner[];
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function placementLabel(p: number): string {
  if (p === 1) return "1st Place";
  if (p === 2) return "2nd Place";
  if (p === 3) return "3rd Place";
  return `${p}th Place`;
}

function PlacementIcon({ placement }: { placement: number }) {
  if (placement === 1) return <Crown className="h-4 w-4 text-amber-500" />;
  if (placement === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (placement === 3) return <Medal className="h-4 w-4 text-amber-700" />;
  return <Trophy className="h-4 w-4 text-muted-foreground" />;
}

export default function AdminSweepstakes() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const adminKey = localStorage.getItem("adminKey") || "";
  const [view, setView] = useState<"current" | "history">("current");
  const [drawPlacement, setDrawPlacement] = useState<number>(1);
  const [drawMethod, setDrawMethod] = useState<"random" | "manual">("random");
  const [manualUserId, setManualUserId] = useState("");
  const [prizeNotes, setPrizeNotes] = useState("");
  const [showPool, setShowPool] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-admin-key": adminKey,
  };

  const { data: current, isLoading } = useQuery<CurrentData>({
    queryKey: ["/api/admin/sweepstakes/current"],
    queryFn: () =>
      fetch("/api/admin/sweepstakes/current", { headers }).then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    enabled: view === "current",
  });

  const { data: historyData, isLoading: histLoading } = useQuery<{ history: HistoryMonth[] }>({
    queryKey: ["/api/admin/sweepstakes/history"],
    queryFn: () =>
      fetch("/api/admin/sweepstakes/history", { headers }).then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
    enabled: view === "history",
  });

  const drawMutation = useMutation({
    mutationFn: (body: any) =>
      fetch("/api/admin/sweepstakes/draw", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Draw failed");
        return data;
      }),
    onSuccess: (data) => {
      toast({ title: "Winner Selected", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sweepstakes/current"] });
      setManualUserId("");
      setPrizeNotes("");
    },
    onError: (err: Error) => {
      toast({ title: "Draw Failed", description: err.message, variant: "destructive" });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      fetch("/api/admin/sweepstakes/close-month", {
        method: "POST",
        headers,
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Close failed");
        return data;
      }),
    onSuccess: (data) => {
      toast({ title: "Month Closed", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sweepstakes/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sweepstakes/history"] });
    },
    onError: (err: Error) => {
      toast({ title: "Close Failed", description: err.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (winnerId: string) =>
      fetch(`/api/admin/sweepstakes/winner/${winnerId}`, {
        method: "DELETE",
        headers,
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Remove failed");
        return data;
      }),
    onSuccess: () => {
      toast({ title: "Winner Removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sweepstakes/current"] });
    },
    onError: (err: Error) => {
      toast({ title: "Remove Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleDraw = () => {
    const body: any = { placement: drawPlacement, selectionMethod: drawMethod };
    if (drawMethod === "manual") body.userId = manualUserId;
    if (prizeNotes.trim()) body.prizeNotes = prizeNotes.trim();
    drawMutation.mutate(body);
  };

  const isClosed = current?.status === "closed" || current?.status === "archived";
  const takenPlacements = new Set(current?.winners?.map((w) => w.placement) || []);
  const nextAvailable = [1, 2, 3].find((p) => !takenPlacements.has(p));

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button
          data-testid="button-back-admin"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setLocation("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 data-testid="text-admin-sweepstakes-title" className="text-xl font-heading font-extrabold text-primary tracking-tight">
            Sweepstakes Management
          </h1>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          data-testid="button-tab-current"
          variant={view === "current" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("current")}
        >
          <Trophy className="h-4 w-4 mr-1" />
          Current Draw
        </Button>
        <Button
          data-testid="button-tab-history"
          variant={view === "history" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("history")}
        >
          <History className="h-4 w-4 mr-1" />
          Past Draws
        </Button>
      </div>

      {view === "current" && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : current ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    {formatMonth(current.month)}
                    <Badge variant={isClosed ? "secondary" : "default"} className="ml-auto text-xs">
                      {current.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p data-testid="text-total-participants" className="text-2xl font-bold text-primary">{current.totalParticipants}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Participants</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p data-testid="text-total-entries" className="text-2xl font-bold text-primary">{current.totalEntries}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Total Entries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {current.winners.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Selected Winners</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {current.winners.map((w) => (
                      <div
                        key={w.id}
                        data-testid={`winner-${w.placement}`}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          w.placement === 1 ? "border-amber-300/60 bg-amber-50/40" :
                          w.placement === 2 ? "border-slate-300/60 bg-slate-50/40" :
                          w.placement === 3 ? "border-amber-600/30 bg-amber-50/20" : ""
                        }`}
                      >
                        <PlacementIcon placement={w.placement} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{placementLabel(w.placement)}: {w.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {w.selectionMethod === "random" ? "Random draw" : "Manual"} · {w.entryCountAtDraw ?? "?"} entries · {new Date(w.createdAt).toLocaleDateString()}
                          </p>
                          {w.prizeNotes && <p className="text-xs text-muted-foreground/70 mt-0.5">{w.prizeNotes}</p>}
                        </div>
                        {!isClosed && (
                          <Button
                            data-testid={`button-remove-winner-${w.placement}`}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive"
                            onClick={() => removeMutation.mutate(w.id)}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {!isClosed && nextAvailable && (
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Draw Winner</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placement</label>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((p) => (
                          <Button
                            key={p}
                            data-testid={`button-placement-${p}`}
                            variant={drawPlacement === p ? "default" : "outline"}
                            size="sm"
                            disabled={takenPlacements.has(p)}
                            onClick={() => setDrawPlacement(p)}
                            className="flex-1"
                          >
                            {placementLabel(p)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</label>
                      <div className="flex gap-2">
                        <Button
                          data-testid="button-method-random"
                          variant={drawMethod === "random" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDrawMethod("random")}
                          className="flex-1"
                        >
                          <Dice5 className="h-4 w-4 mr-1" />
                          Random
                        </Button>
                        <Button
                          data-testid="button-method-manual"
                          variant={drawMethod === "manual" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDrawMethod("manual")}
                          className="flex-1"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Manual
                        </Button>
                      </div>
                    </div>

                    {drawMethod === "manual" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select User</label>
                        <select
                          data-testid="select-manual-user"
                          className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                          value={manualUserId}
                          onChange={(e) => setManualUserId(e.target.value)}
                        >
                          <option value="">Choose from entry pool...</option>
                          {current.entryPool
                            .filter((e) => !takenPlacements.has(0) && !current.winners.some((w) => w.userId === e.userId))
                            .map((e) => (
                              <option key={e.userId} value={e.userId}>
                                {e.displayName} ({e.entries} entries)
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prize Notes (optional)</label>
                      <Input
                        data-testid="input-prize-notes"
                        placeholder="e.g. $50 gift card"
                        value={prizeNotes}
                        onChange={(e) => setPrizeNotes(e.target.value)}
                      />
                    </div>

                    <Button
                      data-testid="button-draw"
                      className="w-full"
                      onClick={handleDraw}
                      disabled={drawMutation.isPending || (drawMethod === "manual" && !manualUserId) || takenPlacements.has(drawPlacement)}
                    >
                      {drawMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : drawMethod === "random" ? (
                        <Dice5 className="h-4 w-4 mr-1" />
                      ) : (
                        <UserCheck className="h-4 w-4 mr-1" />
                      )}
                      {drawMethod === "random" ? "Draw Random Winner" : "Assign Winner"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!isClosed && current.winners.length > 0 && (
                <Card className="border-destructive/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-destructive/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Close & Lock Month</p>
                      <p className="text-xs text-muted-foreground">
                        Finalizes {current.winners.length} winner(s). No further changes after closing.
                      </p>
                    </div>
                    <Button
                      data-testid="button-close-month"
                      variant="destructive"
                      size="sm"
                      onClick={() => closeMutation.mutate()}
                      disabled={closeMutation.isPending}
                    >
                      {closeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Close Month"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-3">
                  <button
                    data-testid="button-toggle-pool"
                    className="flex items-center gap-2 w-full text-left"
                    onClick={() => setShowPool(!showPool)}
                  >
                    <span className="text-sm font-medium flex-1">Entry Pool ({current.totalParticipants})</span>
                    {showPool ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {showPool && (
                    <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                      {current.entryPool.map((e, i) => (
                        <div key={e.userId} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-background/50">
                          <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                          <span className="flex-1 truncate font-medium">{e.displayName}</span>
                          <span className="text-muted-foreground">{e.email}</span>
                          <Badge variant="secondary" className="text-[10px] shrink-0">{e.entries}</Badge>
                        </div>
                      ))}
                      {current.entryPool.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No entries yet this month.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Unable to load sweepstakes data.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {view === "history" && (
        <>
          {histLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historyData?.history?.length ? (
            <div className="space-y-2">
              {historyData.history.map((m) => (
                <Card key={m.month}>
                  <CardContent className="p-3">
                    <button
                      data-testid={`button-history-${m.month}`}
                      className="flex items-center gap-2 w-full text-left"
                      onClick={() => setExpandedHistory(expandedHistory === m.month ? null : m.month)}
                    >
                      <Trophy className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold flex-1">{formatMonth(m.month)}</span>
                      <Badge variant="secondary" className="text-xs">{m.status}</Badge>
                      <Badge variant="outline" className="text-xs">{m.winnerCount} winner(s)</Badge>
                      {expandedHistory === m.month ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expandedHistory === m.month && (
                      <div className="mt-3 space-y-2">
                        {m.winners.map((w) => (
                          <div key={w.id} className="flex items-center gap-2 text-xs p-2 rounded-lg border bg-muted/20">
                            <PlacementIcon placement={w.placement} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{placementLabel(w.placement)}: {w.displayName}</p>
                              <p className="text-muted-foreground">
                                {w.selectionMethod} · {w.entryCountAtDraw ?? "?"} entries · {new Date(w.createdAt).toLocaleDateString()}
                              </p>
                              {w.prizeNotes && <p className="text-muted-foreground/70">{w.prizeNotes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center space-y-2">
                <History className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No past draws yet.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
