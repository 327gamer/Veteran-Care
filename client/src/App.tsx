
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
import Layout from "@/components/layout";

// Mock auth/onboarding state wrapper for prototype
function Router() {
  // In a real app, we'd check if onboarding is complete
  const showOnboarding = false; 

  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      
      <Route path="/">
        <Layout>
          <Home />
        </Layout>
      </Route>
      
      <Route path="/resources">
        <Layout>
          <Resources />
        </Layout>
      </Route>

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
