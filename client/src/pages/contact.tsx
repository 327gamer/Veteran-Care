import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Send, CheckCircle2, Shield, MessageSquare,
  ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import MenuPageHero from "@/components/menu-page-hero";

// 10 high-value subjects — matches server allow-list.
const SUBJECT_OPTIONS = [
  "Partnership Inquiry",
  "Trusted Partner Application Support",
  "Media Request",
  "Legal Inquiry",
  "Government / Agency Collaboration",
  "Sponsorship Opportunity",
  "Report Incorrect Listing",
  "Technical Website Issue",
  "Billing / Subscription Issue",
  "Data / Privacy Request",
] as const;

// Subjects where the AI Navigator can typically resolve the matter instantly.
// When a user picks one of these, we surface a "Smart Support Gateway" before
// letting them submit the form. Architecture is also ready for future intake
// flows (refunds, password resets, account access) — see PLANNED_AI_TOPICS.
const AI_FIRST_SUBJECTS = new Set<string>([
  "Technical Website Issue",
  "Billing / Subscription Issue",
]);

// Reserved for upcoming AI-handled support flows.
// (Plumbing only — surfaced in copy when relevant.)
const PLANNED_AI_TOPICS = [
  "billing help",
  "subscription cancellation",
  "refund request intake",
  "technical troubleshooting",
  "account access help",
];

// Subjects that always require a human — never gated.
const HUMAN_REQUIRED_SUBJECTS = new Set<string>([
  "Media Request",
  "Legal Inquiry",
  "Government / Agency Collaboration",
  "Sponsorship Opportunity",
  "Partnership Inquiry",
]);

export default function Contact() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gatewayAcknowledged, setGatewayAcknowledged] = useState(false);

  useEffect(() => {
    document.title = "Contact Us | Veteran Care";
  }, []);

  const openNavigator = () => {
    window.dispatchEvent(new CustomEvent("open-ai-guide"));
  };

  const showGateway = AI_FIRST_SUBJECTS.has(subject) && !gatewayAcknowledged;
  const humanRequired = HUMAN_REQUIRED_SUBJECTS.has(subject);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ title: "Please complete all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, urgent }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Submission failed");
      }
      setSubmitted(true);
      toast({ title: "Message received", description: "We'll review and follow up if needed." });
    } catch (err: any) {
      toast({ title: "Could not send", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-full pb-24" data-testid="page-contact">
      <MenuPageHero
        testIdPrefix="contact"
        title={["Contact", "Veteran Care"]}
        subtitle="Get answers in seconds with our Veteran Navigator."
        detail="AI-first support, available 24/7. Human team standing by for partnership, media, legal, and other escalations."
      />

      {/* ── PRIMARY CTA (white) ── */}
      <section className="bg-white">
        <div className="container mx-auto px-5 pt-14 pb-14 max-w-3xl">
          <Card className="shadow-xl border-t-4 border-t-accent">
            <CardContent className="pt-9 pb-9 text-center">
              <div className="inline-flex h-16 w-16 rounded-full bg-primary/10 text-primary items-center justify-center mb-5">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-3">
                Talk to Our Veteran Navigator
              </h2>
              <p className="text-foreground/80 mb-7 max-w-xl mx-auto leading-relaxed">
                Ask anything — benefits, housing, jobs, healthcare, family support. Our Navigator
                answers instantly, points you to verified resources, and walks you through next steps.
              </p>
              <Button
                size="lg"
                onClick={openNavigator}
                className="text-base px-9 py-6 rounded-full shadow-md"
                data-testid="button-open-navigator"
              >
                <Sparkles className="mr-2 h-5 w-5" /> Ask Our Veteran Navigator Now
              </Button>
              <p className="text-xs text-muted-foreground mt-6">
                Available 24/7 · Instant · No login required
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── WHAT THE NAVIGATOR HANDLES (green) ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-5 py-14 max-w-4xl">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70 mb-2">Smart Support</p>
            <h3 className="font-heading text-2xl sm:text-3xl font-bold">
              What our Navigator can help with
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Finding resources by city, state, or near me",
              "Choosing the right category for your situation",
              "Understanding benefits and how to apply",
              "Connecting to housing, jobs, or healthcare programs",
              "Crisis line numbers and immediate support",
              "Caregiver, spouse, dependent, and survivor questions",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                data-testid={`text-nav-handles-${i}`}
              >
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-primary-foreground/95">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ESCALATION FORM (white) ── */}
      <section className="bg-white">
        <div className="container mx-auto px-5 py-14 max-w-3xl">
          <div className="text-center mb-7">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              For partners, media, agencies & special requests
            </p>
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
              Need to reach the team directly?
            </h3>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
              The form below is for partnership, media, legal, sponsorship, government, billing,
              or technical matters. Complex matters may be escalated for internal review.
            </p>
          </div>

          {!showForm && !submitted && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowForm(true)}
                data-testid="button-show-form"
                className="rounded-full"
                size="lg"
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Open the request form
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {submitted ? (
            <Card className="border-l-4 border-l-accent" data-testid="card-success">
              <CardContent className="pt-9 pb-9 text-center">
                <CheckCircle2 className="h-14 w-14 text-accent mx-auto mb-4" />
                <h2 className="font-heading text-2xl font-bold text-primary mb-2">Message received</h2>
                <p className="text-foreground/80 mb-1">
                  A confirmation was sent to <span className="font-semibold">{email}</span>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Complex matters may be escalated for internal review.
                </p>
              </CardContent>
            </Card>
          ) : showForm ? (
            <Card className="mt-2 shadow-md">
              <CardContent className="pt-7 pb-7">
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-name">Name</Label>
                      <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-name" required />
                    </div>
                    <div>
                      <Label htmlFor="contact-email">Email</Label>
                      <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-email" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contact-subject">Inquiry type</Label>
                    <select
                      id="contact-subject"
                      value={subject}
                      onChange={(e) => { setSubject(e.target.value); setGatewayAcknowledged(false); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-testid="select-subject"
                    >
                      {SUBJECT_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── SMART SUPPORT GATEWAY ── */}
                  {showGateway && (
                    <div
                      className="rounded-xl border border-accent/40 bg-accent/5 p-5"
                      data-testid="card-smart-gateway"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="h-9 w-9 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-heading font-bold text-primary leading-snug mb-1">
                            Our Veteran Navigator can solve most issues instantly.
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Try the Navigator first — it handles the majority of billing,
                            subscription, and technical questions in seconds.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          onClick={openNavigator}
                          className="flex-1 rounded-full"
                          data-testid="button-gateway-navigator"
                        >
                          <Sparkles className="mr-2 h-4 w-4" /> Open Navigator
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setGatewayAcknowledged(true)}
                          className="flex-1 rounded-full"
                          data-testid="button-gateway-still-contact"
                        >
                          Still contact team
                        </Button>
                      </div>
                    </div>
                  )}

                  {!showGateway && (
                    <>
                      <div>
                        <Label htmlFor="contact-message">Message</Label>
                        <Textarea
                          id="contact-message"
                          rows={6}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Briefly describe your inquiry…"
                          data-testid="input-message"
                          required
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer" data-testid="check-urgent-label">
                        <Checkbox checked={urgent} onCheckedChange={(v) => setUrgent(!!v)} data-testid="check-urgent" />
                        <span>This is time-sensitive</span>
                      </label>
                      <Button type="submit" size="lg" className="w-full" disabled={submitting} data-testid="button-submit">
                        {submitting ? "Sending…" : (<><Send className="mr-2 h-4 w-4" /> Send request</>)}
                      </Button>
                      {humanRequired && (
                        <p className="text-xs text-center text-accent/90 font-medium" data-testid="text-human-routing">
                          This inquiry type is always routed to our team — no AI gating.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center"
                        data-testid="button-hide-form"
                      >
                        <ChevronUp className="h-3 w-3 mr-1" /> Hide form
                      </button>
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-3 border-t border-border">
                        <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>
                          Goes to <span className="font-mono">info@VeteranCare.com</span>. Please
                          do not include Social Security numbers, VA file or claim numbers, or
                          other sensitive identifiers in this form.
                        </span>
                      </p>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
