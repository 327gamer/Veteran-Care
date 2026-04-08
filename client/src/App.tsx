import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { trackPageView } from "./lib/analytics";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Resources from "@/pages/resources";
import Community from "@/pages/community";
import Shop from "@/pages/shop";
import TrustedServices from "@/pages/trusted-services";
import NearMe from "@/pages/near-me";
import Onboarding from "@/pages/onboarding";
import SavedResources from "@/pages/saved-resources";
import SubmitResource from "@/pages/submit-resource";
import AdminResources from "@/pages/admin-resources";
import AdminAnalytics from "@/pages/admin-analytics";
import AdminAiInsights from "@/pages/admin-ai-insights";
import AdminTrustedServices from "@/pages/admin-trusted-services";
import AdminTrustedServiceLeads from "@/pages/admin-trusted-service-leads";
import AdminPartnerProspects from "@/pages/admin-partner-prospects";
import PartnerApply from "@/pages/partner-apply";
import PartnerPaymentSuccess from "@/pages/partner-payment-success";
import VobDirectory from "@/pages/vob-directory";
import VobDirectoryApply from "@/pages/vob-directory-apply";
import VobStartupHelp from "@/pages/vob-startup-help";
import AdminVob from "@/pages/admin-vob";
import AdminAmbassadors from "@/pages/admin-ambassadors";
import AdminLinks from "@/pages/admin-links";
import AdminAttribution from "@/pages/admin-attribution";
import AdminCommissions from "@/pages/admin-commissions";
import AdminPayouts from "@/pages/admin-payouts";
import AdminSweepstakes from "@/pages/admin-sweepstakes";
import Layout from "@/components/layout";
import Landing from "@/pages/landing";
import LandingPage from "@/pages/landing-page";
import GetHelp from "@/pages/get-help";
import ResourceCenter from "@/pages/resource-center";
import PartnersLanding from "@/pages/partners-landing";
import EndOfLife from "@/pages/end-of-life";
import DisabledVeterans from "@/pages/disabled-veterans";
import Referral from "@/pages/referral";
import PartnerPortal from "@/pages/partner-portal";
import VeteranDiscounts from "@/pages/veteran-discounts";
import AmbassadorDashboard from "@/pages/ambassador-dashboard";

function PageViewTracker() {
  const [location] = useLocation();
  useEffect(() => {
    trackPageView(location);
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/start">
        <Layout fullBleed>
          <LandingPage />
        </Layout>
      </Route>
      <Route path="/get-help">
        <Layout>
          <GetHelp />
        </Layout>
      </Route>
      <Route path="/resource-center" component={ResourceCenter} />
      <Route path="/partners" component={PartnersLanding} />
      <Route path="/end-of-life">
        <Layout>
          <EndOfLife />
        </Layout>
      </Route>
      <Route path="/disabled-veterans">
        <Layout>
          <DisabledVeterans />
        </Layout>
      </Route>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/enable-location" component={Onboarding} />
      
      <Route path="/home">
        <Layout>
          <Home />
        </Layout>
      </Route>
      
      <Route path="/resources">
        <Layout>
          <Resources />
        </Layout>
      </Route>

      <Route path="/saved-resources">
        <Layout>
          <SavedResources />
        </Layout>
      </Route>

      <Route path="/submit-resource">
        <Layout>
          <SubmitResource />
        </Layout>
      </Route>

      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/ai-insights" component={AdminAiInsights} />
      <Route path="/admin/trusted-services" component={AdminTrustedServices} />
      <Route path="/admin/trusted-service-leads" component={AdminTrustedServiceLeads} />
      <Route path="/admin/partner-prospects" component={AdminPartnerProspects} />
      <Route path="/admin/vob" component={AdminVob} />
      <Route path="/admin/ambassadors" component={AdminAmbassadors} />
      <Route path="/admin/links" component={AdminLinks} />
      <Route path="/admin/attribution" component={AdminAttribution} />
      <Route path="/admin/commissions" component={AdminCommissions} />
      <Route path="/admin/payouts" component={AdminPayouts} />
      <Route path="/admin/sweepstakes" component={AdminSweepstakes} />
      <Route path="/admin" component={AdminResources} />

      <Route path="/community">
        <Layout>
          <Community />
        </Layout>
      </Route>

      <Route path="/trusted-services">
        {() => {
          window.location.replace("/discounts");
          return null;
        }}
      </Route>

      <Route path="/partner-apply">
        <Layout>
          <PartnerApply />
        </Layout>
      </Route>

      <Route path="/partner-payment-success">
        <Layout>
          <PartnerPaymentSuccess />
        </Layout>
      </Route>

      <Route path="/partner-portal">
        <Layout>
          <PartnerPortal />
        </Layout>
      </Route>

      <Route path="/partner-referrals">
        <Redirect to="/partner-portal" />
      </Route>

      <Route path="/vob">
        <Layout>
          <VobDirectory />
        </Layout>
      </Route>

      <Route path="/vob/apply">
        <Layout>
          <VobDirectoryApply />
        </Layout>
      </Route>

      <Route path="/vob/start">
        <Layout>
          <VobStartupHelp />
        </Layout>
      </Route>

      <Route path="/shop">
        <Layout>
          <Shop />
        </Layout>
      </Route>

      <Route path="/near-me">
        <Layout>
          <NearMe />
        </Layout>
      </Route>

      <Route path="/referral">
        <Layout>
          <Referral />
        </Layout>
      </Route>

      <Route path="/discounts">
        <Layout>
          <VeteranDiscounts />
        </Layout>
      </Route>

      <Route path="/ambassador-dashboard" component={AmbassadorDashboard} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PageViewTracker />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
