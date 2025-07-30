import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEstimates } from '../hooks/use-estimates';
import { useToast } from '../hooks/use-toast';
import { getQueryFn } from '../lib/queryClient';
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
  Calendar,
  X,
  Send,
  ChevronUp,
  ChevronsUpDown
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
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
      return <Badge variant="outline" className="!bg-stone-400 !text-stone-900 !border-stone-300 font-semibold">Draft</Badge>;
    case 'sent':
      return <Badge variant="outline" className="!bg-blue-400 !text-blue-900 !border-blue-300 font-semibold">Sent</Badge>;
    case 'accepted':
      return <Badge variant="outline" className="!bg-green-400 !text-green-900 !border-green-300 font-semibold">Accepted</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="!bg-red-400 !text-red-900 !border-red-300 font-semibold">Rejected</Badge>;
    case 'expired':
      return <Badge variant="outline" className="!bg-yellow-400 !text-yellow-900 !border-yellow-300 font-semibold">Expired</Badge>;
    case 'converted':
      return <Badge variant="outline" className="!bg-purple-400 !text-purple-900 !border-purple-300 font-semibold">Converted</Badge>;
    case 'pending':
      return <Badge variant="outline" className="!bg-indigo-400 !text-indigo-900 !border-indigo-300 font-semibold">Pending</Badge>;
    case 'in_progress':
      return <Badge variant="outline" className="!bg-cyan-400 !text-cyan-900 !border-cyan-300 font-semibold">In Progress</Badge>;
    case 'completed':
      return <Badge variant="outline" className="!bg-emerald-400 !text-emerald-900 !border-emerald-300 font-semibold">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="!bg-rose-400 !text-rose-900 !border-rose-300 font-semibold">Cancelled</Badge>;
    default:
      return <Badge variant="outline" className="!bg-gray-400 !text-gray-900 !border-gray-300 font-semibold">{status}</Badge>;
  }
};

export default function EstimatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [estimateType, setEstimateType] = useState<string>("agent");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<any>(null);
  
  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    confirmText: string;
    cancelText: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use the estimates hook for all estimate-related operations
  const { 
    deleteEstimateMutation, 
    convertToInvoiceMutation,
    updateEstimateStatusMutation 
  } = useEstimates();

  // Fetch estimates with automatic refetching
  const { data: estimates = [], isLoading, error } = useQuery({
    queryKey: ["/api/protected/estimates"],
    queryFn: async () => {
      const response = await fetch("/api/protected/estimates", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch estimates");
      }
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 0, // Always consider data stale to ensure fresh data
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
              (estimate.estimate_number || estimate.estimateNumber || '').toLowerCase().includes(lowerCaseQuery) ||
              estimate.client?.first_name?.toLowerCase().includes(lowerCaseQuery) ||
              estimate.client?.last_name?.toLowerCase().includes(lowerCaseQuery) ||
              (estimate.project?.title && estimate.project.title.toLowerCase().includes(lowerCaseQuery))
            );
          }
          
          return true;
        })
        .sort((a: any, b: any) => {
          let comparison = 0;
          
          switch (sortBy) {
            case "estimate":
              const aEstimate = (a.estimate_number || a.estimateNumber || `EST-${a.id}`).toLowerCase();
              const bEstimate = (b.estimate_number || b.estimateNumber || `EST-${b.id}`).toLowerCase();
              comparison = aEstimate.localeCompare(bEstimate);
              break;
            case "client":
              const aClient = `${a.client?.first_name || ''} ${a.client?.last_name || ''}`.toLowerCase();
              const bClient = `${b.client?.first_name || ''} ${b.client?.last_name || ''}`.toLowerCase();
              comparison = aClient.localeCompare(bClient);
              break;
            case "amount":
              comparison = parseFloat(a.total || 0) - parseFloat(b.total || 0);
              break;
            case "status":
              comparison = (a.status || '').localeCompare(b.status || '');
              break;
            case "date":
              comparison = new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime();
              break;
            default:
              comparison = new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime();
          }
          
          return sortDirection === "asc" ? comparison : -comparison;
        })
    : [];

  const viewEstimateDetails = (estimate: any) => {
    // Navigate to estimate detail page
    setLocation(`/estimates/${estimate.id}`);
  };

  const createNewEstimate = () => {
    setLocation('/estimates/create');
  };

  const handleCreateEstimate = () => {
    switch (estimateType) {
      case "standard":
        setLocation('/estimates/create');
        break;
      case "multi-service":
        setLocation('/estimates/multi-service');
        break;
      case "professional":
        setLocation('/estimates/professional');
        break;
      case "premium":
        // Premium estimates are for viewing existing ones, redirect to standard creation
        setLocation('/estimates/create');
        break;
      case "agent":
        setLocation('/agents/estimate-form');
        break;
      case "agent-service":
        setLocation('/agents/service-estimate');
        break;
      default:
        setLocation('/estimates/create');
    }
  };

  const editEstimate = (estimate: any) => {
    // Navigate to clean vendor estimate form for editing
    setLocation(`/estimates/edit/${estimate.id}`);
  };

  const printEstimate = (estimate: any) => {
    // Open estimate in new window for printing
    window.open(`/estimates/${estimate.id}/print`, '_blank');
  };

  const deleteEstimate = async (estimate: any) => {
    if (window.confirm(`Are you sure you want to delete estimate ${estimate.estimate_number || estimate.estimateNumber || estimate.id}?`)) {
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

  const handleStatusChange = (estimate: any, status: string) => {
    const statusMessages = {
      'sent': {
        title: 'Mark as Sent',
        description: `Are you sure you want to mark estimate ${estimate.estimate_number || estimate.estimateNumber || estimate.id} as sent to the client?`,
        confirmText: 'Send',
        cancelText: 'Cancel'
      },
      'accepted': {
        title: 'Accept Estimate',
        description: `Are you sure you want to accept estimate ${estimate.estimate_number || estimate.estimateNumber || estimate.id}? This will mark it as approved by the client.`,
        confirmText: 'Accept',
        cancelText: 'Cancel'
      },
      'rejected': {
        title: 'Reject Estimate',
        description: `Are you sure you want to reject estimate ${estimate.estimate_number || estimate.estimateNumber || estimate.id}? This will mark it as declined by the client.`,
        confirmText: 'Reject',
        cancelText: 'Cancel'
      }
    };

    const message = statusMessages[status as keyof typeof statusMessages];
    
    setConfirmDialog({
      isOpen: true,
      title: message.title,
      description: message.description,
      action: () => {
        updateEstimateStatusMutation.mutate(
          { id: estimate.id, status },
          {
            onSuccess: () => {
              toast({
                title: "Status Updated",
                description: `Estimate status has been updated to ${status}.`,
              });
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
          }
        );
      },
      confirmText: message.confirmText,
      cancelText: message.cancelText
    });
  };

  const handleConvertToInvoice = (estimate: any) => {
    if (estimate.status !== 'accepted') {
      toast({
        title: "Action not allowed",
        description: "Only accepted estimates can be converted to work orders.",
        variant: "destructive",
      });
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      title: 'Convert to Work Order',
              description: `Are you sure you want to convert estimate ${estimate.estimate_number || estimate.estimateNumber || estimate.id} to a work order? This will create an invoice and mark the estimate as converted.`,
      action: () => {
        convertToInvoiceMutation.mutate(estimate.id, {
          onSuccess: (data) => {
            toast({
              title: "Work Order Created",
              description: `Work order has been created from the estimate.`,
            });
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
      },
      confirmText: 'Convert',
      cancelText: 'Cancel'
    });
  };

  const handleSendEstimate = (estimate: any) => {
    // Use the existing handleStatusChange which now has confirmation
    handleStatusChange(estimate, 'sent');
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-slate-400" />;
    }
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 text-amber-400" />
      : <ChevronDown className="h-4 w-4 text-amber-400" />;
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
        <div className="remodra-content">
          <main className="p-8 space-y-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
          {/* Header with Remodra branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/remodra-logo.png" 
                alt="Remodra Logo" 
                className="h-16 w-16 object-contain"
              />
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
            <div className="flex gap-2">
              <Select value={estimateType} onValueChange={(value: string) => setEstimateType(value)}>
                <SelectTrigger className="remodra-input w-48">
                  <SelectValue placeholder="Select estimate type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="agent" className="text-slate-200 hover:bg-slate-700">Agent Estimate</SelectItem>
                  <SelectItem value="agent-service" className="text-slate-200 hover:bg-slate-700">Agent Service Estimate</SelectItem>
                </SelectContent>
              </Select>
              <Button className="remodra-button" onClick={handleCreateEstimate}>
                <FileText className="h-5 w-5 mr-2" />
                Create Estimate
              </Button>
            </div>
            <Button className="remodra-button-outline" onClick={() => {
              // Export functionality
              const csvContent = "data:text/csv;charset=utf-8," + 
                "Estimate Number,Client,Status,Total,Issue Date,Expiry Date\n" +
                (estimates as any[]).map(e => 
                  `"${e.estimate_number || e.estimateNumber}","${e.client?.first_name || e.client?.firstName || ''} ${e.client?.last_name || e.client?.lastName || ''}","${e.status}","${e.total || 0}","${new Date(e.issue_date || e.issueDate).toLocaleDateString()}","${new Date(e.expiry_date || e.expiryDate).toLocaleDateString()}"`
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
                <p className="text-red-400">Error loading estimates: {(error as any)?.message || 'Unknown error'}</p>
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
                      <th 
                        className="text-left py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors"
                        onClick={() => handleSort("estimate")}
                      >
                        <div className="flex items-center gap-2">
                          Estimate
                          {getSortIcon("estimate")}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors"
                        onClick={() => handleSort("client")}
                      >
                        <div className="flex items-center gap-2">
                          Client
                          {getSortIcon("client")}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors"
                        onClick={() => handleSort("amount")}
                      >
                        <div className="flex items-center gap-2">
                          Amount
                          {getSortIcon("amount")}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center gap-2">
                          Status
                          {getSortIcon("status")}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors"
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          {getSortIcon("date")}
                        </div>
                      </th>
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
                                {estimate.estimate_number || estimate.estimateNumber || `EST-${estimate.id}`}
                              </div>
                              {estimate.title && (
                                <div className="text-xs text-slate-400 truncate max-w-[200px]">{estimate.title}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-300">
                            {estimate.client?.first_name && estimate.client?.last_name 
                              ? `${estimate.client.first_name} ${estimate.client.last_name}`
                              : estimate.client?.name 
                              ? estimate.client.name
                              : estimate.clientId 
                              ? `Client ID: ${estimate.clientId}`
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
                          {getStatusBadge(estimate.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-300">
                            {new Date(estimate.created_at || estimate.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Status-based actions */}
                            {estimate.status === 'draft' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 h-8 px-3"
                                  onClick={() => handleSendEstimate(estimate)}
                                  disabled={updateEstimateStatusMutation.isPending}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Send
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="remodra-button-outline h-8 px-3"
                                  onClick={() => editEstimate(estimate)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </>
                            )}
                            
                            {estimate.status === 'sent' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                                  onClick={() => handleStatusChange(estimate, 'accepted')}
                                  disabled={updateEstimateStatusMutation.isPending}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                                  onClick={() => handleStatusChange(estimate, 'rejected')}
                                  disabled={updateEstimateStatusMutation.isPending}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="remodra-button-outline h-8 px-3"
                                  onClick={() => editEstimate(estimate)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </>
                            )}
                            
                            {estimate.status === 'rejected' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 h-8 px-3"
                                  onClick={() => handleStatusChange(estimate, 'sent')}
                                  disabled={updateEstimateStatusMutation.isPending}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Resend
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                                  onClick={() => handleStatusChange(estimate, 'accepted')}
                                  disabled={updateEstimateStatusMutation.isPending}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="remodra-button-outline h-8 px-3"
                                  onClick={() => editEstimate(estimate)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </>
                            )}
                            
                            {estimate.status === 'accepted' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
                                  onClick={() => handleConvertToInvoice(estimate)}
                                  disabled={convertToInvoiceMutation.isPending}
                                >
                                  <BanknoteIcon className="h-3 w-3 mr-1" />
                                  Convert to Invoice
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 px-3"
                                  onClick={() => handleStatusChange(estimate, 'rejected')}
                                  disabled={updateEstimateStatusMutation.isPending}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Client Said No
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="remodra-button-outline h-8 px-3"
                                  onClick={() => editEstimate(estimate)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </>
                            )}
                            
                            {/* Always available actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="remodra-button-outline h-8 w-8 p-0"
                                  title="More Actions"
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
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => printEstimate(estimate)}
                                  className="text-slate-200 hover:bg-slate-700 cursor-pointer"
                                >
                                  <Printer className="h-3 w-3 mr-2" />
                                  Print
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-600" />
                                <DropdownMenuItem 
                                  onClick={() => deleteEstimate(estimate)}
                                  className="text-red-400 hover:bg-red-600/20 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete
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
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className="bg-slate-800 border-slate-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="remodra-button-outline">
              {confirmDialog.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDialog.action}
              className="remodra-button"
            >
              {confirmDialog.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
