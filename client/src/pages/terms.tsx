import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import MenuPageHero from "@/components/menu-page-hero";

const EFFECTIVE_DATE = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export default function Terms() {
  useEffect(() => {
    document.title = "Terms of Use | Veteran Care";
  }, []);

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-terms">
      <MenuPageHero
        testIdPrefix="terms"
        eyebrow="Legal"
        title={["Terms", "Of Use"]}
        subtitle="The agreement that governs your use of Veteran Care."
        detail={`Effective date: ${EFFECTIVE_DATE}`}
      />
      <section className="container mx-auto px-5 py-10 max-w-3xl">
        <Card>
          <CardContent className="pt-7 pb-7 prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-primary prose-h3:mt-7 prose-h3:mb-2 prose-p:leading-relaxed">
            <p>By using Veteran Care, you agree to use the platform for lawful purposes and in good faith.</p>

            <h3>Resource information</h3>
            <p>We work hard to keep listings accurate, but Veteran Care is an information directory and is not a substitute for professional advice. Always verify eligibility and program details directly with the provider.</p>

            <h3>Trusted partners</h3>
            <p>Listings marked as Trusted Services or Partners are independent organizations. Veteran Care does not provide their goods or services directly.</p>

            <h3>AI Navigator</h3>
            <p>The Veteran Navigator is an AI-powered assistant. Its responses are informational only and may occasionally be inaccurate or incomplete. Always confirm time-sensitive matters with the providing organization.</p>

            <h3>Crisis support</h3>
            <p>If you or someone you know is in crisis, call or text the Veterans Crisis Line at <span className="font-mono font-semibold">988, then press 1</span>.</p>

            <h3>Contact</h3>
            <p>Questions about these terms: <span className="font-mono">info@VeteranCare.com</span>.</p>
          </CardContent>
        </Card>

        <nav className="mt-6 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 justify-center" data-testid="nav-legal-footer">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-primary">Contact</Link>
          <Link href="/unsubscribe" className="hover:text-primary">Email preferences</Link>
        </nav>
      </section>
    </div>
  );
}
