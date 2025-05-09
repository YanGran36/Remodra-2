import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/hooks/use-language";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import CalendarPage from "@/pages/calendar-page";
import ClientsPage from "@/pages/clients-page-new";
import EstimatesPage from "@/pages/estimates-page";
import EstimateCreatePage from "@/pages/estimate-create-page";
import EstimateDetailPage from "@/pages/estimate-detail-page";
import PremiumEstimatePage from "@/pages/premium-estimate-page";
import VendorEstimateFormPage from "@/pages/vendor-estimate-form-page";
import VendorEstimateFormPageNew from "@/pages/vendor-estimate-form-page-new";
import PropertyMeasurementsPage from "@/pages/property-measurements-page";
import InvoicesPage from "@/pages/invoices-page";
import InvoiceDetailPage from "@/pages/invoice-detail-page";
import ProjectsPage from "@/pages/projects-page";
import ProjectsDebugPage from "@/pages/projects-debug";
import EstimateSimpleTest from "@/pages/estimate-simple-test";
import MaterialsPage from "@/pages/materials-page";
import AIAssistantPage from "@/pages/ai-assistant-page";
import SettingsPage from "@/pages/settings-page";
import PriceConfigurationsPage from "@/pages/price-configurations-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/estimates" component={EstimatesPage} />
      <ProtectedRoute path="/estimates/new" component={EstimateCreatePage} />
      <ProtectedRoute path="/estimates/:id" component={EstimateDetailPage} />
      <ProtectedRoute path="/premium-estimate" component={PremiumEstimatePage} />
      <ProtectedRoute path="/vendor-estimate-form" component={VendorEstimateFormPage} />
      <ProtectedRoute path="/vendor-estimate-form-new" component={VendorEstimateFormPageNew} />
      <ProtectedRoute path="/property-measurements" component={PropertyMeasurementsPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/invoices/:id" component={InvoiceDetailPage} />
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/projects-debug" component={ProjectsDebugPage} />
      <ProtectedRoute path="/estimate-simple-test" component={EstimateSimpleTest} />
      <ProtectedRoute path="/materials" component={MaterialsPage} />
      <ProtectedRoute path="/ai-assistant" component={AIAssistantPage} />
      <ProtectedRoute path="/price-configurations" component={PriceConfigurationsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router />
          <Toaster />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
