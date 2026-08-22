import { Route, Router as WouterRouter, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { PublicPortfolio } from "@/pages/PublicSite";
import { ConsolePage } from "@/pages/AdminConsole";
import "@/index.css";

function RouterContent() {
  return (
    <Switch>
      <Route path="/console">
        <ConsolePage />
      </Route>
      <Route path="/">
        <PublicPortfolio />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

const queryClient = new QueryClient();
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <RouterContent />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
