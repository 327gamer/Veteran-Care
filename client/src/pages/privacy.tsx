import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

const EFFECTIVE_DATE = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy | Veteran Care";
  }, []);

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-privacy">
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-5 py-12 sm:py-16 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70 mb-2">Legal</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
          <p className="text-primary-foreground/80 text-sm mt-3">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </section>
      <section className="container mx-auto px-5 py-10 max-w-3xl">
        <Card>
          <CardContent className="pt-7 pb-7 prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-primary prose-h3:mt-7 prose-h3:mb-2 prose-p:leading-relaxed">
            <p>Veteran Care ("we", "us") respects your privacy. This page summarizes how we handle information when you use our platform.</p>

            <h3>What we collect</h3>
            <p>Basic usage data (pages visited, search queries), optional account information you provide (name, email), and optional location data you choose to share to power "near me" search.</p>

            <h3>How we use it</h3>
            <p>To match you with relevant resources, improve the platform, route partner leads when you've asked us to, send transactional and opt-in updates, and respond to support requests.</p>

            <h3>What we don't do</h3>
            <p>We do not sell personal data. We do not share your contact details with third parties without your consent.</p>

            <h3>Email preferences</h3>
            <p>Every non-transactional email includes a one-click unsubscribe link and a preferences page where you can choose which categories you receive (replies, resource updates, partner opportunities, product announcements, billing notices). You can also opt out of everything from <Link href="/unsubscribe" className="text-primary underline">our preferences page</Link>.</p>

            <h3>Future regional compliance</h3>
            <p>This summary will be expanded with jurisdiction-specific provisions (including GDPR for EU visitors and CCPA/CPRA for California residents) as the platform grows.</p>

            <h3>Crisis support</h3>
            <p>If you or someone you know is in crisis, call or text the Veterans Crisis Line at <span className="font-mono font-semibold">988, then press 1</span>.</p>

            <h3>Contact</h3>
            <p>For privacy questions, write to <span className="font-mono">info@VeteranCare.com</span>.</p>
          </CardContent>
        </Card>

        <nav className="mt-6 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 justify-center" data-testid="nav-legal-footer">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Link href="/terms" className="hover:text-primary">Terms of Use</Link>
          <Link href="/contact" className="hover:text-primary">Contact</Link>
          <Link href="/unsubscribe" className="hover:text-primary">Email preferences</Link>
        </nav>
      </section>
    </div>
  );
}
