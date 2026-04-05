import { useState, useEffect } from "react";
import { platform } from "@shared/platform";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Eye, EyeOff, Building2, User, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/use-auth";

interface PartnerSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefillEmail?: string;
  defaultMode?: "signup" | "login";
}

export default function PartnerSignupModal({ open, onOpenChange, onSuccess, prefillEmail, defaultMode }: PartnerSignupModalProps) {
  const [mode, setMode] = useState<"signup" | "login">(defaultMode || "signup");

  useEffect(() => {
    if (defaultMode && open) setMode(defaultMode);
  }, [defaultMode, open]);
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [categoryName, setCategoryName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prefillLoaded, setPrefillLoaded] = useState(false);

  const { signIn, signUp } = useAuth();

  useEffect(() => {
    if (prefillEmail && open) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail, open]);

  useEffect(() => {
    if (!open || prefillLoaded) return;
    const emailToCheck = email.trim().toLowerCase();
    if (!emailToCheck) return;

    fetch(`/api/partner/prefill-public?email=${encodeURIComponent(emailToCheck)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.found) {
          setCompanyName(data.companyName || "");
          setContactName(data.contactName || "");
          setCategoryName(data.categoryName || "");
          setPrefillLoaded(true);
        }
      })
      .catch(() => {});
  }, [open, email, prefillLoaded]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim()) { setError("Email is required"); setLoading(false); return; }
    if (!password.trim() || password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }

    const { error: signUpError } = await signUp(email, password);
    if (signUpError) {
      if (signUpError.toLowerCase().includes("already registered") || signUpError.toLowerCase().includes("already been registered")) {
        setError("This email is already registered. Please sign in instead.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(signUpError);
      }
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError("Account created! Please check your email to confirm, then sign in.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      setLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const currentSession = (await import("@/lib/supabase")).supabase;
    if (currentSession) {
      const { data: { session: freshSession } } = await currentSession.auth.getSession();
      if (freshSession?.access_token) {
        try {
          await fetch("/api/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${freshSession.access_token}`,
            },
            body: JSON.stringify({
              first_name: contactName.split(" ")[0] || "",
              last_name: contactName.split(" ").slice(1).join(" ") || "",
              email: email.trim(),
              user_type: "nonprofit_rep",
              consent_contact: true,
            }),
          });
        } catch {}
      }
    }

    setLoading(false);
    onOpenChange(false);
    onSuccess?.();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }

    const { error: loginError } = await signIn(email, password);
    if (loginError) {
      setError(loginError);
    } else {
      onOpenChange(false);
      onSuccess?.();
    }
    setLoading(false);
  };

  const resetState = () => {
    setError(null);
    setPassword("");
    setConfirmPassword("");
    setPrefillLoaded(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
        <DialogHeader className="pb-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-green-700" />
            </div>
            <DialogTitle className="text-lg font-heading text-primary">
              {mode === "signup" ? "Partner Account Setup" : "Partner Sign In"}
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === "signup"
              ? `Create your ${platform.name} account to access your Partner Dashboard.`
              : `Sign in to access your Partner Dashboard.`}
          </p>
        </DialogHeader>

        {mode === "signup" ? (
          <form onSubmit={handleSignup} className="space-y-3 mt-2">
            {error && (
              <div data-testid="text-partner-signup-error" className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
            )}

            {companyName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-green-800 uppercase tracking-wider">Your Partner Info</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {companyName && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-green-600 shrink-0" />
                      <span className="text-xs text-green-900 truncate">{companyName}</span>
                    </div>
                  )}
                  {contactName && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-green-600 shrink-0" />
                      <span className="text-xs text-green-900 truncate">{contactName}</span>
                    </div>
                  )}
                  {categoryName && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                      <span className="text-xs text-green-900 truncate">{categoryName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="partner-email" className="text-[11px]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  data-testid="input-partner-signup-email"
                  id="partner-email"
                  type="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setPrefillLoaded(false); }}
                  className="pl-8 h-9 text-sm"
                  autoComplete="email"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Use the same email from your partner application.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="partner-password" className="text-[11px]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    data-testid="input-partner-signup-password"
                    id="partner-password"
                    type={showPw ? "text" : "password"}
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-8 pr-8 h-9 text-sm"
                    autoComplete="new-password"
                  />
                  <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="partner-confirm-password" className="text-[11px]">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    data-testid="input-partner-signup-confirm"
                    id="partner-confirm-password"
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="Re-enter"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-8 pr-8 h-9 text-sm"
                    autoComplete="new-password"
                  />
                  <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                    {showConfirmPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button data-testid="button-partner-signup-submit" type="submit" className="w-full h-10 rounded-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              {loading ? "Creating Account..." : "Create Partner Account"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                data-testid="button-partner-switch-to-login"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={() => { setMode("login"); setError(null); }}
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3 mt-2">
            {error && (
              <div data-testid="text-partner-login-error" className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
            )}

            <div className="space-y-1">
              <Label htmlFor="partner-login-email" className="text-[11px]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  data-testid="input-partner-login-email"
                  id="partner-login-email"
                  type="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-8 h-9 text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="partner-login-password" className="text-[11px]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  data-testid="input-partner-login-password"
                  id="partner-login-password"
                  type={showPw ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-8 pr-8 h-9 text-sm"
                  autoComplete="current-password"
                />
                <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <Button data-testid="button-partner-login-submit" type="submit" className="w-full h-10 rounded-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                data-testid="button-partner-switch-to-signup"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={() => { setMode("signup"); setError(null); }}
              >
                Need to create an account? Sign up
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
