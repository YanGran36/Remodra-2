import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Loader2, ChevronLeft, FileText, Send, Printer, Check, X, BanknoteIcon, Download } from "lucide-react";
import { useEstimates } from '../hooks/use-estimates';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { EstimateClientLink } from '../components/estimates/estimate-client-link';
import { downloadEstimatePDF } from '../lib/pdf-generator';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

// UI Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
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
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

export default function EstimateDetailPage() {
  const [, params] = useRoute("/estimates/:id");
  const estimateId = params?.id ? parseInt(params.id) : 0;
  const [isConfirmAccept, setIsConfirmAccept] = useState(false);
  const [isConfirmReject, setIsConfirmReject] = useState(false);
  const [isConfirmConvert, setIsConfirmConvert] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getEstimate, updateEstimateStatusMutation, convertToInvoiceMutation } = useEstimates();
  const { data: estimate, isLoading, error } = getEstimate(estimateId);

  // Función para formatear fechas
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "No specified";
    return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
  };

  // Obtener clase para badge según el estado del estimado
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
      case "aceptado":
        return "bg-green-500 text-white";
      case "pending":
      case "pendiente":
        return "bg-blue-500 text-white";
      case "rejected":
      case "rechazado":
        return "bg-red-500 text-white";
      case "sent":
      case "enviado":
        return "bg-purple-500 text-white";
      case "draft":
      case "borrador":
        return "bg-gray-400 text-white";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  // Texto legible para el estado
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "Accepted";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      case "sent":
        return "Sent";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  // Funciones para manejar cambios de estado
  const handleAcceptEstimate = () => {
    setIsConfirmAccept(true);
  };

  const confirmAcceptEstimate = () => {
    updateEstimateStatusMutation.mutate(
      { id: estimateId, status: "accepted" },
      {
        onSuccess: () => {
          setIsConfirmAccept(false);
        }
      }
    );
  };

  const handleRejectEstimate = () => {
    setIsConfirmReject(true);
  };

  const confirmRejectEstimate = () => {
    updateEstimateStatusMutation.mutate(
      { id: estimateId, status: "rejected" },
      {
        onSuccess: () => {
          setIsConfirmReject(false);
        }
      }
    );
  };

  // Función para convertir a orden de trabajo
  const handleConvertToWorkOrder = () => {
    setIsConfirmConvert(true);
  };

  // Confirmar la conversión a orden de trabajo
  const confirmConvertToWorkOrder = () => {
    convertToInvoiceMutation.mutate(
      estimateId,
      {
        onSuccess: (data) => {
          setIsConfirmConvert(false);
          toast({
            title: "Work order created",
            description: `Work order ${data.invoice?.invoiceNumber} has been created from the estimate. The estimate status has been updated to 'converted'.`,
          });
          // Stay on estimate page, status will be updated
        }
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

  if (error || !estimate) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/estimates">
            <Button variant="ghost" className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Estimates
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="text-gray-600 mt-2">
            {error 
              ? `An error occurred: ${error.message}` 
              : "Could not find the requested estimate."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <div className="container py-8">
      <div className="mb-6">
        <Link href="/estimates">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Estimates
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Estimate {estimate.estimate_number || estimate.estimateNumber || `EST-${estimate.id}`}
            </h1>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusClass(estimate.status)}>
                {getStatusText(estimate.status)}
              </Badge>
              {estimate.total && (
                <Badge variant="outline">
                  {formatCurrency(Number(estimate.total))}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={async () => {
              try {
                if (!user) {
                  toast({
                    title: "Error",
                    description: "Usuario no autenticado",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Preparar datos para el PDF
                const pdfData = {
                  estimateNumber: estimate.estimateNumber || `#${estimate.id}`,
                  status: estimate.status,
                  issueDate: estimate.issueDate,
                  expiryDate: estimate.expiryDate,
                  subtotal: estimate.subtotal,
                  tax: estimate.tax,
                  discount: estimate.discount,
                  total: estimate.total,
                  terms: estimate.terms,
                  notes: estimate.notes,
                  items: estimate.items || [],
                  client: {
                    firstName: estimate.client?.firstName || "",
                    lastName: estimate.client?.lastName || "",
                    email: estimate.client?.email || undefined,
                    phone: estimate.client?.phone || undefined,
                    address: estimate.client?.address || undefined,
                    city: estimate.client?.city || undefined,
                    state: estimate.client?.state || undefined,
                    zip: estimate.client?.zip || undefined
                  },
                  contractor: {
                    businessName: user.companyName || `${user.firstName} ${user.lastName}`,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone || undefined,
                    address: user.address || undefined,
                    city: undefined, // No tenemos esta información en el modelo de usuario
                    state: undefined, // No tenemos esta información en el modelo de usuario
                    zip: undefined // No tenemos esta información en el modelo de usuario
                  },
                  projectTitle: estimate.project?.title,
                  projectDescription: estimate.project?.description
                };
                
                // Generate and download the PDF (using template settings)
                await downloadEstimatePDF(pdfData);
                
                toast({
                  title: "PDF Generated",
                  description: "The estimate PDF has been downloaded successfully with your template settings.",
                });
              } catch (error) {
                console.error("Error generating PDF:", error);
                toast({
                  title: "Error Generating PDF",
                  description: error instanceof Error ? error.message : "Unknown error",
                  variant: "destructive"
                });
              }
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            
            <Button variant="outline" onClick={() => {
              // Redirigir a la versión de impresión
              window.open(`/estimates/${estimate.id}/print`, '_blank');
              toast({
                title: "Print View",
                description: "Print view of the estimate has been opened."
              });
            }}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            
            {estimate.status === "accepted" && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleConvertToWorkOrder}
              >
                <BanknoteIcon className="h-4 w-4 mr-2" />
                Convert to Invoice
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="col-span-1 lg:col-span-3">
          <EstimateClientLink 
            estimateId={estimate.id} 
            estimateNumber={estimate.estimateNumber || `#${estimate.id}`}
            clientEmail={estimate.client?.email}
            onSendEmail={() => {
              toast({
                title: "Email Sending",
                description: "This functionality will be implemented soon.",
              });
            }}
          />
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{estimate.client?.firstName} {estimate.client?.lastName}</p>
              <p className="text-sm text-gray-600">{estimate.client?.email}</p>
              <p className="text-sm text-gray-600">{estimate.client?.phone}</p>
            </div>
            {estimate.client?.address && (
              <div>
                <p className="text-sm text-gray-600">{estimate.client?.address}</p>
                <p className="text-sm text-gray-600">
                  {estimate.client?.city}, {estimate.client?.state} {estimate.client?.zip}
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
              <p className="font-medium">{estimate.project?.title || "No specified"}</p>
              <p className="text-sm text-gray-600">{estimate.project?.description || ""}</p>
            </div>
            {estimate.project?.address && (
              <div>
                <p className="text-sm text-gray-600 font-medium mt-2">Project Address:</p>
                <p className="text-sm text-gray-600">{estimate.project?.address}</p>
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
              <span className="text-sm text-gray-600">Issue Date:</span>
              <span className="text-sm">{formatDate(estimate.issueDate)}</span>
            </div>
            {estimate.expiryDate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Expiry Date:</span>
                <span className="text-sm">{formatDate(estimate.expiryDate)}</span>
              </div>
            )}
            {estimate.project?.startDate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estimated Start:</span>
                <span className="text-sm">{formatDate(estimate.project.startDate)}</span>
              </div>
            )}
            {estimate.project?.endDate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estimated End:</span>
                <span className="text-sm">{formatDate(estimate.project.endDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="items" className="mb-6">
        <TabsList>
          <TabsTrigger value="items">Estimate Items</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
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
                  {estimate.items && estimate.items.length > 0 ? (
                    estimate.items.map((item: any) => (
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
                        No items in this estimate
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                    <TableCell>{formatCurrency(Number(estimate.subtotal) || 0)}</TableCell>
                  </TableRow>
                  {Number(estimate.tax) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Tax ({estimate.tax}%)</TableCell>
                      <TableCell>{formatCurrency((Number(estimate.subtotal) * Number(estimate.tax)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  {Number(estimate.discount) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Discount ({estimate.discount}%)</TableCell>
                      <TableCell>-{formatCurrency((Number(estimate.subtotal) * Number(estimate.discount)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                    <TableCell className="font-bold">{formatCurrency(Number(estimate.total) || 0)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="terms">
          <Card>
            <CardContent className="py-4">
              {estimate.terms ? (
                <div className="prose max-w-none">
                  <p>{estimate.terms}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No terms and conditions have been specified for this estimate.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes">
          <Card>
            <CardContent className="py-4">
              {estimate.notes ? (
                <div className="prose max-w-none">
                  <p>{estimate.notes}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No additional notes for this estimate.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {estimate.status === "pending" && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="destructive"
            onClick={handleRejectEstimate}
            className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleAcceptEstimate}
          >
            <Check className="h-4 w-4 mr-2" />
            Accept
          </Button>
        </div>
      )}
      
      {/* Diálogos de confirmación */}
      <AlertDialog open={isConfirmAccept} onOpenChange={setIsConfirmAccept}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              By accepting this estimate, the client will be notified that their proposal has been approved and work can proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAcceptEstimate} className="bg-green-600 hover:bg-green-700">
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isConfirmReject} onOpenChange={setIsConfirmReject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              By rejecting this estimate, the client will be notified that their proposal has not been accepted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRejectEstimate} className="bg-destructive hover:bg-destructive/90">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isConfirmConvert} onOpenChange={setIsConfirmConvert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will convert the accepted estimate into an invoice. Items, prices, and client data will be automatically transferred.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConvertToWorkOrder} className="bg-blue-600 hover:bg-blue-700">
              Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}