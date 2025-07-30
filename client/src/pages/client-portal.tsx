import React, { useState, useRef, useCallback, useEffect } from "react";
import SimpleChat from '../components/SimpleChat';
import { useParams, useLocation } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { format } from "date-fns";
import { 
  FileText, 
  Receipt, 
  Calendar, 
  MessageCircle,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Send,
  ArrowLeft,
  Building,
  Activity
} from "lucide-react";


// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  if (error) {
    return <div style={{ color: 'red', padding: 32 }}>
      <h2>Something went wrong in the Client Portal:</h2>
      <pre>{error.message}</pre>
      <pre>{error.stack}</pre>
    </div>;
  }
  return <ErrorCatcher onError={setError}>{children}</ErrorCatcher>;
}

class ErrorCatcher extends React.Component<{ onError: (e: Error) => void; children: React.ReactNode }, {}> {
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.props.children;
  }
}

// Client Portal Component
export default function ClientPortal() {
  const { clientId } = useParams<{ clientId: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Real client information from database
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [clientEstimates, setClientEstimates] = useState<any[]>([]);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [clientAppointments, setClientAppointments] = useState<any[]>([]);
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await fetch(`/api/client-portal/${clientId}/data`);
        if (response.ok) {
          const data = await response.json();
          console.log('[Client Portal] Fetched data:', data);
          setClientInfo(data.client);
          setClientProjects(data.projects || []);
          setClientEstimates(data.estimates || []);
          setClientInvoices(data.invoices || []);
          setClientAppointments(data.appointments || []);
          setAgentInfo(data.agent);
        } else {
          const errorText = await response.text();
          console.error('[Client Portal] API error:', response.status, errorText);
          setClientInfo(null);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
        setClientInfo(null);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  if (loading) {
    return <div className="remodra-layout">
      <div className="remodra-main-mobile">
        <div className="remodra-content">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="remodra-spinner mx-auto"></div>
              <p className="mt-4 text-slate-300">Loading client portal...</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Defensive: If any required data is missing, show a clear error message
  if (!loading && (!clientInfo || typeof clientInfo !== 'object')) {
    console.error('[Client Portal] clientInfo missing or invalid:', clientInfo);
    return <div className="remodra-layout">
      <div className="remodra-main-mobile">
        <div className="remodra-content">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="remodra-empty-icon mb-4">⚠️</div>
              <p className="remodra-empty-title text-red-400">Client not found or failed to load client data.</p>
              <p className="remodra-empty-description">Please check the client link or try again later.</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
  if (!loading && (!Array.isArray(clientProjects) || !Array.isArray(clientEstimates) || !Array.isArray(clientInvoices) || !Array.isArray(clientAppointments))) {
    console.error('[Client Portal] One or more data arrays are missing or invalid:', { clientProjects, clientEstimates, clientInvoices, clientAppointments });
    return <div className="remodra-layout">
      <div className="remodra-main-mobile">
        <div className="remodra-content">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="remodra-empty-icon mb-4">⚠️</div>
              <p className="remodra-empty-title text-red-400">Client data is incomplete or corrupted.</p>
              <p className="remodra-empty-description">Please contact support.</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Use real data from database
  const projects = clientProjects;
  const estimates = clientEstimates;
  const invoices = clientInvoices;
  const appointments = clientAppointments;

  const handleViewEstimate = (estimateId: string) => {
    window.open(`/public/estimates/${estimateId}`, '_blank');
  };

  const handleViewInvoice = (invoiceId: string) => {
    window.open(`/public/invoices/${invoiceId}`, '_blank');
  };

  const handleApproveEstimate = (estimateId: string) => {
    alert(`Estimate ${estimateId} approved! You will be redirected to contract signing.`);
  };

  const handlePayInvoice = (invoiceId: string) => {
    alert(`Redirecting to payment portal for invoice ${invoiceId}`);
  };

  const handleRescheduleAppointment = (appointmentId: number) => {
    alert(`Rescheduling appointment ${appointmentId}. A calendar will open.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'paid':
      case 'completed':
        return <Badge className="remodra-badge bg-green-500/20 text-green-400 border-green-500/30">{status}</Badge>;
      case 'pending':
      case 'scheduled':
      case 'draft':
        return <Badge className="remodra-badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{status}</Badge>;
      case 'in progress':
        return <Badge className="remodra-badge bg-blue-500/20 text-blue-400 border-blue-500/30">{status}</Badge>;
      case 'sent':
        return <Badge className="remodra-badge bg-purple-500/20 text-purple-400 border-purple-500/30">{status}</Badge>;
      default:
        return <Badge className="remodra-badge bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  // Overview Tab Component
  const OverviewTab = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Overview
        </h2>
        <div className="text-sm text-slate-400">Summary of your account activity</div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="remodra-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="remodra-stats-label">Active Projects</div>
              <div className="remodra-stats-number">{projects.filter(p => p.status === 'in_progress' || p.status === 'In Progress').length}</div>
            </div>
            <Building className="h-8 w-8 text-amber-400" />
          </div>
          <div className="remodra-stats-accent"></div>
        </div>
        
        <div className="remodra-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="remodra-stats-label">Pending Estimates</div>
              <div className="remodra-stats-number">{estimates.filter(e => e.status === 'draft' || e.status === 'pending').length}</div>
            </div>
            <FileText className="h-8 w-8 text-amber-400" />
          </div>
          <div className="remodra-stats-accent"></div>
        </div>
        
        <div className="remodra-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="remodra-stats-label">Outstanding Invoices</div>
              <div className="remodra-stats-number">{invoices.filter(i => i.status === 'pending' || i.status === 'sent').length}</div>
            </div>
            <Receipt className="h-8 w-8 text-amber-400" />
          </div>
          <div className="remodra-stats-accent"></div>
        </div>
        
        <div className="remodra-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="remodra-stats-label">Upcoming Appointments</div>
              <div className="remodra-stats-number">{appointments.filter(a => new Date(a.startTime) > new Date()).length}</div>
            </div>
            <Calendar className="h-8 w-8 text-amber-400" />
          </div>
          <div className="remodra-stats-accent"></div>
        </div>
      </div>

      {/* Agent Contact Information */}
      {agentInfo && (
        <div className="remodra-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-400">Your Assigned Agent</h3>
              <p className="text-slate-400">Contact your project coordinator</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
              <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-slate-900" />
              </div>
              <div>
                <p className="font-medium text-slate-200">{agentInfo.name}</p>
                <p className="text-sm text-slate-400">{agentInfo.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
              <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-slate-900" />
              </div>
              <div>
                <p className="font-medium text-slate-200">{agentInfo.email}</p>
                <p className="text-sm text-slate-400">Email</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
              <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-slate-900" />
              </div>
              <div>
                <p className="font-medium text-slate-200">{agentInfo.phone}</p>
                <p className="text-sm text-slate-400">Phone</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-t-lg">
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-600" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-slate-600">Your latest project updates and communications</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {projects.length === 0 && estimates.length === 0 && invoices.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Activity will appear here when work begins</p>
              </div>
            ) : (
              <>
                {projects.map((project) => (
                  <div key={project.id} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                    <div className="bg-blue-500 p-2 rounded-full">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900">{project.title} updated</p>
                      <p className="text-sm text-blue-700">{project.description}</p>
                      <p className="text-xs text-blue-500 mt-1">{format(new Date(project.updatedAt || project.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                ))}
                {estimates.map((estimate) => (
                  <div key={estimate.id} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                    <div className="bg-green-500 p-2 rounded-full">
                      <Receipt className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">Estimate {estimate.estimateNumber} created</p>
                      <p className="text-sm text-green-700">{estimate.title}</p>
                      <p className="text-xs text-green-500 mt-1">{format(new Date(estimate.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                ))}
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                    <div className="bg-purple-500 p-2 rounded-full">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-purple-900">Invoice {invoice.invoiceNumber} generated</p>
                      <p className="text-sm text-purple-700">${Number(invoice.total).toFixed(2)}</p>
                      <p className="text-xs text-purple-500 mt-1">{format(new Date(invoice.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Projects Tab Component
  const ProjectsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building className="h-6 w-6 text-blue-600" />
          My Projects
        </h2>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {projects.length === 0 ? (
          <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
            <CardContent className="p-12 text-center">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Projects Yet</h3>
              <p className="text-gray-500">Your projects will appear here once work begins.</p>
            </CardContent>
          </Card>
        ) : projects.map((project) => (
          <Card key={project.id} className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="card-title">{project.title}</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">{project.description}</CardDescription>
                </div>
                {getStatusBadge(project.status)}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-500 font-medium">Started</p>
                    <p className="text-sm font-semibold text-blue-800">{project.startDate && !isNaN(new Date(project.startDate).getTime()) ? format(new Date(project.startDate), "MMM dd, yyyy") : 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-purple-500 font-medium">Est. Completion</p>
                    <p className="text-sm font-semibold text-purple-800">{project.estimatedEnd && !isNaN(new Date(project.estimatedEnd).getTime()) ? format(new Date(project.estimatedEnd), "MMM dd, yyyy") : 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-green-500 font-medium">Budget</p>
                    <p className="text-sm font-semibold text-green-800">{typeof project.budget === 'number' && !isNaN(project.budget) ? `$${project.budget.toLocaleString()}` : 'Not set'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Project Progress</span>
                  <span className="text-gray-900">{project.progress}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div 
                    className={`h-3 rounded-full shadow-sm ${
                      project.status === 'Completed' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-lg">
              <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  // Estimates Tab Component
  const EstimatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
          <FileText className="h-6 w-6 text-amber-400" />
          My Estimates
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {estimates.length === 0 ? (
          <div className="col-span-full">
            <Card className="remodra-card">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-200 mb-2">No Estimates Yet</h3>
                <p className="text-slate-400">Your estimates will appear here when created.</p>
              </CardContent>
            </Card>
          </div>
        ) : estimates.map((estimate) => (
          <Card key={estimate.id} className="remodra-card hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-amber-400">#{estimate.estimateNumber}</CardTitle>
                  <CardDescription className="text-slate-300">Issued: {format(new Date(estimate.createdAt), "MMM dd, yyyy")}</CardDescription>
                </div>
                {getStatusBadge(estimate.status)}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-slate-200 mb-1">{estimate.title}</p>
                  <p className="text-slate-400 text-sm mb-3">{estimate.description || 'No description provided'}</p>
                </div>
                <div className="bg-gradient-to-r from-green-600/20 to-green-500/20 p-4 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <span className="text-2xl font-bold text-green-400">${Number(estimate.total || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-green-400 font-medium mt-1">Total Estimate</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-slate-800/50 rounded-b-lg border-t border-slate-600">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleViewEstimate(estimate.id)}
                className="remodra-button-outline shadow-sm hover:shadow-md transition-shadow"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              {estimate.status === "Pending" && (
                <Button 
                  size="sm"
                  onClick={() => handleApproveEstimate(estimate.id)}
                  className="remodra-button shadow-sm hover:shadow-md transition-all"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  // Invoices Tab Component
  const InvoicesTab = () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    const getPaymentProgress = (invoice: any) => {
      const total = Number(invoice.total) || 0;
      const paid = Number(invoice.amountPaid) || 0;
      return total > 0 ? (paid / total) * 100 : 0;
    };

    const getPaymentStatusColor = (invoice: any) => {
      const progress = getPaymentProgress(invoice);
      if (progress >= 100) return 'bg-green-500';
      if (progress > 0) return 'bg-orange-500';
      return 'bg-slate-400';
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-amber-400" />
            My Invoices
          </h2>
          <div className="text-sm text-slate-400">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {invoices.length === 0 ? (
            <div className="col-span-full">
              <Card className="remodra-card">
                <CardContent className="p-12 text-center">
                  <Receipt className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">No Invoices Yet</h3>
                  <p className="text-slate-400">Your invoices will appear here when generated.</p>
                </CardContent>
              </Card>
            </div>
          ) : invoices.map((invoice) => {
            const total = Number(invoice.total) || 0;
            const paid = Number(invoice.amountPaid) || 0;
            const pending = total - paid;
            const progress = getPaymentProgress(invoice);
            const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';
            
            return (
              <Card key={invoice.id} className="remodra-card hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-amber-400">#{invoice.invoiceNumber}</CardTitle>
                      <CardDescription className="text-slate-300">
                        Due: {format(new Date(invoice.dueDate || invoice.createdAt), "MMM dd, yyyy")}
                        {isOverdue && <span className="text-red-400 font-medium ml-2">• OVERDUE</span>}
                      </CardDescription>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="font-semibold text-slate-200">{invoice.title}</p>
                    
                    {/* Payment Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Payment Progress</span>
                        <span className="font-medium text-slate-200">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getPaymentStatusColor(invoice)}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Amount Breakdown */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400">Total</p>
                        <p className="text-sm font-bold text-slate-200">{formatCurrency(total)}</p>
                      </div>
                      <div className="text-center p-3 bg-green-600/20 rounded-lg border border-green-500/30">
                        <p className="text-xs text-green-400">Paid</p>
                        <p className="text-sm font-bold text-green-400">{formatCurrency(paid)}</p>
                      </div>
                      <div className="text-center p-3 bg-red-600/20 rounded-lg border border-red-500/30">
                        <p className="text-xs text-red-400">Due</p>
                        <p className="text-sm font-bold text-red-400">{formatCurrency(pending)}</p>
                      </div>
                    </div>

                    {/* Payment History Preview */}
                    {invoice.payments && invoice.payments.length > 0 && (
                      <div className="bg-blue-600/20 p-3 rounded-lg border border-blue-500/30">
                        <p className="text-xs text-blue-400 font-medium mb-1">Recent Payments</p>
                        <div className="space-y-1">
                          {invoice.payments.slice(0, 2).map((payment: any, index: number) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-blue-300">
                                {payment.paymentMethod} • {format(new Date(payment.paymentDate), 'MMM dd')}
                              </span>
                              <span className="font-medium text-blue-300">
                                {formatCurrency(Number(payment.amount))}
                              </span>
                            </div>
                          ))}
                          {invoice.payments.length > 2 && (
                            <p className="text-xs text-blue-400">
                              +{invoice.payments.length - 2} more payment{invoice.payments.length - 2 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-slate-800/50 rounded-b-lg border-t border-slate-600">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewInvoice(invoice.id)}
                    className="remodra-button-outline shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {(invoice.status === "pending" || invoice.status === "partially_paid") && pending > 0 && (
                    <Button 
                      size="sm"
                      onClick={() => handlePayInvoice(invoice.id)}
                      className="remodra-button shadow-sm hover:shadow-md transition-all"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pay ${formatCurrency(pending)}
                    </Button>
                  )}
                  {invoice.status === "paid" && (
                    <Button variant="outline" size="sm" className="remodra-button-outline shadow-sm hover:shadow-md transition-shadow">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Schedule Tab Component
  const ScheduleTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-amber-400" />
          My Schedule
        </h2>
      </div>
      
      <Card className="remodra-card">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
          <CardTitle className="text-amber-400 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
          <CardDescription className="text-purple-600">Scheduled visits and consultations</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments</p>
                <p className="text-sm text-gray-400">Appointments will appear here when scheduled</p>
              </div>
            ) : appointments.map((appointment) => (
              <div key={appointment.id} className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-500 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-lg text-gray-800">{appointment.title}</h4>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-500 font-medium">Date & Time</p>
                        <p className="font-semibold text-blue-800">{format(new Date(appointment.startTime), "EEEE, MMM dd, yyyy")}</p>
                        <p className="text-sm text-blue-600">{format(new Date(appointment.startTime), "h:mm a")} - {format(new Date(appointment.endTime), "h:mm a")}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-xs text-green-500 font-medium">Type</p>
                        <p className="font-semibold text-green-800">{appointment.type}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                      <p className="text-xs text-gray-500 font-medium">Location</p>
                      <p className="text-sm text-gray-700">{appointment.address || clientInfo.address}, {appointment.city || clientInfo.city}, {appointment.state || clientInfo.state} {appointment.zip || clientInfo.zip}</p>
                    </div>
                    {appointment.description && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                        <p className="text-xs text-gray-500 font-medium">Description</p>
                        <p className="text-sm text-gray-700">{appointment.description}</p>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRescheduleAppointment(appointment.id)}
                        className="shadow-sm hover:shadow-md transition-shadow"
                      >
                        Reschedule
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 shadow-sm hover:shadow-md transition-all">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Messages Tab Component
  const MessagesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-blue-600" />
          AI Assistant
        </h2>
        <div className="text-sm text-gray-600">Ask me about your projects, estimates, and invoices</div>
      </div>
      
      <SimpleChat clientId={clientId || '4'} />
    </div>
  );

  // Defensive: Null checks for all fields in render
  const safeClientName = clientInfo?.name || clientInfo?.firstName || clientInfo?.email || 'Client';
  const safeClientEmail = clientInfo?.email || 'N/A';
  const safeClientPhone = clientInfo?.phone || 'N/A';
  const safeClientAddress = clientInfo?.address || 'N/A';

  return (
    <ErrorBoundary>
      <div className="remodra-layout">
        <div className="remodra-main-mobile">
          <div className="remodra-content">
            <main className="p-8 space-y-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
              {/* Header with Remodra branding */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="remodra-logo">
                    <User className="h-8 w-8 text-slate-900" />
                  </div>
                </div>
                <h1 className="remodra-title mb-3">
                  Client Portal
                </h1>
                <p className="remodra-subtitle">
                  Welcome, {safeClientName}
                </p>
              </div>

              {/* Back Button */}
              <div className="flex justify-start mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/")}
                  className="remodra-button-outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>

              {/* Client Info Card */}
              <div className="remodra-card p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-900" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-amber-400">Client Information</h2>
                    <p className="text-slate-400">Contact details and account information</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
                    <Mail className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="font-medium text-slate-200">{safeClientEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
                    <Phone className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-sm text-slate-400">Phone</p>
                      <p className="font-medium text-slate-200">{safeClientPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
                    <MapPin className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-sm text-slate-400">Address</p>
                      <p className="font-medium text-slate-200">{safeClientAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-2 gap-2">
                  <TabsTrigger 
                    value="overview" 
                    className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="projects" 
                    className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
                  >
                    Projects
                  </TabsTrigger>
                  <TabsTrigger 
                    value="estimates" 
                    className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
                  >
                    Estimates
                  </TabsTrigger>
                  <TabsTrigger 
                    value="invoices" 
                    className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
                  >
                    Invoices
                  </TabsTrigger>
                  <TabsTrigger 
                    value="schedule" 
                    className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
                  >
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger 
                    value="messages" 
                    className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
                  >
                    Messages
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-8 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-2 duration-300">
                  <OverviewTab />
                </TabsContent>
                
                <TabsContent value="projects" className="mt-8 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-2 duration-300">
                  <ProjectsTab />
                </TabsContent>
                
                <TabsContent value="estimates" className="mt-8 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-2 duration-300">
                  <EstimatesTab />
                </TabsContent>
                
                <TabsContent value="invoices" className="mt-8 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-2 duration-300">
                  <InvoicesTab />
                </TabsContent>
                
                <TabsContent value="schedule" className="mt-8 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-2 duration-300">
                  <ScheduleTab />
                </TabsContent>
                
                <TabsContent value="messages" className="mt-8 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-2 duration-300">
                  <MessagesTab />
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}