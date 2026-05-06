import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Predict from "@/pages/predict";
import History from "@/pages/history";
import Chat from "@/pages/chat";
import Admin from "@/pages/admin";
import Support from "@/pages/support";

// Layout
import Layout from "@/components/layout";

import { AuthProvider, useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";

// Wrapper for pages that need the sidebar layout
const AppLayout = ({ component: Component }: { component: React.ComponentType }) => (
  <Layout>
    <Component />
  </Layout>
);

function ProtectedRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Route path={path} component={() => <Redirect to="/auth" />} />;
  }

  return (
    <Route path={path}>
      <AppLayout component={Component} />
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/predict" component={Predict} />
      <ProtectedRoute path="/history" component={History} />
      <ProtectedRoute path="/chat" component={Chat} />
      <ProtectedRoute path="/support" component={Support} />
      <ProtectedRoute path="/admin" component={Admin} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
