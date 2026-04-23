import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, MailMinus, Settings2 } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  request_reply: "Replies to my requests",
  resource_updates: "Resource updates",
  partner_opportunities: "Partner opportunities",
  product_announcements: "Product / feature announcements",
  billing_notices: "Billing notices",
};

const CATEGORY_ORDER = [
  "request_reply",
  "resource_updates",
  "partner_opportunities",
  "product_announcements",
  "billing_notices",
];

export default function Unsubscribe() {
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const initialCategory = params.get("category");
  const manageMode = params.get("manage") === "1";

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [unsubAll, setUnsubAll] = useState(false);
  const [suppressed, setSuppressed] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"all" | "prefs" | null>(null);

  useEffect(() => {
    document.title = "Email Preferences | Veteran Care";
    if (!token) {
      setError("Missing unsubscribe token.");
      setLoading(false);
      return;
    }
    fetch(`/api/unsubscribe/status?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Could not load preferences");
        setEmail(j.email);
        setUnsubAll(!!j.unsubscribed_all);
        let initial: string[] = Array.isArray(j.suppressed_categories) ? j.suppressed_categories : [];
        if (initialCategory && !manageMode && !initial.includes(initialCategory)) {
          initial = [...initial, initialCategory];
        }
        setSuppressed(initial);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleCat = (cat: string) => {
    setSuppressed((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const unsubscribeFromAll = async () => {
    const r = await fetch("/api/unsubscribe/one-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!r.ok) {
      toast({ title: "Could not unsubscribe", variant: "destructive" });
      return;
    }
    setUnsubAll(true);
    setDone("all");
  };

  const savePreferences = async () => {
    const r = await fetch("/api/unsubscribe/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, unsubscribed_all: unsubAll, suppressed_categories: suppressed }),
    });
    if (!r.ok) {
      toast({ title: "Could not save preferences", variant: "destructive" });
      return;
    }
    setDone("prefs");
  };

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-unsubscribe">
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-10 max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70 mb-2">Email preferences</p>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
            <Settings2 className="h-7 w-7" /> Manage your subscriptions
          </h1>
          {email && (
            <p className="text-primary-foreground/80 mt-2 text-sm">For <span className="font-mono">{email}</span></p>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-2xl">
        {loading ? (
          <Card><CardContent className="pt-6 text-muted-foreground">Loading…</CardContent></Card>
        ) : error ? (
          <Card><CardContent className="pt-6">
            <p className="text-destructive font-medium mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">If you keep seeing this, email us at <span className="font-mono">info@VeteranCare.com</span> and we'll handle it manually.</p>
          </CardContent></Card>
        ) : done ? (
          <Card className="border-l-4 border-l-accent">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold text-primary mb-2">
                {done === "all" ? "You're unsubscribed" : "Preferences saved"}
              </h2>
              <p className="text-foreground/80">
                {done === "all"
                  ? "We won't send you any more non-essential emails. You may still receive transactional notices required for any account or billing activity."
                  : "Your email preferences have been updated."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-heading text-lg font-bold text-primary mb-3">Choose what you receive</h2>
                <div className="space-y-3">
                  {CATEGORY_ORDER.map((cat) => {
                    const checked = !suppressed.includes(cat);
                    return (
                      <label key={cat} className="flex items-start gap-3 cursor-pointer" data-testid={`pref-${cat}`}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleCat(cat)}
                          disabled={unsubAll}
                        />
                        <div>
                          <div className="font-medium text-foreground">{CATEGORY_LABELS[cat]}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Button onClick={savePreferences} disabled={unsubAll} data-testid="button-save-prefs">
                    Save preferences
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-heading text-base font-bold text-primary mb-2 flex items-center gap-2">
                  <MailMinus className="h-4 w-4" /> Unsubscribe from everything
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Stops all non-essential emails. You may still receive transactional notices required for account or billing activity.
                </p>
                <Button variant="outline" onClick={unsubscribeFromAll} data-testid="button-unsub-all">
                  Unsubscribe from all
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
