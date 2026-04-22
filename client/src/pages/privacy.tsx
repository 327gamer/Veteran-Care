import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy | Veteran Care";
  }, []);

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-privacy">
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70 mb-2">Legal</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
          <p className="text-primary-foreground/80 text-sm mt-2">Effective date: 2026</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 max-w-3xl">
        <Card>
          <CardContent className="pt-6 prose prose-sm max-w-none">
            <p>Veteran Care ("we", "us") respects your privacy. This page summarizes how we handle information when you use our platform.</p>
            <h3 className="font-heading text-primary">What we collect</h3>
            <p>Basic usage data (pages visited, search queries), optional account information you provide (name, email), and optional location data you choose to share to power "near me" search.</p>
            <h3 className="font-heading text-primary">How we use it</h3>
            <p>To match you with relevant resources, improve the platform, route partner leads where you've asked us to, and respond to support requests.</p>
            <h3 className="font-heading text-primary">What we don't do</h3>
            <p>We do not sell personal data. We do not share your contact details with third parties without your consent.</p>
            <h3 className="font-heading text-primary">Contact</h3>
            <p>For privacy questions, write to <span className="font-mono">info@VeteranCare.com</span>.</p>
            <p className="text-xs text-muted-foreground mt-6">A complete, jurisdiction-specific policy will replace this summary as the platform expands nationally.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
