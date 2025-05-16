import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import MyLoans from "./pages/MyLoans";
import Investments from "./pages/Investments";
import Settings from "./pages/Settings";
import { KycProvider } from "./context/KycContext";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/my-loans" component={MyLoans} />
        <Route path="/investments" component={Investments} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KycProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </KycProvider>
    </QueryClientProvider>
  );
}

export default App;
