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
import ErrorBoundary from "./components/error-boundary";

// Pages
import SimpleLogin from "./pages/simple-login";
import Landing from "./pages/landing";
import AuthPage from "./pages/auth-page";
import PricingPage from "./pages/pricing";
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
import SimplePricingPage from "./pages/simple-pricing-page";
import EstimateDetailPage from "./pages/estimate-detail-page";
import EstimateCreateServicePage from "./pages/estimate-create-service-page";
import EstimateCreatePage from "./pages/estimate-create-page";
import PublicEstimateView from "./pages/public-estimate-view";
import InvoiceDetailPage from "./pages/invoice-detail-page";
import EstimatePrintPage from "./pages/estimate-print-page";
import MultiServiceEstimatePage from "./pages/multi-service-estimate-page";
import ProfessionalEstimatePage from "./pages/professional-estimate-page";
import PremiumEstimatePage from "./pages/premium-estimate-page";
import AgentEstimateFormPage from "./pages/agent-estimate-form-page";
// import AgentServiceEstimatePage from "./pages/agent-service-estimate-page";
import EstimateEditPage from "./pages/estimate-edit-page";
import AgentManagementPage from "./pages/agent-management-page";
import ClientPortal from "./pages/client-portal";
import LeadCapturePage from "./pages/lead-capture-page";
import ProjectCreatePage from "./pages/project-create-page";
import ProjectDetailPage from "./pages/project-detail-page";
import ProjectEditPage from "./pages/project-edit-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={SimpleLogin} />
      <Route path="/simple-login" component={SimpleLogin} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/landing" component={Landing} />
      <Route path="/pricing" component={PricingPage} />
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
      <ProtectedRoute path="/simple-pricing" component={SimplePricingPage} />
      <ProtectedRoute path="/estimates/create" component={EstimateCreatePage} />
      <Route path="/estimates/:id/print" component={EstimatePrintPage} />
      <ProtectedRoute path="/estimates/multi-service" component={MultiServiceEstimatePage} />
      {/* <ProtectedRoute path="/estimates/professional" component={ProfessionalEstimatePage} /> */}
      {/* <ProtectedRoute path="/agents/service-estimate" component={AgentServiceEstimatePage} /> */}
      <ProtectedRoute path="/estimates/premium" component={PremiumEstimatePage} />
      <ProtectedRoute path="/estimates/premium/:id" component={PremiumEstimatePage} />
      <ProtectedRoute path="/estimates/edit/:id" component={EstimateEditPage} />
      <ProtectedRoute path="/estimates/:id" component={EstimateDetailPage} />
      <Route path="/public/estimates/:id" component={PublicEstimateView} />
      <ProtectedRoute path="/invoices/:id" component={InvoiceDetailPage} />
      <ProtectedRoute path="/agents/estimate-form" component={AgentEstimateFormPage} />
      {/* <ProtectedRoute path="/agents/service-estimate" component={AgentServiceEstimatePage} /> */}
      <ProtectedRoute path="/agents" component={AgentManagementPage} />
      <ProtectedRoute path="/projects/create" component={ProjectCreatePage} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetailPage} />
      <ProtectedRoute path="/projects/:id/edit" component={ProjectEditPage} />
      <Route path="/client-portal/:clientId" component={ClientPortal} />
      <Route path="/lead-capture" component={LeadCapturePage} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
