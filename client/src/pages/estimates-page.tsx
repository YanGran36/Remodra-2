import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEstimates } from '../hooks/use-estimates';
import { useToast } from '../hooks/use-toast';
import { 
  ChevronDown, 
  FileText, 
  Plus, 
  FileEdit, 
  Mail, 
  Download, 
  Eye, 
  Trash2,
  BanknoteIcon,
  Calculator,
  XCircle,
  Check,
  Printer,
  CheckCircle,
  Clock,
  Search,
  Settings,
  Edit,
  User,
  Calendar
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { format } from "date-fns";
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import PageHeader from '../components/shared/page-header';
import EstimateDetail from '../components/estimates/estimate-detail';
import EstimateForm from '../components/estimates/estimate-form';
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogDescription
} from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import TopNav from '../components/layout/top-nav';
import { Input } from '../components/ui/input';

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Helper function to get status badge style
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    case 'sent':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Sent</Badge>;
    case 'accepted':
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
    case 'expired':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function EstimatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<any>(null);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Use the estimates hook for all estimate-related operations
  const { 
    deleteEstimateMutation, 
    convertToInvoiceMutation,
    updateEstimateStatusMutation 
  } = useEstimates();

  // Fetch estimates
  const { data: estimates = [], isLoading, error } = useQuery({
    queryKey: ["/api/protected/estimates"],
  });

  // Filter and sort estimates
  const filteredEstimates = estimates && Array.isArray(estimates)
    ? estimates
        .filter((estimate: any) => {
          // Status filter
          if (statusFilter !== "all" && estimate.status !== statusFilter) {
            return false;
          }
          
          // Search filter
          if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            return (
              estimate.estimateNumber.toLowerCase().includes(lowerCaseQuery) ||
              estimate.client?.firstName.toLowerCase().includes(lowerCaseQuery) ||
              estimate.client?.lastName.toLowerCase().includes(lowerCaseQuery) ||
              (estimate.project?.title && estimate.project.title.toLowerCase().includes(lowerCaseQuery))
            );
          }
          
          return true;
        })
        .sort((a: any, b: any) => {
          if (sortBy === "date_desc") {
            return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
          } else if (sortBy === "date_asc") {
            return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          } else if (sortBy === "amount_desc") {
            return parseFloat(b.total) - parseFloat(a.total);
          } else if (sortBy === "amount_asc") {
            return parseFloat(a.total) - parseFloat(b.total);
          }
          return 0;
        })
    : [];

  const viewEstimateDetails = (estimate: any) => {
    // Navigate to estimate detail page
    setLocation(`/estimates/${estimate.id}`);
  };

  const createNewEstimate = () => {
    setLocation('/estimates/create');
  };

  const editEstimate = (estimate: any) => {
    // Navigate to estimate detail page for editing
    setLocation(`/estimates/${estimate.id}`);
  };

  const printEstimate = (estimate: any) => {
    // Open estimate in new window for printing
    window.open(`/estimates/${estimate.id}/print`, '_blank');
  };

  const deleteEstimate = async (estimate: any) => {
    if (window.confirm(`Are you sure you want to delete estimate ${estimate.estimateNumber || estimate.id}?`)) {
      try {
        await deleteEstimateMutation.mutateAsync(estimate.id);
        toast({
          title: "Estimate Deleted",
          description: "The estimate has been successfully deleted.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete estimate. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const calculateTotal = () => {
    if (!estimates || !Array.isArray(estimates)) return { total: 0, count: 0 };
    
    const total = estimates.reduce((sum: number, estimate: any) => {
      return sum + parseFloat(estimate.total || 0);
    }, 0);
    
    return { total, count: estimates.length };
  };

  const { total, count } = calculateTotal();

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <main className="p-8 space-y-8">
          {/* Header with Remodra branding */}
          <div className="text-center mb-8">
            <div className="remodra-logo mb-6">
              <span className="remodra-logo-text">R</span>
            </div>
            <h1 className="remodra-title mb-3">
              Estimates
            </h1>
            <p className="remodra-subtitle">
              Create professional estimates for your clients
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button className="remodra-button" onClick={() => window.location.href = '/estimates/create'}>
              <FileText className="h-5 w-5 mr-2" />
              New Estimate
            </Button>
            <Button className="remodra-button-outline" onClick={() => {
              // Export functionality
              const csvContent = "data:text/csv;charset=utf-8," + 
                "Estimate Number,Client,Status,Total,Issue Date,Expiry Date\n" +
                (estimates as any[]).map(e => 
                  `"${e.estimateNumber}","${e.client?.firstName || ''} ${e.client?.lastName || ''}","${e.status}","${e.total || 0}","${new Date(e.issueDate).toLocaleDateString()}","${new Date(e.expiryDate).toLocaleDateString()}"`
                ).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "estimates.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>
              <Download className="h-5 w-5 mr-2" />
              Export Estimates
            </Button>
            <Button className="remodra-button-outline" onClick={() => window.location.href = '/settings'}>
              <Settings className="h-5 w-5 mr-2" />
              Estimate Settings
            </Button>
          </div>

          {/* Filters */}
          <div className="remodra-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
                <SelectTrigger className="remodra-input w-full lg:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">All Estimates</SelectItem>
                  <SelectItem value="draft" className="text-slate-200 hover:bg-slate-700">Draft</SelectItem>
                  <SelectItem value="sent" className="text-slate-200 hover:bg-slate-700">Sent</SelectItem>
                  <SelectItem value="accepted" className="text-slate-200 hover:bg-slate-700">Accepted</SelectItem>
                  <SelectItem value="rejected" className="text-slate-200 hover:bg-slate-700">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{(estimates as any[])?.length || 0}</div>
              <div className="remodra-stats-label">Total Estimates</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{(estimates as any[])?.filter((e: any) => e.status === 'draft').length || 0}</div>
              <div className="remodra-stats-label">Draft Estimates</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{(estimates as any[])?.filter((e: any) => e.status === 'sent').length || 0}</div>
              <div className="remodra-stats-label">Sent Estimates</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">${(estimates as any[])?.reduce((sum: number, e: any) => sum + (e.total || 0), 0).toLocaleString() || '0'}</div>
              <div className="remodra-stats-label">Total Value</div>
              <div className="remodra-stats-accent"></div>
            </div>
          </div>

          {/* Estimates List */}
          <div className="remodra-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-400">Estimate Directory</h2>
              <Badge className="remodra-badge">
                {filteredEstimates.length} Estimates
              </Badge>
            </div>

            {isLoading ? (
              <div className="remodra-loading">
                <div className="remodra-spinner"></div>
                <p className="text-slate-300">Loading estimates...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400">Error loading estimates: {error.message}</p>
              </div>
            ) : filteredEstimates.length === 0 ? (
              <div className="remodra-empty">
                <div className="remodra-empty-icon">📋</div>
                <div className="remodra-empty-title">No Estimates Found</div>
                <div className="remodra-empty-description">
                  {searchQuery ? `No estimates match "${searchQuery}"` : "Start by creating your first estimate"}
                </div>
                <Button className="remodra-button mt-4" onClick={() => window.location.href = '/estimates/create'}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create First Estimate
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Estimate</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Client</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Date</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEstimates.map((estimate) => (
                      <tr key={estimate.id} className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded flex items-center justify-center">
                              <FileText className="h-4 w-4 text-slate-900" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-200">
                                {estimate.estimateNumber || `EST-${estimate.id}`}
                              </div>
                              {estimate.title && (
                                <div className="text-xs text-slate-400 truncate max-w-[200px]">{estimate.title}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-300">
                            {estimate.client?.firstName && estimate.client?.lastName 
                              ? `${estimate.client.firstName} ${estimate.client.lastName}`
                              : estimate.client?.name 
                              ? estimate.client.name
                              : 'No Client'
                            }
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-amber-400 font-semibold">
                            ${estimate.total?.toLocaleString() || '0'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${
                            estimate.status === 'accepted' ? 'remodra-badge' :
                            estimate.status === 'rejected' ? 'border-red-600/50 text-red-400' :
                            'remodra-badge-outline'
                          }`}>
                            {estimate.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-300">
                            {new Date(estimate.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="remodra-button-outline h-8 w-8 p-0"
                                  title="Actions"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-slate-600">
                                <DropdownMenuItem 
                                  onClick={() => viewEstimateDetails(estimate)}
                                  className="text-slate-200 hover:bg-slate-700 cursor-pointer"
                                >
                                  <Eye className="h-3 w-3 mr-2" />
                                  View Estimate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => editEstimate(estimate)}
                                  className="text-slate-200 hover:bg-slate-700 cursor-pointer"
                                >
                                  <Edit className="h-3 w-3 mr-2" />
                                  Edit Estimate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => printEstimate(estimate)}
                                  className="text-slate-200 hover:bg-slate-700 cursor-pointer"
                                >
                                  <Printer className="h-3 w-3 mr-2" />
                                  Print Estimate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-600" />
                                <DropdownMenuItem 
                                  onClick={() => deleteEstimate(estimate)}
                                  className="text-red-400 hover:bg-red-600/20 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete Estimate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
