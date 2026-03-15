
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Resources from "@/pages/resources";
import Community from "@/pages/community";
import Shop from "@/pages/shop";
import NearMe from "@/pages/near-me";
import Onboarding from "@/pages/onboarding";
import SavedResources from "@/pages/saved-resources";
import SubmitResource from "@/pages/submit-resource";
import AdminResources from "@/pages/admin-resources";
import AdminAnalytics from "@/pages/admin-analytics";
import AdminAiInsights from "@/pages/admin-ai-insights";
import Layout from "@/components/layout";
import Landing from "@/pages/landing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
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
      <Route path="/admin" component={AdminResources} />

      <Route path="/community">
        <Layout>
          <Community />
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

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
