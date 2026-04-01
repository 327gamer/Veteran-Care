import { useState, useEffect } from "react";
import { platform, t } from "@shared/platform";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Mail, Lock, UserPlus, LogIn, Phone, User, Shield, Eye, EyeOff, Check, ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { useSavedResources } from "@/lib/store";

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"Washington DC",
};

const USER_TYPES = [
  { value: "veteran", label: "Veteran" },
  { value: "spouse_family", label: "Spouse / Family Member" },
  { value: "dependent", label: "Dependent" },
  { value: "caregiver_advocate", label: "Caregiver / Advocate" },
  { value: "case_manager", label: "Case Manager" },
  { value: "social_worker", label: "Social Worker" },
  { value: "nonprofit_rep", label: "Nonprofit / Organization Rep" },
  { value: "vso_advocate", label: "VSO / Advocate" },
  { value: "government_staff", label: "Government / Agency Staff" },
  { value: "church_ministry", label: "Church / Ministry Rep" },
  { value: "other", label: "Other" },
];

const BRANCHES = [
  "Army", "Navy", "Air Force", "Marine Corps", "Coast Guard", "Space Force", "National Guard", "Reserves", "N/A / Not Applicable",
];

const SERVICE_ERAS = [
  "Post-9/11 (2001–present)",
  "Gulf War (1990–2001)",
  "Vietnam (1964–1975)",
  "Korean War (1950–1953)",
  "Peacetime",
  "Other",
  "N/A / Not Applicable",
];

const CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text Message" },
  { value: "any", label: "Any Method" },
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

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultMode?: "login" | "signup";
}

export default function AuthModal({ open, onOpenChange, onSuccess, defaultMode }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode || "login");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("");
  const [consentContact, setConsentContact] = useState(false);

  const [branch, setBranch] = useState("");
  const [serviceEra, setServiceEra] = useState("");
  const [rank, setRank] = useState("");
  const [mos, setMos] = useState("");
  const [deploymentBackground, setDeploymentBackground] = useState("");
  const [preferredContact, setPreferredContact] = useState("");
  const [userState, setUserState] = useState("");
  const [userCity, setUserCity] = useState("");
  const [userZip, setUserZip] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { signIn, signUp, session } = useAuth();
  const { setInterests, setLocation: setStoreLocation, completeOnboarding, setServiceProfile } = useSavedResources();

  useEffect(() => {
    if (defaultMode) setMode(defaultMode);
  }, [defaultMode]);

  const toggleInterest = (item: string) => {
    setSelectedInterests(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
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

        if (branch) body.branch_of_service = branch;
        if (serviceEra) body.service_era = serviceEra;
        if (rank.trim()) body.rank = rank.trim();
        if (mos.trim()) body.mos = mos.trim();
        if (deploymentBackground.trim()) body.service_area = deploymentBackground.trim();
        if (preferredContact) body.preferred_contact_method = preferredContact;
        if (userState) body.state = userState;
        if (userCity.trim()) body.city = userCity.trim();
        if (userZip.trim()) body.zip = userZip.trim();
        if (selectedInterests.length > 0) body.interests = selectedInterests;

        try {
          await fetch("/api/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${freshSession.access_token}`,
            },
            body: JSON.stringify(body),
          });
        } catch (err) {
        }
      }
    }

    if (selectedInterests.length > 0) setInterests(selectedInterests);
    if (userState) setStoreLocation(userState, "", userCity.trim(), userZip.trim());
    if (branch || serviceEra || rank.trim() || mos.trim()) {
      setServiceProfile({ branch, era: serviceEra, rank: rank.trim(), mos: mos.trim() });
    }

    setLoading(false);
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
    setServiceEra("");
    setRank("");
    setMos("");
    setDeploymentBackground("");
    setPreferredContact("");
    setSelectedInterests([]);
    setUserState("");
    setUserCity("");
    setUserZip("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>

        {mode === "login" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading text-primary">Welcome Back</DialogTitle>
              <p className="text-sm text-muted-foreground">Sign in to your {platform.name} account.</p>
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
                  <Input data-testid="input-auth-password" id="auth-password" type={showLoginPw ? "text" : "password"} placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9" autoComplete="current-password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowLoginPw(!showLoginPw)} data-testid="button-toggle-login-pw">
                    {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button data-testid="button-auth-submit" type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
                {loading ? "Please wait..." : "Sign In"}
              </Button>

              <div className="text-center">
                <button type="button" data-testid="button-auth-toggle" className="text-xs text-muted-foreground hover:text-primary transition-colors" onClick={() => { setMode("signup"); setError(null); setSuccessMsg(null); }}>
                  Don't have an account? Create one
                </button>
              </div>
            </form>
          </>
        )}

        {mode === "signup" && (
          <>
            <DialogHeader className="pb-0">
              <DialogTitle className="text-lg font-heading text-primary">Create Your Profile</DialogTitle>
              <p className="text-xs text-muted-foreground">Personalized support starts here.</p>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-primary/60" />
                <p className="text-[11px] text-primary/60 font-medium">Private and confidential.</p>
              </div>
            </DialogHeader>

            <form onSubmit={handleSignup} className="space-y-2.5 mt-1">
              {error && (
                <div data-testid="text-auth-error" className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-1.5">{error}</div>
              )}

              <div className="text-center">
                <button type="button" data-testid="button-auth-toggle-top" className="text-[11px] text-muted-foreground hover:text-primary transition-colors" onClick={() => { setMode("login"); setError(null); setSuccessMsg(null); }}>
                  Already have an account? Sign in
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label htmlFor="signup-first" className="text-[11px]">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input data-testid="input-signup-first" id="signup-first" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-8 h-9 text-sm" autoComplete="given-name" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="signup-last" className="text-[11px]">Last Name *</Label>
                  <Input data-testid="input-signup-last" id="signup-last" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-9 text-sm" autoComplete="family-name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label htmlFor="signup-email" className="text-[11px]">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input data-testid="input-signup-email" id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-8 h-9 text-sm" autoComplete="email" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="signup-phone" className="text-[11px]">Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input data-testid="input-signup-phone" id="signup-phone" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-8 h-9 text-sm" autoComplete="tel" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label htmlFor="signup-password" className="text-[11px]">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input data-testid="input-signup-password" id="signup-password" type={showSignupPw ? "text" : "password"} placeholder="Min 6 chars" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-8 pr-8 h-9 text-sm" autoComplete="new-password" />
                    <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowSignupPw(!showSignupPw)} data-testid="button-toggle-signup-pw">
                      {showSignupPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="signup-confirm-password" className="text-[11px]">Confirm *</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input data-testid="input-signup-confirm-password" id="signup-confirm-password" type={showConfirmPw ? "text" : "password"} placeholder="Re-enter" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-8 pr-8 h-9 text-sm" autoComplete="new-password" />
                    <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPw(!showConfirmPw)} data-testid="button-toggle-confirm-pw">
                      {showConfirmPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-0.5">
                <Label className="text-[11px]">I am a... *</Label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger data-testid="select-signup-user-type" className="w-full h-9 text-sm">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-2.5">
                <p className="text-[11px] font-semibold text-primary mb-0.5">Optional — Better personalization</p>
                <p className="text-[10px] text-muted-foreground mb-2">Fill out as much or as little as you'd like.</p>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <Label className="text-[11px]">Branch of Service</Label>
                      <Select value={branch} onValueChange={setBranch}>
                        <SelectTrigger data-testid="select-signup-branch" className="w-full h-9 text-sm">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRANCHES.map(b => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[11px]">Service Era</Label>
                      <Select value={serviceEra} onValueChange={setServiceEra}>
                        <SelectTrigger data-testid="select-signup-era" className="w-full h-9 text-sm">
                          <SelectValue placeholder="Select era" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_ERAS.map(e => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signup-rank" className="text-[11px]">Rank</Label>
                        <button type="button" className="text-[10px] text-primary hover:underline" onClick={() => setRank("N/A / Not Applicable")} data-testid="button-rank-na">N/A</button>
                      </div>
                      <Input data-testid="input-signup-rank" id="signup-rank" placeholder="e.g. SGT, CPL" value={rank} onChange={(e) => setRank(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signup-mos" className="text-[11px]">MOS / Specialty</Label>
                        <button type="button" className="text-[10px] text-primary hover:underline" onClick={() => setMos("N/A / Not Applicable")} data-testid="button-mos-na">N/A</button>
                      </div>
                      <Input data-testid="input-signup-mos" id="signup-mos" placeholder="e.g. 11B, 68W" value={mos} onChange={(e) => setMos(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signup-deployment" className="text-[11px]">Deployment Background</Label>
                      <button type="button" className="text-[10px] text-primary hover:underline" onClick={() => setDeploymentBackground("N/A / Not Applicable")} data-testid="button-deployment-na">N/A</button>
                    </div>
                    <Input data-testid="input-signup-deployment" id="signup-deployment" placeholder="e.g. OEF, OIF, OND" value={deploymentBackground} onChange={(e) => setDeploymentBackground(e.target.value)} className="h-9 text-sm" />
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-[11px]">Preferred Contact</Label>
                    <Select value={preferredContact} onValueChange={setPreferredContact}>
                      <SelectTrigger data-testid="select-signup-contact-method" className="w-full h-9 text-sm">
                        <SelectValue placeholder="How should we reach you?" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_METHODS.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="space-y-0.5">
                      <Label className="text-[11px]">State</Label>
                      <Popover open={stateOpen} onOpenChange={setStateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={stateOpen} className="w-full justify-between font-normal h-9 px-2 text-sm" data-testid="select-signup-state">
                            {userState || <span className="text-muted-foreground">State</span>}
                            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search state..." />
                            <CommandList>
                              <CommandEmpty>No state found.</CommandEmpty>
                              <CommandGroup>
                                {US_STATES.map(s => (
                                  <CommandItem key={s} value={`${s} ${STATE_NAMES[s] || ""}`} onSelect={() => { setUserState(s); setStateOpen(false); }}>
                                    <Check className={`mr-2 h-3 w-3 ${userState === s ? "opacity-100" : "opacity-0"}`} />
                                    {s} — {STATE_NAMES[s] || s}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="signup-city" className="text-[11px]">City</Label>
                      <Input data-testid="input-signup-city" id="signup-city" placeholder="City" value={userCity} onChange={(e) => setUserCity(e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="signup-zip" className="text-[11px]">ZIP</Label>
                      <Input data-testid="input-signup-zip" id="signup-zip" placeholder="ZIP" value={userZip} onChange={(e) => setUserZip(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Areas of Interest</Label>
                    <div className="grid grid-cols-2 gap-1">
                      {INTEREST_OPTIONS.map((item) => {
                        const isSelected = selectedInterests.includes(item);
                        return (
                          <div
                            key={item}
                            data-testid={`interest-signup-${item.toLowerCase().replace(/\s+/g, '-')}`}
                            className={`flex items-center space-x-1.5 border px-2 py-1.5 rounded-md cursor-pointer transition-all ${
                              isSelected ? "bg-primary/10 border-primary/40 shadow-sm" : "hover:bg-muted/50"
                            }`}
                            onClick={() => toggleInterest(item)}
                          >
                            <Checkbox checked={isSelected} className="h-3 w-3 shrink-0 pointer-events-none" />
                            <Label className="cursor-pointer font-medium text-[11px] leading-tight">{item}</Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-1">
                <Checkbox
                  id="signup-consent"
                  data-testid="checkbox-signup-consent"
                  checked={consentContact}
                  onCheckedChange={(checked) => setConsentContact(checked === true)}
                  className="mt-0.5 h-3.5 w-3.5"
                />
                <Label htmlFor="signup-consent" className="text-[11px] text-muted-foreground leading-relaxed cursor-pointer">
                  {t(platform.consentText)}
                </Label>
              </div>

              <div className="pt-1 pb-2">
                <Button data-testid="button-signup-submit" type="submit" className="w-full h-11 text-sm font-bold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  {loading ? "Creating Account..." : "Create Free Account"}
                </Button>
              </div>

              <div className="text-center pb-4">
                <button type="button" data-testid="button-auth-toggle" className="text-[11px] text-muted-foreground hover:text-primary transition-colors" onClick={() => { setMode("login"); setError(null); setSuccessMsg(null); }}>
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
