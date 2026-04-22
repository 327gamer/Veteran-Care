import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, CheckCircle2, Sparkles, Shield } from "lucide-react";

const SUBJECT_OPTIONS = [
  "General question",
  "Help finding a resource",
  "Trusted partner inquiry",
  "Case manager / professional",
  "Media / press",
  "Partnership opportunity",
  "Technical issue",
  "Other",
];

export default function Contact() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Contact Us | Veteran Care";
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ title: "Please fill out all fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Submission failed");
      }
      setSubmitted(true);
      toast({ title: "Message received", description: "We'll be in touch shortly." });
    } catch (err: any) {
      toast({ title: "Could not send", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-contact">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12 sm:py-16 max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70 mb-2">Contact us</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4" data-testid="text-contact-title">
            We're here to help
          </h1>
          <p className="text-lg text-primary-foreground/90 leading-relaxed">
            Send us a note. The AI Navigator answers most messages within minutes; complex matters route to our team.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-3xl">
        {submitted ? (
          <Card className="border-l-4 border-l-accent" data-testid="card-success">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold text-primary mb-3">Message received</h2>
              <p className="text-foreground/80 mb-2">We sent a confirmation to <span className="font-semibold">{email}</span>.</p>
              <p className="text-sm text-muted-foreground">Most questions get an answer from the AI Navigator within minutes. If your message needs a person, our team will follow up directly.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
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
                  <Label htmlFor="contact-subject">Subject</Label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                    placeholder="Tell us what you need…"
                    data-testid="input-message"
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={submitting} data-testid="button-submit">
                  {submitting ? "Sending…" : (<><Send className="mr-2 h-4 w-4" /> Send message</>)}
                </Button>
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Your message goes to <span className="font-mono">info@VeteranCare.com</span>. We never share your details.
                    Please do not include Social Security numbers, VA file/claim numbers, or other sensitive identifiers in this form.
                  </span>
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* What to expect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <Sparkles className="h-6 w-6 text-accent mb-2" />
              <h3 className="font-heading font-semibold text-primary mb-1">AI Navigator answers first</h3>
              <p className="text-sm text-muted-foreground">For resource questions, navigation help, or general support, the Navigator usually replies within minutes.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Mail className="h-6 w-6 text-accent mb-2" />
              <h3 className="font-heading font-semibold text-primary mb-1">A person follows up when needed</h3>
              <p className="text-sm text-muted-foreground">Urgent matters, partnerships, media, legal, and critical veteran concerns are routed directly to our team.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
