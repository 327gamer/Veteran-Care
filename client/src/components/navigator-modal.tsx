
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSavedResources } from "@/lib/store";

interface NavigatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NavigatorModal({ open, onOpenChange }: NavigatorModalProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    veteran_name: "",
    veteran_phone: "",
    veteran_email: "",
    message: "",
    preferred_contact: "either",
  });

  const resetForm = () => {
    setForm({ veteran_name: "", veteran_phone: "", veteran_email: "", message: "", preferred_contact: "either" });
    setSubmitted(false);
    setError("");
    setSubmitting(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const loc = useSavedResources.getState().userLocation;
      const res = await fetch("/api/navigator-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_id: null,
          resource_title: null,
          veteran_name: form.veteran_name,
          veteran_phone: form.veteran_phone || null,
          veteran_email: form.veteran_email || null,
          message: form.message || null,
          preferred_contact: form.preferred_contact,
          user_state: loc.stateCode || null,
          user_city: loc.city || null,
          user_zip: loc.zip || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
      toast({ description: "Request submitted! A navigator will contact you soon.", duration: 4000 });
    } catch (err: any) {
      const msg = err.message?.toLowerCase().includes("relation") || err.message?.toLowerCase().includes("does not exist")
        ? "Navigator system is being enabled — please try again shortly."
        : err.message;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Request a Navigator
          </DialogTitle>
          <DialogDescription>
            A Veteran Care Navigator can help you find benefits, apply for programs, and follow up — for free.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex items-center gap-3 py-4 animate-in fade-in duration-300">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-green-700">Request Submitted</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                A Veteran Care Navigator will reach out to you soon.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Your Name *</Label>
              <Input
                data-testid="input-nav-modal-name"
                className="h-9 text-sm"
                placeholder="Full name"
                value={form.veteran_name}
                onChange={(e) => setForm(p => ({ ...p, veteran_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input
                  data-testid="input-nav-modal-phone"
                  className="h-9 text-sm"
                  placeholder="(555) 123-4567"
                  value={form.veteran_phone}
                  onChange={(e) => setForm(p => ({ ...p, veteran_phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  data-testid="input-nav-modal-email"
                  className="h-9 text-sm"
                  type="email"
                  placeholder="you@email.com"
                  value={form.veteran_email}
                  onChange={(e) => setForm(p => ({ ...p, veteran_email: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Phone or email required so a navigator can reach you.</p>
            <div className="space-y-1">
              <Label className="text-xs">How should we contact you?</Label>
              <Select
                value={form.preferred_contact}
                onValueChange={(v) => setForm(p => ({ ...p, preferred_contact: v }))}
              >
                <SelectTrigger data-testid="select-nav-modal-contact" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="either">Either is fine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">What do you need help with? (optional)</Label>
              <Textarea
                data-testid="input-nav-modal-message"
                className="text-sm min-h-[70px]"
                placeholder="Tell us how we can help..."
                rows={3}
                value={form.message}
                onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button
              data-testid="button-submit-nav-modal"
              className="w-full h-10"
              disabled={submitting || !form.veteran_name.trim() || (!form.veteran_phone.trim() && !form.veteran_email.trim())}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
