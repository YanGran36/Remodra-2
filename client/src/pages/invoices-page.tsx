import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronDown, 
  BanknoteIcon, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  FileEdit, 
  Mail, 
  Download, 
  Eye, 
  Trash2,
  Calendar, 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";
import InvoiceDetail from "@/components/invoices/invoice-detail";
import InvoiceForm from "@/components/invoices/invoice-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Helper function to get status badge style
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>;
    case 'paid':
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
    case 'overdue':
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  // Fetch invoices
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ["/api/protected/invoices"],
  });

  // Filter and sort invoices
  const filteredInvoices = invoices
    ? invoices
        .filter((invoice: any) => {
          // Status filter
          if (statusFilter !== "all" && invoice.status !== statusFilter) {
            return false;
          }
          
          // Search filter
          if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            return (
              invoice.invoiceNumber.toLowerCase().includes(lowerCaseQuery) ||
              invoice.client?.firstName.toLowerCase().includes(lowerCaseQuery) ||
              invoice.client?.lastName.toLowerCase().includes(lowerCaseQuery) ||
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
          } else if (sortBy === "due_date") {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          return 0;
        })
    : [];

  const viewInvoiceDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsDetailOpen(true);
  };

  const createNewInvoice = () => {
    setEditingInvoice(null);
    setIsFormOpen(true);
  };

  const editInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const calculateTotals = () => {
    if (!invoices) return { total: 0, count: 0, overdue: 0, paid: 0 };
    
    const total = invoices.reduce((sum: number, invoice: any) => {
      return sum + parseFloat(invoice.total);
    }, 0);

    const paid = invoices.reduce((sum: number, invoice: any) => {
      return invoice.status === 'paid' ? sum + parseFloat(invoice.total) : sum;
    }, 0);

    const overdue = invoices.reduce((sum: number, invoice: any) => {
      return invoice.status === 'overdue' ? sum + parseFloat(invoice.total) : sum;
    }, 0);
    
    return { 
      total, 
      count: invoices.length,
      paid,
      overdue
    };
  };

  const totals = calculateTotals();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <PageHeader 
            title="Invoices" 
            description="Create and manage customer invoices"
            actions={
              <Button className="flex items-center" onClick={createNewInvoice}>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            }
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.count}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.overdue)}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <SearchInput 
                    placeholder="Search invoices..." 
                    onSearch={setSearchQuery}
                    className="w-full sm:w-80"
                  />
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Newest First</SelectItem>
                      <SelectItem value="date_asc">Oldest First</SelectItem>
                      <SelectItem value="amount_desc">Highest Amount</SelectItem>
                      <SelectItem value="amount_asc">Lowest Amount</SelectItem>
                      <SelectItem value="due_date">Due Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-9 w-12 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                          Error loading invoices. Please try again.
                        </TableCell>
                      </TableRow>
                    ) : filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center">
                            <BanknoteIcon className="h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices found</h3>
                            <p className="text-sm text-gray-500 mb-4">
                              {searchQuery || statusFilter !== "all" 
                                ? "Try adjusting your filters"
                                : "Create your first invoice to get started"}
                            </p>
                            {!searchQuery && statusFilter === "all" && (
                              <Button onClick={createNewInvoice}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Invoice
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice: any) => (
                        <TableRow key={invoice.id} className="cursor-pointer hover:bg-gray-50" onClick={() => viewInvoiceDetails(invoice)}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.client?.firstName} {invoice.client?.lastName}</TableCell>
                          <TableCell>{invoice.project?.title || "—"}</TableCell>
                          <TableCell>{format(new Date(invoice.issueDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  viewInvoiceDetails(invoice);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  editInvoice(invoice);
                                }}>
                                  <FileEdit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Printer className="mr-2 h-4 w-4" />
                                  Print
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Invoice Status Overview</h3>
              <Tabs defaultValue="byStatus">
                <TabsList className="mb-4">
                  <TabsTrigger value="byStatus">By Status</TabsTrigger>
                  <TabsTrigger value="byMonth">By Month</TabsTrigger>
                </TabsList>
                
                <TabsContent value="byStatus">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-blue-100 rounded-full p-3 mr-3">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Pending</p>
                          <p className="text-xl font-bold">
                            {invoices 
                              ? invoices.filter((e: any) => e.status === 'pending').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-green-100 rounded-full p-3 mr-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Paid</p>
                          <p className="text-xl font-bold">
                            {invoices 
                              ? invoices.filter((e: any) => e.status === 'paid').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-red-100 rounded-full p-3 mr-3">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Overdue</p>
                          <p className="text-xl font-bold">
                            {invoices 
                              ? invoices.filter((e: any) => e.status === 'overdue').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-gray-100 rounded-full p-3 mr-3">
                          <XCircle className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Cancelled</p>
                          <p className="text-xl font-bold">
                            {invoices 
                              ? invoices.filter((e: any) => e.status === 'cancelled').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="byMonth">
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <p>Monthly breakdown chart would go here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Invoice Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedInvoice && (
            <InvoiceDetail 
              invoice={selectedInvoice} 
              onEdit={() => {
                setIsDetailOpen(false);
                setEditingInvoice(selectedInvoice);
                setIsFormOpen(true);
              }}
              onClose={() => setIsDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Invoice Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <InvoiceForm 
            invoice={editingInvoice} 
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              // Refetch invoices if needed
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
