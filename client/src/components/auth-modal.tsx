import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail, Lock, UserPlus, LogIn, Phone, User, ChevronRight, ArrowLeft, MapPin, Shield } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { useSavedResources } from "@/lib/store";

const USER_TYPES = [
  { value: "veteran", label: "Veteran" },
  { value: "spouse_family", label: "Spouse / Family Member" },
  { value: "dependent", label: "Dependent" },
  { value: "caregiver_advocate", label: "Caregiver / Advocate" },
  { value: "other", label: "Other" },
];

const BRANCHES = [
  "Army", "Navy", "Air Force", "Marine Corps", "Coast Guard", "Space Force", "National Guard", "Reserves", "N/A",
];

const INTEREST_OPTIONS = [
  "Benefits & VA Claims",
  "Healthcare",
  "Mental Health",
  "Housing Support",
  "Employment",
  "Education & GI Bill",
  "Legal & Financial",
  "Family & Caregivers",
  "Crisis Help",
  "Transportation",
  "Food Assistance",
];

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultMode?: "login" | "signup";
}

export default function AuthModal({ open, onOpenChange, onSuccess, defaultMode }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode || "login");
  const [signupStep, setSignupStep] = useState(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("");
  const [consentContact, setConsentContact] = useState(false);

  const [branch, setBranch] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [userState, setUserState] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { signIn, signUp, session } = useAuth();
  const { setInterests, setLocation: setStoreLocation, completeOnboarding } = useSavedResources();

  useEffect(() => {
    if (defaultMode) setMode(defaultMode);
  }, [defaultMode]);

  const toggleInterest = (item: string) => {
    setSelectedInterests(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const saveProfile = async (step2Data?: { branch?: string; interests?: string[]; state?: string }) => {
    const token = session?.access_token;
    if (!token) return;

    const body: Record<string, any> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      user_type: userType,
      consent_contact: consentContact,
    };

    if (step2Data) {
      if (step2Data.branch) body.branch_of_service = step2Data.branch;
      if (step2Data.interests && step2Data.interests.length > 0) body.interests = step2Data.interests;
      if (step2Data.state) body.state = step2Data.state;
    }

    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.log("Profile save error:", err);
    }
  };

  const handleSignupStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!firstName.trim()) { setError("First name is required"); setLoading(false); return; }
    if (!lastName.trim()) { setError("Last name is required"); setLoading(false); return; }
    if (!email.trim()) { setError("Email is required"); setLoading(false); return; }
    if (!phone.trim()) { setError("Phone number is required"); setLoading(false); return; }
    if (!password.trim() || password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    if (!userType) { setError("Please select your user type"); setLoading(false); return; }
    if (!consentContact) { setError("Please agree to the contact consent to continue"); setLoading(false); return; }

    const { error: signUpError } = await signUp(email, password);
    if (signUpError) {
      setError(signUpError);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSignupStep(2);
  };

  const handleSignupStep1AndWaitForSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!firstName.trim()) { setError("First name is required"); setLoading(false); return; }
    if (!lastName.trim()) { setError("Last name is required"); setLoading(false); return; }
    if (!email.trim()) { setError("Email is required"); setLoading(false); return; }
    if (!phone.trim()) { setError("Phone number is required"); setLoading(false); return; }
    if (!password.trim() || password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    if (!userType) { setError("Please select your user type"); setLoading(false); return; }
    if (!consentContact) { setError("Please agree to the contact consent to continue"); setLoading(false); return; }

    const { error: signUpError } = await signUp(email, password);
    if (signUpError) {
      if (signUpError.toLowerCase().includes("already registered") || signUpError.toLowerCase().includes("already been registered")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(signUpError);
      }
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setSuccessMsg("Account created! Please check your email to confirm, then sign in.");
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
        const body: Record<string, any> = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          user_type: userType,
          consent_contact: consentContact,
        };
        try {
          const profileRes = await fetch("/api/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${freshSession.access_token}`,
            },
            body: JSON.stringify(body),
          });
          if (!profileRes.ok) {
            console.log("[profile] Step 1 save failed:", await profileRes.text());
          }
        } catch (err) {
          console.log("[profile] Step 1 save error:", err);
        }
      }
    }

    setLoading(false);
    setSignupStep(2);
  };

  const handleStep2Complete = async () => {
    setLoading(true);

    if (selectedInterests.length > 0) {
      setInterests(selectedInterests);
    }

    if (userState) {
      setStoreLocation(userState, "", "", "");
    }

    const currentSession = (await import("@/lib/supabase")).supabase;
    if (currentSession) {
      const { data: { session: freshSession } } = await currentSession.auth.getSession();
      if (freshSession?.access_token) {
        const body: Record<string, any> = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          user_type: userType,
          consent_contact: consentContact,
        };
        if (branch) body.branch_of_service = branch;
        if (selectedInterests.length > 0) body.interests = selectedInterests;
        if (userState) body.state = userState;
        try {
          const profileRes = await fetch("/api/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${freshSession.access_token}`,
            },
            body: JSON.stringify(body),
          });
          if (!profileRes.ok) {
            console.log("[profile] Step 2 save failed:", await profileRes.text());
          }
        } catch (err) {
          console.log("[profile] Step 2 save error:", err);
        }
      }
    }

    setLoading(false);
    completeOnboarding();
    onOpenChange(false);
    onSuccess?.();
  };

  const handleStep2Skip = () => {
    completeOnboarding();
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
      completeOnboarding();
      onOpenChange(false);
      onSuccess?.();
    }
    setLoading(false);
  };

  const resetState = () => {
    setError(null);
    setSuccessMsg(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setUserType("");
    setConsentContact(false);
    setBranch("");
    setSelectedInterests([]);
    setUserState("");
    setSignupStep(1);
  };

  const US_STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
    "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
    "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">

        {mode === "login" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading text-primary">Welcome Back</DialogTitle>
              <p className="text-sm text-muted-foreground">Sign in to your Veteran Care account.</p>
            </DialogHeader>

            <form onSubmit={handleLogin} className="space-y-4 mt-2">
              {error && (
                <div data-testid="text-auth-error" className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
              )}
              {successMsg && (
                <div data-testid="text-auth-success" className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{successMsg}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="auth-email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input data-testid="input-auth-email" id="auth-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" autoComplete="email" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-password" className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input data-testid="input-auth-password" id="auth-password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" autoComplete="current-password" />
                </div>
              </div>

              <Button data-testid="button-auth-submit" type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
                {loading ? "Please wait..." : "Sign In"}
              </Button>

              <div className="text-center">
                <button type="button" data-testid="button-auth-toggle" className="text-xs text-muted-foreground hover:text-primary transition-colors" onClick={() => { setMode("signup"); setSignupStep(1); setError(null); setSuccessMsg(null); }}>
                  Don't have an account? Create one
                </button>
              </div>
            </form>
          </>
        )}

        {mode === "signup" && signupStep === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading text-primary">Create Your Free Account</DialogTitle>
              <p className="text-sm text-muted-foreground">Join Veteran Care for a personalized experience.</p>
            </DialogHeader>

            <form onSubmit={handleSignupStep1AndWaitForSession} className="space-y-3 mt-2">
              {error && (
                <div data-testid="text-auth-error" className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-first" className="text-xs">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input data-testid="input-signup-first" id="signup-first" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-9" autoComplete="given-name" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-last" className="text-xs">Last Name *</Label>
                  <Input data-testid="input-signup-last" id="signup-last" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-email" className="text-xs">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input data-testid="input-signup-email" id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" autoComplete="email" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-phone" className="text-xs">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input data-testid="input-signup-phone" id="signup-phone" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" autoComplete="tel" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-password" className="text-xs">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input data-testid="input-signup-password" id="signup-password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" autoComplete="new-password" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="signup-confirm-password" className="text-xs">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input data-testid="input-signup-confirm-password" id="signup-confirm-password" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-9" autoComplete="new-password" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">I am a... *</Label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger data-testid="select-signup-user-type" className="w-full">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start space-x-2 pt-1">
                <Checkbox
                  id="signup-consent"
                  data-testid="checkbox-signup-consent"
                  checked={consentContact}
                  onCheckedChange={(checked) => setConsentContact(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="signup-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to be contacted by Veteran Care regarding services, support, resources, and opportunities.
                </Label>
              </div>

              <Button data-testid="button-signup-submit" type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                {loading ? "Creating Account..." : "Create Free Account"}
              </Button>

              <div className="text-center">
                <button type="button" data-testid="button-auth-toggle" className="text-xs text-muted-foreground hover:text-primary transition-colors" onClick={() => { setMode("login"); setError(null); setSuccessMsg(null); }}>
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </>
        )}

        {mode === "signup" && signupStep === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading text-primary">Personalize Your Experience</DialogTitle>
              <p className="text-sm text-muted-foreground">Help us connect you with the right resources. You can skip this and update later.</p>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label className="text-xs">Branch of Service</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger data-testid="select-signup-branch" className="w-full">
                    <SelectValue placeholder="Select branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">State / Location</Label>
                <Select value={userState} onValueChange={setUserState}>
                  <SelectTrigger data-testid="select-signup-state" className="w-full">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Select your state (optional)" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">What support are you looking for?</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {INTEREST_OPTIONS.map((item) => {
                    const isSelected = selectedInterests.includes(item);
                    return (
                      <div
                        key={item}
                        data-testid={`interest-signup-${item.toLowerCase().replace(/\s+/g, '-')}`}
                        className={`flex items-center space-x-2 border p-2 rounded-lg cursor-pointer transition-all ${
                          isSelected ? "bg-primary/10 border-primary/40 shadow-sm" : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleInterest(item)}
                      >
                        <Checkbox checked={isSelected} className="h-3.5 w-3.5 shrink-0" onCheckedChange={() => toggleInterest(item)} />
                        <Label className="cursor-pointer font-medium text-xs leading-tight">{item}</Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Button data-testid="button-signup-complete" className="w-full" onClick={handleStep2Complete} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                  {loading ? "Saving..." : "Continue to App"}
                </Button>
                <Button data-testid="button-signup-skip" variant="ghost" className="w-full text-sm text-muted-foreground" onClick={handleStep2Skip}>
                  Skip for now
                </Button>
              </div>
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
