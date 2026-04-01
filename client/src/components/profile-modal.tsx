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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Shield, Save, UserCircle, Trash2, Check, ChevronsUpDown } from "lucide-react";
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

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { session, signOut } = useAuth();
  const { clearAuthState } = useSavedResources();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

  const [stateOpen, setStateOpen] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && session?.access_token) {
      loadProfile();
    }
  }, [open, session?.access_token]);

  const loadProfile = async () => {
    if (!session?.access_token) return;
    setFetchLoading(true);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const { profile } = await res.json();
      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
        setUserType(profile.user_type || "");
        setConsentContact(profile.consent_contact || false);
        setBranch(profile.branch_of_service || "");
        setServiceEra(profile.service_era || "");
        setRank(profile.rank || "");
        setMos(profile.mos || "");
        setDeploymentBackground(profile.service_area || "");
        setPreferredContact(profile.preferred_contact_method || "");
        setUserState(profile.state || "");
        setUserCity(profile.city || "");
        setUserZip(profile.zip || "");
        setSelectedInterests(profile.interests || []);
      }
    } catch (err) {
      setError("Could not load your profile. Please try again.");
    }
    setFetchLoading(false);
  };

  const toggleInterest = (item: string) => {
    setSelectedInterests(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    if (!session?.access_token) return;
    setError(null);
    setSaveMsg(null);
    setSaving(true);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError("First name, last name, email, and phone are required.");
      setSaving(false);
      return;
    }

    const body: Record<string, any> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      user_type: userType || "veteran",
      consent_contact: consentContact,
      branch_of_service: branch || null,
      service_era: serviceEra || null,
      rank: rank.trim() || null,
      mos: mos.trim() || null,
      service_area: deploymentBackground.trim() || null,
      preferred_contact_method: preferredContact || null,
      state: userState || null,
      city: userCity.trim() || null,
      zip: userZip.trim() || null,
      interests: selectedInterests,
    };

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      setSaveMsg("Profile saved successfully.");
    } catch (err: any) {
      setError(err.message || "Could not save profile. Please try again.");
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!session?.access_token) return;
    setDeleting(true);
    setError(null);
    setSaveMsg(null);

    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Deletion failed");
      }
      await signOut();
      clearAuthState();
      onOpenChange(false);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Could not delete account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading text-primary flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            My Profile
          </DialogTitle>
          <div className="flex items-center gap-1.5 mt-1">
            <Shield className="h-3.5 w-3.5 text-primary/60" />
            <p className="text-xs text-primary/60 font-medium">Your information is private and confidential.</p>
          </div>
        </DialogHeader>

        {fetchLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading your profile...</span>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {(() => {
              const fields = [
                { filled: !!firstName.trim(), required: true },
                { filled: !!lastName.trim(), required: true },
                { filled: !!email.trim(), required: true },
                { filled: !!phone.trim(), required: true },
                { filled: !!userType, required: true },
                { filled: consentContact, required: true },
                { filled: !!branch, required: false },
                { filled: !!serviceEra, required: false },
                { filled: !!rank.trim(), required: false },
                { filled: !!mos.trim(), required: false },
                { filled: !!deploymentBackground.trim(), required: false },
                { filled: !!preferredContact, required: false },
                { filled: !!userState, required: false },
                { filled: !!userCity.trim(), required: false },
                { filled: !!userZip.trim(), required: false },
                { filled: selectedInterests.length > 0, required: false },
              ];
              const completed = fields.filter(f => f.filled).length;
              const pct = Math.round((completed / fields.length) * 100);
              const isComplete = pct === 100;

              return (
                <div data-testid="profile-completion" className={`rounded-lg p-3 ${isComplete ? "bg-green-50 border border-green-200" : "bg-primary/5 border border-primary/10"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-semibold ${isComplete ? "text-green-700" : "text-primary"}`}>
                      Profile Completion: {pct}%
                    </span>
                    <span className="text-xs text-muted-foreground">{completed}/{fields.length} fields</span>
                  </div>
                  <Progress value={pct} className="h-2 mb-1.5" />
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {isComplete
                      ? "Your profile is complete. You'll receive the most personalized recommendations and support."
                      : "Complete your profile for better recommendations and personalized support."}
                  </p>
                </div>
              );
            })()}

            {error && (
              <div data-testid="text-profile-error" className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
            )}
            {saveMsg && (
              <div data-testid="text-profile-success" className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{saveMsg}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">First Name *</Label>
                <Input data-testid="input-profile-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name *</Label>
                <Input data-testid="input-profile-last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input data-testid="input-profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Phone *</Label>
              <Input data-testid="input-profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">I am a...</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger data-testid="select-profile-user-type" className="w-full">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {USER_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="profile-consent"
                data-testid="checkbox-profile-consent"
                checked={consentContact}
                onCheckedChange={(checked) => setConsentContact(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="profile-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                {t(platform.consentText)}
              </Label>
            </div>

            <div className="border-t pt-3 mt-1">
              <p className="text-xs font-semibold text-primary mb-0.5">Optional — Personalization</p>
              <p className="text-[10px] text-muted-foreground mb-3">Update anytime for better recommendations.</p>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Branch of Service</Label>
                    <Select value={branch} onValueChange={setBranch}>
                      <SelectTrigger data-testid="select-profile-branch" className="w-full">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent className="z-[200]">
                        {BRANCHES.map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Service Era</Label>
                    <Select value={serviceEra} onValueChange={setServiceEra}>
                      <SelectTrigger data-testid="select-profile-era" className="w-full">
                        <SelectValue placeholder="Select era" />
                      </SelectTrigger>
                      <SelectContent className="z-[200]">
                        {SERVICE_ERAS.map(e => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Rank</Label>
                      <button type="button" className="text-[10px] text-primary hover:underline" onClick={() => setRank("N/A / Not Applicable")} data-testid="button-profile-rank-na">N/A</button>
                    </div>
                    <Input data-testid="input-profile-rank" value={rank} onChange={(e) => setRank(e.target.value)} placeholder="e.g. SGT, CPL" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">MOS / Specialty</Label>
                      <button type="button" className="text-[10px] text-primary hover:underline" onClick={() => setMos("N/A / Not Applicable")} data-testid="button-profile-mos-na">N/A</button>
                    </div>
                    <Input data-testid="input-profile-mos" value={mos} onChange={(e) => setMos(e.target.value)} placeholder="e.g. 11B, 68W" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Deployment / Operational Background</Label>
                    <button type="button" className="text-[10px] text-primary hover:underline" onClick={() => setDeploymentBackground("N/A / Not Applicable")} data-testid="button-profile-deployment-na">N/A</button>
                  </div>
                  <Input data-testid="input-profile-deployment" value={deploymentBackground} onChange={(e) => setDeploymentBackground(e.target.value)} placeholder="e.g. OEF, OIF, OND" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Preferred Contact Method</Label>
                  <Select value={preferredContact} onValueChange={setPreferredContact}>
                    <SelectTrigger data-testid="select-profile-contact-method" className="w-full">
                      <SelectValue placeholder="How should we reach you?" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      {CONTACT_METHODS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">State</Label>
                    <Popover open={stateOpen} onOpenChange={setStateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={stateOpen} className="w-full justify-between font-normal h-9 px-3 text-sm" data-testid="select-profile-state">
                          {userState || <span className="text-muted-foreground">State</span>}
                          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 z-[200]" align="start">
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
                  <div className="space-y-1">
                    <Label className="text-xs">City</Label>
                    <Input data-testid="input-profile-city" value={userCity} onChange={(e) => setUserCity(e.target.value)} placeholder="City" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ZIP</Label>
                    <Input data-testid="input-profile-zip" value={userZip} onChange={(e) => setUserZip(e.target.value)} placeholder="ZIP" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Areas of Interest / Support Needs</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {INTEREST_OPTIONS.map((item) => {
                      const isSelected = selectedInterests.includes(item);
                      return (
                        <div
                          key={item}
                          data-testid={`interest-profile-${item.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`flex items-center space-x-2 border p-2 rounded-lg cursor-pointer transition-all ${
                            isSelected ? "bg-primary/10 border-primary/40 shadow-sm" : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleInterest(item)}
                        >
                          <Checkbox checked={isSelected} className="h-3.5 w-3.5 shrink-0 pointer-events-none" />
                          <Label className="cursor-pointer font-medium text-xs leading-tight">{item}</Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <Button data-testid="button-profile-save" className="w-full" onClick={handleSave} disabled={saving || deleting}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save Profile"}
            </Button>

            <div className="border-t pt-4 mt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    data-testid="button-delete-account"
                    variant="outline"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    {deleting ? "Deleting Account..." : "Delete Account"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your profile information, saved resources, and account access will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      data-testid="button-delete-confirm"
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Delete My Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
