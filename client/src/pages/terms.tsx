import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  useEffect(() => {
    document.title = "Terms of Use | Veteran Care";
  }, []);

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-terms">
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70 mb-2">Legal</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">Terms of Use</h1>
          <p className="text-primary-foreground/80 text-sm mt-2">Effective date: 2026</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 max-w-3xl">
        <Card>
          <CardContent className="pt-6 prose prose-sm max-w-none">
            <p>By using Veteran Care, you agree to use the platform for lawful purposes and in good faith.</p>
            <h3 className="font-heading text-primary">Resource information</h3>
            <p>We work hard to keep listings accurate, but Veteran Care is an information directory and not a substitute for professional advice. Always verify eligibility and program details directly with the provider.</p>
            <h3 className="font-heading text-primary">Trusted partners</h3>
            <p>Listings marked as Trusted Services or Partners are independent organizations. Veteran Care does not provide their goods or services directly.</p>
            <h3 className="font-heading text-primary">Crisis support</h3>
            <p>If you or someone you know is in crisis, call or text the Veterans Crisis Line at <span className="font-mono">988, then press 1</span>.</p>
            <h3 className="font-heading text-primary">Contact</h3>
            <p>Questions about these terms: <span className="font-mono">info@VeteranCare.com</span>.</p>
            <p className="text-xs text-muted-foreground mt-6">A complete terms document will replace this summary as the platform expands nationally.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
