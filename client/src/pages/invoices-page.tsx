import React, { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useInvoices } from '../hooks/use-invoices';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

// UI Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
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

// Icons
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Send, 
  DollarSign,
  Calendar,
  User,
  FileText,
  RefreshCw,
  MoreHorizontal,
  Check
} from 'lucide-react';

// Layout Components
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Helper function to format date
const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy', { locale: enUS });
  } catch {
    return 'Invalid Date';
  }
};

// Helper function to get status badge styling
const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
    case 'overdue':
      return <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>;
    case 'draft':
      return <Badge className="bg-gray-500 hover:bg-gray-600">Draft</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-700 hover:bg-red-800">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
  }
};

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  const { toast } = useToast();
  const { 
    invoices, 
    isLoadingInvoices, 
    deleteInvoiceMutation,
    refetchInvoices 
  } = useInvoices();

  // Filter invoices based on search and status
  const filteredInvoices = invoices?.filter((invoice: any) => {
    const clientName = invoice.client ? `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim() : '';
    const projectTitle = invoice.project?.title || '';
    
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Handle delete confirmation
  const handleDeleteClick = (invoice: any) => {
    setInvoiceToDelete(invoice);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (invoiceToDelete) {
      try {
        await deleteInvoiceMutation.mutateAsync(invoiceToDelete.id);
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
        toast({
          title: 'Invoice deleted',
          description: 'The invoice has been deleted successfully.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete invoice.',
          variant: 'destructive',
        });
      }
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchInvoices();
    toast({
      title: 'Data refreshed',
      description: 'Invoice data has been refreshed.',
    });
  };

  // Calculate summary stats
  const totalInvoices = filteredInvoices.length;
  const totalAmount = filteredInvoices.reduce((sum: number, invoice: any) => sum + (parseFloat(invoice.total) || 0), 0);
  const paidAmount = filteredInvoices
    .filter((invoice: any) => invoice.status?.toLowerCase() === 'paid')
    .reduce((sum: number, invoice: any) => sum + (parseFloat(invoice.total) || 0), 0);
  const pendingAmount = filteredInvoices
    .filter((invoice: any) => invoice.status?.toLowerCase() === 'pending')
    .reduce((sum: number, invoice: any) => sum + (parseFloat(invoice.total) || 0), 0);

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <main className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img 
                  src="/remodra-logo.png" 
                  alt="Remodra Logo" 
                  className="h-16 w-16 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-amber-400 mb-2">Invoices</h1>
              <p className="text-slate-400">Manage your invoices and payments</p>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center gap-4 mb-8">
              <Button asChild>
                <Link href="/invoices/create">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Invoice
                </Link>
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Total Invoices</p>
                      <p className="text-2xl font-bold text-amber-400">{totalInvoices}</p>
                    </div>
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Total Amount</p>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAmount)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Paid Amount</p>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(paidAmount)}</p>
                    </div>
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Pending Amount</p>
                      <p className="text-2xl font-bold text-yellow-400">{formatCurrency(pendingAmount)}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="bg-slate-800 border-slate-600">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search invoices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={viewMode} onValueChange={(value: 'table' | 'cards') => setViewMode(value)}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="View mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Table View</SelectItem>
                      <SelectItem value="cards">Card View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Invoices List */}
            <Card className="bg-slate-800 border-slate-600">
              <CardHeader>
                <CardTitle className="text-amber-400">Invoice Directory</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInvoices ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto"></div>
                    <p className="mt-2 text-slate-400">Loading invoices...</p>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📄</div>
                    <div className="text-xl font-semibold text-slate-200">No Invoices Found</div>
                    <div className="text-slate-400 mt-2">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'No invoices match your filters' 
                        : 'Start by creating your first invoice'}
                    </div>
                    <Button className="mt-4" asChild>
                      <Link href="/invoices/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Invoice
                      </Link>
                    </Button>
                  </div>
                ) : viewMode === 'table' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <Link href={`/invoices/${invoice.id}`} className="text-amber-400 hover:underline">
                              {invoice.invoice_number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {invoice.client ? `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                          </TableCell>
                          <TableCell>{invoice.project?.title || 'N/A'}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>{formatDate(invoice.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/invoices/${invoice.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteClick(invoice)}
                                className="border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInvoices.map((invoice: any) => (
                      <Card key={invoice.id} className="bg-slate-700 border-slate-600 hover:shadow-lg transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                <Link href={`/invoices/${invoice.id}`} className="text-amber-400 hover:underline">
                                  {invoice.invoice_number}
                                </Link>
                              </CardTitle>
                              <p className="text-sm text-slate-400">
                                {invoice.client ? `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                              </p>
                            </div>
                            {getStatusBadge(invoice.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-slate-400">Project</p>
                              <p className="font-medium">{invoice.project?.title || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-400">Amount</p>
                              <p className="text-xl font-bold text-green-400">{formatCurrency(invoice.total)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-400">Date</p>
                              <p className="font-medium">{formatDate(invoice.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link href={`/invoices/${invoice.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteClick(invoice)}
                                className="border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice "{invoiceToDelete?.invoice_number}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 