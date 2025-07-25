import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/use-auth";
import { LanguageProvider } from "./hooks/use-language";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "./lib/protected-route";
import { Toaster } from "./components/ui/toaster";
import { SessionRecoveryAlert } from "./components/session-recovery-alert";
import { AchievementManager } from "./components/achievements/AchievementManager";

// Pages
import AuthPage from "./pages/auth-page";
import SimpleLogin from "./pages/simple-login";
import Landing from "./pages/landing";
import Dashboard from "./pages/dashboard";
import ClientsPage from "./pages/clients-page-new";
import EstimatesPage from "./pages/estimates-page";
import InvoicesPage from "./pages/invoices-page";
import ProjectsPage from "./pages/projects-page";
import MaterialsPage from "./pages/materials-page";
import EventsPage from "./pages/events-page";
import AdminDashboard from "./pages/admin-dashboard";
import SuperAdminDashboard from "./pages/super-admin-dashboard";
import AchievementsPage from "./pages/achievements-page";
import CalendarPage from "./pages/calendar-page";
import TimeClockPage from "./pages/timeclock-page";
import AiAssistantPage from "./pages/ai-assistant-page";
import ToolsDashboard from "./pages/tools-dashboard";
import SettingsPage from "./pages/settings-page";
import PricingConfigPage from "./pages/pricing-config-page";
import EstimateDetailPage from "./pages/estimate-detail-page";
import EstimateCreateServicePage from "./pages/estimate-create-service-page";
import PublicEstimateView from "./pages/public-estimate-view";
import InvoiceDetailPage from "./pages/invoice-detail-page";
import EstimatePrintPage from "./pages/estimate-print-page";
import MultiServiceEstimatePage from "./pages/multi-service-estimate-page";
import ProfessionalEstimatePage from "./pages/professional-estimate-page";
import PremiumEstimatePage from "./pages/premium-estimate-page";
import ClientPortal from "./pages/client-portal";
import LeadCapturePage from "./pages/lead-capture-page";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={AuthPage} />
      <Route path="/simple-login" component={SimpleLogin} />
      <Route path="/landing" component={Landing} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/estimates" component={EstimatesPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/materials" component={MaterialsPage} />
      <ProtectedRoute path="/events" component={EventsPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/super-admin" component={SuperAdminDashboard} />
      <ProtectedRoute path="/achievements" component={AchievementsPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/timeclock" component={TimeClockPage} />
      <ProtectedRoute path="/ai-assistant" component={AiAssistantPage} />
      <ProtectedRoute path="/tools" component={ToolsDashboard} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/pricing-config" component={PricingConfigPage} />
      <ProtectedRoute path="/estimates/:id" component={EstimateDetailPage} />
      <ProtectedRoute path="/estimates/create" component={EstimateCreateServicePage} />
      <Route path="/public/estimates/:id" component={PublicEstimateView} />
      <ProtectedRoute path="/invoices/:id" component={InvoiceDetailPage} />
      <Route path="/estimates/:id/print" component={EstimatePrintPage} />
      <ProtectedRoute path="/estimates/multi-service" component={MultiServiceEstimatePage} />
      <ProtectedRoute path="/estimates/professional" component={ProfessionalEstimatePage} />
      <ProtectedRoute path="/estimates/premium" component={PremiumEstimatePage} />
      <ProtectedRoute path="/client-portal/:clientId" component={ClientPortal} />
      <Route path="/lead-capture" component={LeadCapturePage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HelmetProvider>
          <LanguageProvider>
            <Router />
            <SessionRecoveryAlert />
            <AchievementManager />
            <Toaster />
          </LanguageProvider>
        </HelmetProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
