import { useState } from "react";
import { useInvoices } from '../hooks/use-invoices';
import { useLanguage } from '../hooks/use-language';
import { useLocation } from "wouter";
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  FileEdit, 
  Mail, 
  Download, 
  Eye, 
  Trash2,
  Calendar, 
  Clock,
  Receipt,
  Settings,
  User,
  Edit
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { format } from "date-fns";
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  // Fetch invoices
  const { invoices = [], isLoadingInvoices, invoicesError } = useInvoices();

  // Filter and sort invoices
  const filteredInvoices = invoices && Array.isArray(invoices)
    ? (invoices as any[])
        .filter((invoice: any) => {
          // Status filter
          if (statusFilter !== "all" && invoice.status !== statusFilter) {
            return false;
          }
          
          // Search filter
          if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            return (
              invoice.invoiceNumber?.toLowerCase().includes(lowerCaseQuery) ||
              invoice.client?.firstName?.toLowerCase().includes(lowerCaseQuery) ||
              invoice.client?.lastName?.toLowerCase().includes(lowerCaseQuery) ||
              (invoice.project?.title && invoice.project.title.toLowerCase().includes(lowerCaseQuery))
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

  const viewInvoiceDetails = (invoiceId: number) => {
    setLocation(`/invoices/${invoiceId}`);
  };

  const calculateTotal = () => {
    if (!invoices || !Array.isArray(invoices)) return { total: 0, count: 0, paid: 0, pending: 0 };
    
    let total = 0;
    let paid = 0;
    let pending = 0;
    
    (invoices as any[]).forEach((invoice: any) => {
      const invoiceTotal = parseFloat(invoice.total || 0);
      total += invoiceTotal;
      
      if (invoice.status.toLowerCase() === 'paid' || invoice.status.toLowerCase() === 'pagado') {
        paid += invoiceTotal;
      } else {
        pending += invoiceTotal;
      }
    });
    
    return { 
      total, 
      count: invoices.length,
      paid,
      pending
    };
  };

  const { total, count, paid, pending } = calculateTotal();

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
              Invoices
            </h1>
            <p className="remodra-subtitle">
              Manage your billing and payments professionally
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button className="remodra-button">
              <Receipt className="h-5 w-5 mr-2" />
              New Invoice
            </Button>
            <Button className="remodra-button-outline">
              <Download className="h-5 w-5 mr-2" />
              Export Invoices
            </Button>
            <Button className="remodra-button-outline">
              <Settings className="h-5 w-5 mr-2" />
              Invoice Settings
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{count}</div>
              <div className="remodra-stats-label">Total Invoices</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{formatCurrency(total)}</div>
              <div className="remodra-stats-label">Total Amount</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{formatCurrency(paid)}</div>
              <div className="remodra-stats-label">Paid Amount</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{formatCurrency(pending)}</div>
              <div className="remodra-stats-label">Pending Amount</div>
              <div className="remodra-stats-accent"></div>
            </div>
          </div>

          {/* Filters */}
          <div className="remodra-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
                <SelectTrigger className="remodra-input w-full lg:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">All Status</SelectItem>
                  <SelectItem value="paid" className="text-slate-200 hover:bg-slate-700">Paid</SelectItem>
                  <SelectItem value="pending" className="text-slate-200 hover:bg-slate-700">Pending</SelectItem>
                  <SelectItem value="overdue" className="text-slate-200 hover:bg-slate-700">Overdue</SelectItem>
                  <SelectItem value="partially_paid" className="text-slate-200 hover:bg-slate-700">Partially Paid</SelectItem>
                  <SelectItem value="cancelled" className="text-slate-200 hover:bg-slate-700">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: string) => setSortBy(value)}>
                <SelectTrigger className="remodra-input w-full lg:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="date_desc" className="text-slate-200 hover:bg-slate-700">Newest First</SelectItem>
                  <SelectItem value="date_asc" className="text-slate-200 hover:bg-slate-700">Oldest First</SelectItem>
                  <SelectItem value="amount_desc" className="text-slate-200 hover:bg-slate-700">Highest Amount</SelectItem>
                  <SelectItem value="amount_asc" className="text-slate-200 hover:bg-slate-700">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoices List */}
          <div className="remodra-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-400">Invoice Directory</h2>
              <Badge className="remodra-badge">
                {filteredInvoices.length} Invoices
              </Badge>
            </div>

            {isLoadingInvoices ? (
              <div className="remodra-loading">
                <div className="remodra-spinner"></div>
                <p className="text-slate-300">Loading invoices...</p>
              </div>
            ) : invoicesError ? (
              <div className="text-center py-8">
                <p className="text-red-400">Error loading invoices: {invoicesError.message}</p>
                <Button 
                  className="remodra-button mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="remodra-empty">
                <div className="remodra-empty-icon">📄</div>
                <div className="remodra-empty-title">No Invoices Found</div>
                <div className="remodra-empty-description">
                  {searchQuery ? `No invoices match "${searchQuery}"` : "Start by creating your first invoice"}
                </div>
                <Button className="remodra-button mt-4">
                  <Receipt className="h-4 w-4 mr-2" />
                  Create First Invoice
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Invoice</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Client</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Project</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice: any) => (
                      <tr key={invoice.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded flex items-center justify-center">
                              <Receipt className="h-4 w-4 text-slate-900" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-200">
                                {invoice.invoiceNumber || `#${invoice.id}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200">
                            {invoice.client?.firstName} {invoice.client?.lastName}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-300 text-sm max-w-32 truncate">
                            {invoice.project?.title || 'No Project'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-amber-400 font-semibold">
                            {formatCurrency(invoice.total || 0)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${
                            invoice.status === 'paid' ? 'remodra-badge' :
                            invoice.status === 'overdue' ? 'border-red-600/50 text-red-400' :
                            'remodra-badge-outline'
                          }`}>
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-300 text-sm">
                            {invoice.issueDate ? format(new Date(invoice.issueDate), 'MMM dd, yyyy') : 'No date'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewInvoiceDetails(invoice.id)}
                              className="remodra-button-outline h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="remodra-button-outline h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="remodra-button-outline h-8 w-8 p-0"
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="remodra-button-outline h-8 w-8 p-0"
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
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