import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Loader2, ChevronLeft, FileText, Send, Printer, Check, DollarSign, Receipt, Ban, RefreshCw } from "lucide-react";
import { useInvoices } from '../hooks/use-invoices';
import { useToast } from '../hooks/use-toast';
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

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
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "partially_paid":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      toast({
        title: "Payment recorded",
        description: "Payment has been successfully recorded.",
      });
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/invoices">
            <Button variant="ghost" className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to invoices
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold">Invoice not found</h1>
          <p className="text-gray-600 mt-2">
            {error 
              ? `An error occurred: ${error.message}` 
              : "The requested invoice could not be found. The invoice may have been deleted or not yet created."
            }
          </p>
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-2">Suggestions:</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Verify that you are accessing an existing invoice</li>
              <li>To create a new invoice, you can convert an accepted estimate to an invoice</li>
              <li>Check the estimates page to see if there are any that can be converted to invoices</li>
            </ul>
            <div className="mt-6">
              <Link href="/estimates">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  View estimates
                </Button>
              </Link>
            </div>
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
    <div className="container py-8">
      {/* Debug Section - Remove this after fixing */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Debug Info (Remove after fixing)</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p><strong>Raw amountPaid:</strong> "{invoice.amountPaid}" (type: {typeof invoice.amountPaid})</p>
          <p><strong>Raw total:</strong> "{invoice.total}" (type: {typeof invoice.total})</p>
          <p><strong>Calculated amountPaid:</strong> {amountPaid}</p>
          <p><strong>Calculated total:</strong> {total}</p>
          <p><strong>Calculated pendingAmount:</strong> {pendingAmount}</p>
          <p><strong>Invoice ID:</strong> {invoice.id}</p>
        </div>
      </div>

      <div className="mb-6">
        <Link href="/invoices">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to invoices
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Invoice {invoice.invoiceNumber || `#${invoice.id}`}
            </h1>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusClass(isOverdue ? "overdue" : invoice.status)}>
                {getStatusText(isOverdue ? "overdue" : invoice.status)}
              </Badge>
              {invoice.total && (
                <Badge variant="outline">
                  {formatCurrency(Number(invoice.total))}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              toast({
                title: "Feature in development",
                description: "Print functionality will be implemented soon.",
              });
            }}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            
            {/* Cancel button, only visible if invoice is not cancelled or paid */}
            {invoice.status !== "cancelled" && invoice.status !== "paid" && (
              <Button 
                variant="outline" 
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => setIsCancelModalOpen(true)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Cancel invoice
              </Button>
            )}
            
            {!isPaidInFull && (
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Register payment
              </Button>
            )}
            <Button variant="outline" onClick={handleRefresh} className="text-blue-600 hover:bg-blue-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{invoice.client?.firstName} {invoice.client?.lastName}</p>
              <p className="text-sm text-gray-600">{invoice.client?.email}</p>
              <p className="text-sm text-gray-600">{invoice.client?.phone}</p>
            </div>
            {invoice.client?.address && (
              <div>
                <p className="text-sm text-gray-600">{invoice.client?.address}</p>
                <p className="text-sm text-gray-600">
                  {invoice.client?.city}, {invoice.client?.state} {invoice.client?.zip}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{invoice.project?.title || "Not specified"}</p>
              <p className="text-sm text-gray-600">{invoice.project?.description || ""}</p>
            </div>
            {invoice.project?.address && (
              <div>
                <p className="text-sm text-gray-600 font-medium mt-2">Project address:</p>
                <p className="text-sm text-gray-600">{invoice.project?.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Important Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Issue date:</span>
              <span className="text-sm">{formatDate(invoice.issueDate)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Due date:</span>
                <span className={`text-sm ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="items" className="mb-6">
        <TabsList>
          <TabsTrigger value="items">Invoice Items</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="terms">Terms and Conditions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.description}
                          {item.notes && <p className="text-sm text-gray-500 mt-1">{item.notes}</p>}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                        <TableCell>{formatCurrency(Number(item.amount))}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No items in this invoice
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                    <TableCell>{formatCurrency(Number(invoice.subtotal) || 0)}</TableCell>
                  </TableRow>
                  {Number(invoice.tax) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Tax ({invoice.tax}%)</TableCell>
                      <TableCell>{formatCurrency((Number(invoice.subtotal) * Number(invoice.tax)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  {Number(invoice.discount) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Discount ({invoice.discount}%)</TableCell>
                      <TableCell>-{formatCurrency((Number(invoice.subtotal) * Number(invoice.discount)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                    <TableCell className="font-bold">{formatCurrency(Number(invoice.total) || 0)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardContent className="py-4">
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
          <Card>
            <CardContent className="py-4">
              <h3 className="text-lg font-semibold mb-4">Terms and Conditions</h3>
              {invoice.terms ? (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No terms and conditions specified</p>
                  <p className="text-sm">Terms can be added when editing the invoice</p>
                </div>
              )}
              
              {invoice.notes && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-2">Additional Notes</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
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
    </div>
  );
}