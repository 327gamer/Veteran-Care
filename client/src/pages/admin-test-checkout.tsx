import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

/**
 * Founder $1 test checkout console.
 *
 * Gated by the existing admin key system (x-admin-key header). Every
 * test endpoint also requires ?test=true as an explicit tripwire.
 *
 * Public users CANNOT reach this — the API endpoints reject any
 * request without a valid admin key. The frontend page is just the
 * UI shell for the founder.
 */
export default function AdminTestCheckout() {
  const [adminKey, setAdminKey] = useState(
    () => localStorage.getItem("adminKey") || "",
  );
  const [authenticated, setAuthenticated] = useState(
    () => !!localStorage.getItem("adminKey"),
  );
  const [loginErr, setLoginErr] = useState("");

  const [sSlotId, setSSlotId] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sName, setSName] = useState("TEST — Founder");
  const [sLoading, setSLoading] = useState(false);
  const [sResult, setSResult] = useState<any>(null);

  const [bEmail, setBEmail] = useState("");
  const [bState, setBState] = useState("");
  const [bCategory, setBCategory] = useState("");
  const [bSubcategory, setBSubcategory] = useState("");
  const [bPlanType, setBPlanType] = useState<"state" | "national">("state");
  const [bCompany, setBCompany] = useState("");
  const [bLoading, setBLoading] = useState(false);
  const [bResult, setBResult] = useState<any>(null);

  const [lLeadId, setLLeadId] = useState("");
  const [lLoading, setLLoading] = useState(false);
  const [lResult, setLResult] = useState<any>(null);

  async function login() {
    if (!adminKey.trim()) {
      setLoginErr("Enter admin key");
      return;
    }
    const r = await fetch("/api/admin/billing-summary", {
      headers: { "x-admin-key": adminKey },
    });
    if (r.ok) {
      localStorage.setItem("adminKey", adminKey);
      setAuthenticated(true);
      setLoginErr("");
    } else {
      setLoginErr("Invalid admin key");
    }
  }

  function logout() {
    localStorage.removeItem("adminKey");
    setAuthenticated(false);
    setAdminKey("");
  }

  async function postJson(url: string, body: any) {
    const r = await fetch(`${url}?test=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify(body),
    });
    return await r.json();
  }

  async function submitStandalone() {
    setSLoading(true);
    setSResult(null);
    try {
      const r = await postJson("/api/admin/test-checkout/standalone-start", {
        slotId: sSlotId.trim(),
        email: sEmail.trim(),
        sponsorName: sName.trim(),
      });
      setSResult(r);
    } catch (err: any) {
      setSResult({ error: err.message });
    } finally {
      setSLoading(false);
    }
  }

  async function submitBundled() {
    setBLoading(true);
    setBResult(null);
    try {
      const r = await postJson("/api/admin/test-checkout/bundled-start", {
        email: bEmail.trim(),
        state: bState.trim(),
        categorySlug: bCategory.trim(),
        subcategorySlug: bSubcategory.trim() || null,
        planType: bPlanType,
        companyName: bCompany.trim() || null,
      });
      setBResult(r);
    } catch (err: any) {
      setBResult({ error: err.message });
    } finally {
      setBLoading(false);
    }
  }

  async function submitLead() {
    setLLoading(true);
    setLResult(null);
    try {
      const r = await fetch(
        `/api/admin/test-leads/${encodeURIComponent(lLeadId.trim())}/charge-test?test=true`,
        { method: "POST", headers: { "x-admin-key": adminKey } },
      );
      setLResult(await r.json());
    } catch (err: any) {
      setLResult({ error: err.message });
    } finally {
      setLLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle data-testid="text-login-title">Admin login</CardTitle>
            <CardDescription>
              Enter your admin key to access the $1 founder test console.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              data-testid="input-admin-key"
            />
            {loginErr && (
              <p
                className="text-sm text-red-600"
                data-testid="text-login-error"
              >
                {loginErr}
              </p>
            )}
            <Button
              onClick={login}
              className="w-full"
              data-testid="button-login"
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              data-testid="text-page-title"
            >
              $1 Founder Test Checkout
            </h1>
            <p className="text-sm text-slate-600">
              Admin-only • protected by x-admin-key + ?test=true tripwire
            </p>
          </div>
          <Button
            variant="outline"
            onClick={logout}
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>

        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
          <div>
            <strong>Real Stripe charges at $1.</strong> Cancel test
            subscriptions in Stripe dashboard after testing. Test
            partner_applications are prefixed with [TEST].
          </div>
        </div>

        {/* ── A: Standalone $1 ECSS checkout ─────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>A. Standalone $1 Elite Slot checkout</CardTitle>
            <CardDescription>
              Pick an existing vacant slot from{" "}
              <a
                className="underline"
                href="/admin/elite-sponsors"
                data-testid="link-elite-sponsors"
              >
                /admin/elite-sponsors
              </a>{" "}
              and start a $1 subscription against it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Slot ID</Label>
              <Input
                value={sSlotId}
                onChange={(e) => setSSlotId(e.target.value)}
                placeholder="uuid"
                data-testid="input-standalone-slot"
              />
            </div>
            <div>
              <Label>Customer email</Label>
              <Input
                type="email"
                value={sEmail}
                onChange={(e) => setSEmail(e.target.value)}
                data-testid="input-standalone-email"
              />
            </div>
            <div>
              <Label>Sponsor display name (optional)</Label>
              <Input
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                data-testid="input-standalone-name"
              />
            </div>
            <Button
              onClick={submitStandalone}
              disabled={sLoading || !sSlotId || !sEmail}
              data-testid="button-standalone-start"
            >
              {sLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Start $1 standalone checkout
            </Button>
            {sResult && (
              <ResultBlock result={sResult} testId="result-standalone" />
            )}
          </CardContent>
        </Card>

        {/* ── B: Bundled $1 + $1 base+slot checkout ──────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>
              B. Bundled $1 base + $1 elite slot checkout
            </CardTitle>
            <CardDescription>
              Creates a [TEST]-prefixed partner application + slot, then opens
              the bundled checkout that mimics the real /elite-partner-apply
              submission flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={bEmail}
                  onChange={(e) => setBEmail(e.target.value)}
                  data-testid="input-bundled-email"
                />
              </div>
              <div>
                <Label>State (2 letters)</Label>
                <Input
                  value={bState}
                  onChange={(e) => setBState(e.target.value)}
                  placeholder="WY"
                  maxLength={2}
                  data-testid="input-bundled-state"
                />
              </div>
              <div>
                <Label>Category slug</Label>
                <Input
                  value={bCategory}
                  onChange={(e) => setBCategory(e.target.value)}
                  placeholder="financial-credit"
                  data-testid="input-bundled-category"
                />
              </div>
              <div>
                <Label>Subcategory slug (optional)</Label>
                <Input
                  value={bSubcategory}
                  onChange={(e) => setBSubcategory(e.target.value)}
                  placeholder="va-loans"
                  data-testid="input-bundled-subcategory"
                />
              </div>
              <div>
                <Label>Plan type</Label>
                <select
                  className="w-full h-10 border rounded px-2 bg-white"
                  value={bPlanType}
                  onChange={(e) =>
                    setBPlanType(e.target.value as "state" | "national")
                  }
                  data-testid="select-bundled-plan"
                >
                  <option value="state">state</option>
                  <option value="national">national</option>
                </select>
              </div>
              <div>
                <Label>Company name (optional)</Label>
                <Input
                  value={bCompany}
                  onChange={(e) => setBCompany(e.target.value)}
                  data-testid="input-bundled-company"
                />
              </div>
            </div>
            <Button
              onClick={submitBundled}
              disabled={bLoading || !bEmail || !bState || !bCategory}
              data-testid="button-bundled-start"
            >
              {bLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Start $1 + $1 bundled checkout
            </Button>
            {bResult && (
              <ResultBlock result={bResult} testId="result-bundled" />
            )}
          </CardContent>
        </Card>

        {/* ── C: $1 lead-charge test ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>C. $1 lead-charge test</CardTitle>
            <CardDescription>
              Manually charge $1 against the partner that owns this lead (vs.
              the normal $49.99). Use a real lead ID from /admin/resources or
              /admin/leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Lead ID</Label>
              <Input
                value={lLeadId}
                onChange={(e) => setLLeadId(e.target.value)}
                placeholder="uuid"
                data-testid="input-lead-id"
              />
            </div>
            <Button
              onClick={submitLead}
              disabled={lLoading || !lLeadId}
              data-testid="button-lead-charge"
            >
              {lLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Charge $1 against this lead
            </Button>
            {lResult && <ResultBlock result={lResult} testId="result-lead" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultBlock({
  result,
  testId,
}: {
  result: any;
  testId: string;
}) {
  const isErr = result?.error || result?.ok === false;
  return (
    <div
      className={`rounded-md p-3 text-sm ${isErr ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}
      data-testid={testId}
    >
      <div className="flex items-start gap-2">
        {isErr ? (
          <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
        ) : (
          <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {result.url && (
            <p className="mb-2">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
                data-testid={`${testId}-link`}
              >
                Open Stripe checkout →
              </a>
            </p>
          )}
          <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
