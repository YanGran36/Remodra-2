import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Loader2, ChevronLeft, FileText, Send, Printer, Check, DollarSign, Receipt, Ban, RefreshCw } from "lucide-react";
import { useInvoices } from '../hooks/use-invoices';
import { useToast } from '../hooks/use-toast';
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

// Layout Components
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

// UI Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../components/ui/table';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Professional Components
import PaymentTracking from '../components/invoices/payment-tracking';
import PaymentForm from '../components/invoices/payment-form';
import PaymentSuccessNotification from '../components/invoices/payment-success-notification';

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Schema for payment form
const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function InvoiceDetailPage() {
  const [, params] = useRoute("/invoices/:id");
  const invoiceId = params?.id ? parseInt(params.id) : 0;
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelNotes, setCancelNotes] = useState("");
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  
  const { toast } = useToast();
  const { 
    getInvoice, 
    registerPaymentMutation, 
    updateInvoiceStatusMutation,
    cancelInvoiceMutation,
    refundPaymentMutation,
    refetchInvoices
  } = useInvoices();
  const { data: invoice, isLoading, error, refetch } = getInvoice(invoiceId);

  // Force refresh when component mounts
  useEffect(() => {
    if (invoiceId) {
      refetch();
    }
  }, [invoiceId, refetch]);

  // Manual refresh function
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Data refreshed",
      description: "Invoice data has been refreshed.",
    });
  };

  // Payment registration form
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  // Function to format dates
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "Not specified";
    return format(new Date(dateString), "MMMM d, yyyy", { locale: enUS });
  };

  // Get class for badge according to invoice status
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "!bg-green-400 !text-green-900 !border-green-300 font-semibold";
      case "pending":
        return "!bg-yellow-400 !text-yellow-900 !border-yellow-300 font-semibold";
      case "overdue":
        return "!bg-red-400 !text-red-900 !border-red-300 font-semibold";
      case "partially_paid":
        return "!bg-cyan-400 !text-cyan-900 !border-cyan-300 font-semibold";
      case "cancelled":
        return "!bg-rose-400 !text-rose-900 !border-rose-300 font-semibold";
      default:
        return "!bg-gray-400 !text-gray-900 !border-gray-300 font-semibold";
    }
  };

  // Readable text for status
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "Paid";
      case "pending":
        return "Pending";
      case "overdue":
        return "Overdue";
      case "partially_paid":
        return "Partial Paid";
      case "cancelled":
        return "Cancelled";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Register a payment using the new professional form
  const handlePaymentSubmit = async (paymentData: any) => {
    try {
      const result = await registerPaymentMutation.mutateAsync({
        id: invoiceId,
        data: {
          amount: paymentData.amount.toString(),
          paymentMethod: paymentData.paymentMethod,
          paymentDate: paymentData.paymentDate,
          notes: paymentData.notes,
        },
      });
      setIsPaymentModalOpen(false);
      // Fetch the latest invoice data after payment
      const updatedInvoiceResult = await refetch();
      const updatedInvoice = updatedInvoiceResult.data;
      // Show payment success notification with project creation details
      if (result) {
        setPaymentSuccessData({
          payment: {
            amount: parseFloat(paymentData.amount),
            method: paymentData.paymentMethod,
            paymentDate: paymentData.paymentDate || new Date().toISOString(),
          },
          invoice: {
            invoiceNumber: updatedInvoice?.invoiceNumber || `#${invoiceId}`,
            total: Number(updatedInvoice?.total ?? 0),
            amountPaid: Number(updatedInvoice?.amountPaid ?? 0),
          },
          projectUpdate: result.projectUpdate || {
            updated: false,
            message: ""
          }
        });
        setShowPaymentSuccess(true);
      }
      // Show enhanced toast notification based on project creation
      if (result.projectUpdate?.updated) {
        const projectUpdate = result.projectUpdate as { message?: string };
        toast({
          title: "Payment recorded & Project created!",
          description: `Payment recorded successfully. ${projectUpdate.message || 'Project created automatically.'}`,
        });
      } else {
        toast({
          title: "Payment recorded",
          description: "Payment has been successfully recorded.",
        });
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      toast({
        title: "Payment failed",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Refund a payment
  const handleRefundPayment = async (paymentId: number, reason: string) => {
    try {
      await refundPaymentMutation.mutateAsync({
        invoiceId,
        paymentId,
        reason
      });
      
      // Refresh the invoice data
      await refetch();
      
      toast({
        title: "Payment refunded",
        description: "The payment has been refunded successfully.",
      });
    } catch (error) {
      console.error('Refund error:', error);
      toast({
        title: "Refund failed",
        description: "Failed to refund payment. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Mark as paid
  const handleMarkAsPaid = () => {
    updateInvoiceStatusMutation.mutate(
      { id: invoiceId, status: "paid" },
      {
        onSuccess: () => {
          toast({
            title: "Status updated",
            description: "The invoice has been marked as paid.",
          });
        },
      }
    );
  };
  
  // Cancel invoice
  const handleCancelInvoice = () => {
    cancelInvoiceMutation.mutate(
      { 
        id: invoiceId, 
        notes: cancelNotes 
      },
      {
        onSuccess: () => {
          setIsCancelModalOpen(false);
          setCancelNotes("");
          toast({
            title: "Invoice cancelled",
            description: "The invoice has been cancelled successfully.",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="remodra-layout">
        <Sidebar />
        <MobileSidebar />
        <div className="remodra-main">
          <TopNav />
          <div className="remodra-content">
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="remodra-layout">
        <Sidebar />
        <MobileSidebar />
        <div className="remodra-main">
          <TopNav />
          <div className="remodra-content">
            <main className="p-8">
              <div className="mb-6">
                <Link href="/invoices">
                  <Button variant="ghost" className="mb-4 text-slate-300 hover:text-amber-400">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to invoices
                  </Button>
                </Link>
                
                <h1 className="text-2xl font-bold text-amber-400">Invoice not found</h1>
                <p className="text-slate-400 mt-2">
                  {error 
                    ? "An error occurred while loading the invoice" 
                    : "The requested invoice could not be found. The invoice may have been deleted or not yet created."
                  }
                </p>
                <div className="mt-6">
                  <h2 className="text-lg font-medium mb-2 text-slate-200">Suggestions:</h2>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li>Verify that you are accessing an existing invoice</li>
                    <li>To create a new invoice, you can convert an accepted estimate to an invoice</li>
                    <li>Check the estimates page to see if there are any that can be converted to invoices</li>
                  </ul>
                  <div className="mt-6">
                    <Link href="/estimates">
                      <Button className="remodra-button">
                        <FileText className="h-4 w-4 mr-2" />
                        View estimates
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // Calculate if it's overdue
  const isDueDate = invoice.dueDate ? new Date(invoice.dueDate) < new Date() : false;
  const isPending = invoice.status === "pending";
  const isOverdue = isPending && isDueDate;

  // Calculate pending amount
  const amountPaid = parseFloat(invoice.amountPaid || "0");
  const total = parseFloat(invoice.total || "0");
  const pendingAmount = total - amountPaid;
  const isPaidInFull = pendingAmount <= 0;

  // --- REMOVE the summaryRows and summary section at the top ---
  // --- NEW: Simple summary section ---
  // const summaryRows = [
  //   { label: "Total Amount", value: formatCurrency(total) },
  //   { label: "Amount Paid", value: formatCurrency(amountPaid) },
  //   { label: "Remaining Balance", value: formatCurrency(Math.max(pendingAmount, 0)) }
  // ];

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <main className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen p-8 space-y-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img 
                  src="/remodra-logo.png" 
                  alt="Remodra Logo" 
                  className="h-16 w-16 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-amber-400 mb-2">Invoice Details</h1>
              <p className="text-slate-400">Manage invoice information and payments</p>
            </div>

            <div className="mb-6">
              <Link href="/invoices">
                <Button variant="ghost" className="mb-4 text-slate-300 hover:text-amber-400">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to invoices
                </Button>
              </Link>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-200">
                    Invoice {invoice.invoice_number || invoice.invoiceNumber || `#${invoice.id}`}
                  </h1>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusClass(isOverdue ? "overdue" : invoice.status)}>
                      {getStatusText(isOverdue ? "overdue" : invoice.status)}
                    </Badge>
                    {invoice.total && (
                      <Badge variant="outline" className="text-slate-300 border-slate-600">
                        {formatCurrency(Number(invoice.total))}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => {
                    toast({
                      title: "Feature in development",
                      description: "Print functionality will be implemented soon.",
                    });
                  }} className="remodra-button-outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  
                  <Button variant="outline" onClick={handleRefresh} className="remodra-button-outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  
                  {!isPaidInFull && (
                    <Button 
                      className="remodra-button"
                      onClick={() => setIsPaymentModalOpen(true)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Register payment
                    </Button>
                  )}
                  
                  {/* Cancel button, only visible if invoice is not cancelled or paid */}
                  {invoice.status !== "cancelled" && invoice.status !== "paid" && (
                    <Button 
                      variant="outline" 
                      className="text-red-400 border-red-600/50 hover:bg-red-600 hover:border-red-600 hover:text-white"
                      onClick={() => setIsCancelModalOpen(true)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Cancel invoice
                    </Button>
                  )}
                </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="remodra-card">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
            <CardTitle className="text-sm font-medium text-amber-400">Total Amount</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(Number(invoice.total) || 0)}</div>
          </CardContent>
        </Card>
        
        <Card className="remodra-card">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
            <CardTitle className="text-sm font-medium text-amber-400">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-400">{formatCurrency(Number(invoice.amountPaid) || 0)}</div>
          </CardContent>
        </Card>
        
        <Card className="remodra-card">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
            <CardTitle className="text-sm font-medium text-amber-400">Balance Due</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${pendingAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(Math.max(pendingAmount, 0))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="remodra-card">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
            <CardTitle className="text-sm font-medium text-amber-400">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Badge className={getStatusClass(isOverdue ? "overdue" : invoice.status)}>
                {getStatusText(isOverdue ? "overdue" : invoice.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="remodra-card">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
            <CardTitle className="text-sm font-medium text-amber-400">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-slate-200">{invoice.client?.firstName} {invoice.client?.lastName}</p>
              <p className="text-sm text-slate-400">{invoice.client?.email}</p>
              <p className="text-sm text-slate-400">{invoice.client?.phone}</p>
            </div>
            {invoice.client?.address && (
              <div className="pt-2 border-t border-slate-600">
                <p className="text-sm text-slate-400">{invoice.client?.address}</p>
                <p className="text-sm text-slate-400">
                  {invoice.client?.city}, {invoice.client?.state} {invoice.client?.zip}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="remodra-card">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
            <CardTitle className="text-sm font-medium text-amber-400">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-slate-200">{invoice.project?.title || "Not specified"}</p>
              <p className="text-sm text-slate-400">{invoice.project?.description || ""}</p>
            </div>
            {invoice.project?.address && (
              <div className="pt-2 border-t border-slate-600">
                <p className="text-sm text-slate-400 font-medium">Project address:</p>
                <p className="text-sm text-slate-400">{invoice.project?.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="remodra-card">
          <CardHeader className="pb-2 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
            <CardTitle className="text-sm font-medium text-amber-400">Important Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Issue date:</span>
              <span className="text-sm font-medium text-slate-200">{formatDate(invoice.issueDate)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                <span className="text-sm text-slate-400">Due date:</span>
                <span className={`text-sm font-medium ${isOverdue ? "text-red-400" : "text-slate-200"}`}>
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="items" className="mb-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-600 rounded-lg p-1">
          <TabsTrigger 
            value="items" 
            className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
          >
            Invoice Items
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
          >
            Payments
          </TabsTrigger>
          <TabsTrigger 
            value="terms" 
            className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
          >
            Terms and Conditions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="items">
          <Card className="remodra-card">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
              <CardTitle className="text-amber-400">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-600 bg-slate-800/50">
                    <TableHead className="w-[50%] text-slate-300 font-semibold">Description</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Quantity</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Unit Price</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item: any) => (
                      <TableRow key={item.id} className="border-slate-600 hover:bg-slate-700/50 transition-colors duration-200">
                        <TableCell className="font-medium text-slate-200">
                          {item.description}
                          {item.notes && <p className="text-sm text-slate-400 mt-1">{item.notes}</p>}
                        </TableCell>
                        <TableCell className="text-slate-200">{item.quantity}</TableCell>
                        <TableCell className="text-slate-200">{formatCurrency(Number(item.unitPrice))}</TableCell>
                        <TableCell className="text-slate-200 font-medium">{formatCurrency(Number(item.amount))}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                        <div className="flex flex-col items-center">
                          <FileText className="h-8 w-8 mb-2 text-slate-600" />
                          <p>No items in this invoice</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow className="border-slate-600 bg-slate-800/30">
                    <TableCell colSpan={3} className="text-right text-slate-300 font-medium">Subtotal</TableCell>
                    <TableCell className="text-slate-200 font-medium">{formatCurrency(Number(invoice.subtotal) || 0)}</TableCell>
                  </TableRow>
                  {Number(invoice.tax) > 0 && (
                    <TableRow className="border-slate-600 bg-slate-800/30">
                      <TableCell colSpan={3} className="text-right text-slate-300">Tax ({invoice.tax}%)</TableCell>
                      <TableCell className="text-slate-200">{formatCurrency((Number(invoice.subtotal) * Number(invoice.tax)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  {Number(invoice.discount) > 0 && (
                    <TableRow className="border-slate-600 bg-slate-800/30">
                      <TableCell colSpan={3} className="text-right text-slate-300">Discount ({invoice.discount}%)</TableCell>
                      <TableCell className="text-slate-200">-{formatCurrency((Number(invoice.subtotal) * Number(invoice.discount)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="border-slate-600 bg-gradient-to-r from-amber-500/10 to-yellow-500/10">
                    <TableCell colSpan={3} className="text-right font-bold text-amber-400">Total</TableCell>
                    <TableCell className="font-bold text-amber-400 text-lg">{formatCurrency(Number(invoice.total) || 0)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card className="remodra-card">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
              <CardTitle className="text-amber-400">Payment Tracking</CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              <PaymentTracking
                total={Number(invoice.total) || 0}
                amountPaid={Number(invoice.amountPaid) || 0}
                payments={invoice.payments || []}
                status={invoice.status}
                dueDate={invoice.dueDate}
                invoiceNumber={invoice.invoiceNumber}
                onRefundPayment={(paymentId, reason) => handleRefundPayment(paymentId, reason)}
                isRefunding={refundPaymentMutation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="terms">
          <Card className="remodra-card">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
              <CardTitle className="text-amber-400">Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              {invoice.terms ? (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-600">
                    <p className="whitespace-pre-wrap text-slate-200 leading-relaxed">{invoice.terms}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="bg-slate-800/30 p-8 rounded-lg border border-slate-600">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-lg font-medium mb-2">No terms and conditions specified</p>
                    <p className="text-sm">Terms can be added when editing the invoice</p>
                  </div>
                </div>
              )}
              
              {invoice.notes && (
                <div className="mt-8 pt-6 border-t border-slate-600">
                  <h4 className="font-medium mb-4 text-slate-200 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Notes
                  </h4>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                    <p className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Registration Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Register Payment</DialogTitle>
            <DialogDescription>
              Record a payment received for this invoice
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 pb-6">
            <PaymentForm
              invoice={{
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                total: invoice.total,
                amountPaid: invoice.amountPaid,
                dueDate: invoice.dueDate,
                status: invoice.status
              }}
              onSubmit={handlePaymentSubmit}
              onCancel={() => setIsPaymentModalOpen(false)}
              isLoading={registerPaymentMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Modal */}
      <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="cancelNotes">Cancellation Reason (Optional)</Label>
            <Input
              id="cancelNotes"
              placeholder="Enter reason for cancellation"
              value={cancelNotes}
              onChange={(e) => setCancelNotes(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvoice}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelInvoiceMutation.isPending}
            >
              {cancelInvoiceMutation.isPending ? "Cancelling..." : "Cancel Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Success Notification */}
      {showPaymentSuccess && paymentSuccessData && (
        <PaymentSuccessNotification
          payment={paymentSuccessData.payment}
          invoice={paymentSuccessData.invoice}
          projectUpdate={paymentSuccessData.projectUpdate}
          onViewProject={() => {
            if (paymentSuccessData.projectUpdate?.updated) {
              // Navigate to projects page or specific project
              window.location.href = '/projects';
            }
          }}
          onViewInvoice={() => {
            setShowPaymentSuccess(false);
            refetch();
          }}
          onClose={() => setShowPaymentSuccess(false)}
        />
      )}
          </main>
        </div>
      </div>
    </div>
  );
}