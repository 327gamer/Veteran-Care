import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Send, CheckCircle2, Shield, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

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
];

export default function Contact() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Contact Us | Veteran Care";
  }, []);

  const openNavigator = () => {
    window.dispatchEvent(new CustomEvent("open-ai-guide"));
  };

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
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-5 py-14 sm:py-20 max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70 mb-3">Contact</p>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold mb-4 leading-tight" data-testid="text-contact-title">
            Get answers in seconds with the Veteran Navigator
          </h1>
          <p className="text-base sm:text-lg text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
            The Navigator is our AI-first support engine. It guides you through your question and connects you to the right resource, partner, or page.
          </p>
        </div>
      </section>

      {/* Primary AI-first CTA */}
      <section className="container mx-auto px-5 -mt-10 max-w-3xl relative z-10">
        <Card className="shadow-lg border-t-4 border-t-accent">
          <CardContent className="pt-7 pb-7 text-center">
            <div className="inline-flex h-14 w-14 rounded-full bg-primary/10 text-primary items-center justify-center mb-4">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-3">
              Talk to Veteran Navigator now
            </h2>
            <p className="text-foreground/80 mb-6 max-w-xl mx-auto leading-relaxed">
              Ask anything — benefits, housing, jobs, healthcare, family support. The Navigator answers instantly, points you to verified resources, and walks you through next steps.
            </p>
            <Button
              size="lg"
              onClick={openNavigator}
              className="text-base px-8 py-6 rounded-full shadow-md"
              data-testid="button-open-navigator"
            >
              <Sparkles className="mr-2 h-5 w-5" /> Talk to Veteran Navigator
            </Button>
            <p className="text-xs text-muted-foreground mt-5">Available 24/7 · Instant · No login required</p>
          </CardContent>
        </Card>
      </section>

      {/* What the Navigator handles */}
      <section className="container mx-auto px-5 py-12 max-w-3xl">
        <h3 className="font-heading text-xl sm:text-2xl font-bold text-primary mb-5 text-center">What the Navigator can help with</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "Finding resources by city, state, or near me",
            "Choosing the right category for your situation",
            "Understanding benefits and how to apply",
            "Connecting to housing, jobs, or healthcare programs",
            "Crisis line numbers and immediate support",
            "Caregiver, spouse, dependent, and survivor questions",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30" data-testid={`text-nav-handles-${i}`}>
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/85">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Escalation form (collapsed by default) */}
      <section className="container mx-auto px-5 pb-12 max-w-3xl">
        <div className="border-t border-border pt-10">
          <div className="text-center mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">For partners, media, agencies & special requests</p>
            <h3 className="font-heading text-xl sm:text-2xl font-bold text-primary">
              Need to reach the team directly?
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              The form below is for partnership, media, legal, sponsorship, government, billing, or technical matters. Complex matters may be escalated for internal review.
            </p>
          </div>

          {!showForm && !submitted && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowForm(true)}
                data-testid="button-show-form"
                className="rounded-full"
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Open the request form
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {submitted ? (
            <Card className="border-l-4 border-l-accent" data-testid="card-success">
              <CardContent className="pt-7 pb-7 text-center">
                <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-4" />
                <h2 className="font-heading text-2xl font-bold text-primary mb-2">Message received</h2>
                <p className="text-foreground/80 mb-1">A confirmation was sent to <span className="font-semibold">{email}</span>.</p>
                <p className="text-sm text-muted-foreground">Complex matters may be escalated for internal review.</p>
              </CardContent>
            </Card>
          ) : showForm ? (
            <Card className="mt-2">
              <CardContent className="pt-6">
                <form onSubmit={submit} className="space-y-4">
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
                      onChange={(e) => setSubject(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-testid="select-subject"
                    >
                      {SUBJECT_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
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
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center"
                    data-testid="button-hide-form"
                  >
                    <ChevronUp className="h-3 w-3 mr-1" /> Hide form
                  </button>
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-2 border-t border-border">
                    <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      Goes to <span className="font-mono">info@VeteranCare.com</span>. Please do not include Social Security numbers, VA file or claim numbers, or other sensitive identifiers in this form.
                    </span>
                  </p>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
