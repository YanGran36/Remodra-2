import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Loader2, ChevronLeft, FileText, Send, Printer, Check, DollarSign, Receipt } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Schema for payment form
const paymentSchema = z.object({
  amount: z.string().min(1, "El monto es requerido"),
  paymentMethod: z.string().min(1, "El método de pago es requerido"),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function InvoiceDetailPage() {
  const [, params] = useRoute("/invoices/:id");
  const invoiceId = params?.id ? parseInt(params.id) : 0;
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const { toast } = useToast();
  const { getInvoice, registerPaymentMutation, updateInvoiceStatusMutation } = useInvoices();
  const { data: invoice, isLoading, error } = getInvoice(invoiceId);

  // Form para registro de pago
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  // Función para formatear fechas
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "No especificada";
    return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
  };

  // Obtener clase para badge según el estado de la factura
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "pagado":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "pendiente":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue":
      case "vencido":
        return "bg-red-100 text-red-800 border-red-200";
      case "partially_paid":
      case "parcialmente_pagado":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
      case "cancelado":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Texto legible para el estado
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "Pagado";
      case "pending":
        return "Pendiente";
      case "overdue":
        return "Vencido";
      case "partially_paid":
        return "Parcialmente pagado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  // Registrar un pago
  const handlePaymentSubmit = (data: PaymentFormValues) => {
    registerPaymentMutation.mutate(
      {
        id: invoiceId,
        data: {
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate || new Date().toISOString(),
          notes: data.notes,
        },
      },
      {
        onSuccess: () => {
          setIsPaymentModalOpen(false);
          form.reset();
        },
      }
    );
  };

  // Marcar como pagada
  const handleMarkAsPaid = () => {
    updateInvoiceStatusMutation.mutate(
      { id: invoiceId, status: "paid" },
      {
        onSuccess: () => {
          toast({
            title: "Estado actualizado",
            description: "La factura ha sido marcada como pagada.",
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
              Volver a facturas
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold">Factura no encontrada</h1>
          <p className="text-gray-600 mt-2">
            {error 
              ? `Ocurrió un error: ${error.message}` 
              : "No se pudo encontrar la factura solicitada. Es posible que la factura haya sido eliminada o que aún no se haya creado."
            }
          </p>
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-2">Sugerencias:</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Verifica que estás accediendo a una factura existente</li>
              <li>Para crear una nueva factura, puedes convertir un estimado aceptado a factura</li>
              <li>Revisa la página de estimados para ver si hay alguno que se pueda convertir a factura</li>
            </ul>
            <div className="mt-6">
              <Link href="/estimates">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver estimados
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calcular si está vencida
  const isDueDate = invoice.dueDate ? new Date(invoice.dueDate) < new Date() : false;
  const isPending = invoice.status === "pending";
  const isOverdue = isPending && isDueDate;

  // Calcular monto pendiente
  const amountPaid = parseFloat(invoice.amountPaid || "0");
  const total = parseFloat(invoice.total || "0");
  const pendingAmount = total - amountPaid;
  const isPaidInFull = pendingAmount <= 0;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/invoices">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a facturas
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Factura {invoice.invoiceNumber || `#${invoice.id}`}
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
                title: "Funcionalidad en desarrollo",
                description: "La funcionalidad de impresión será implementada próximamente.",
              });
            }}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            
            {!isPaidInFull && (
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar pago
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Información del cliente</CardTitle>
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
                  {invoice.client?.city}, {invoice.client?.state} {invoice.client?.zipCode}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Detalles del proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{invoice.project?.title || "No especificado"}</p>
              <p className="text-sm text-gray-600">{invoice.project?.description || ""}</p>
            </div>
            {invoice.project?.address && (
              <div>
                <p className="text-sm text-gray-600 font-medium mt-2">Dirección del proyecto:</p>
                <p className="text-sm text-gray-600">{invoice.project?.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fechas importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fecha de emisión:</span>
              <span className="text-sm">{formatDate(invoice.issueDate)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fecha de vencimiento:</span>
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
          <TabsTrigger value="items">Ítems de la factura</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="terms">Términos y condiciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Descripción</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio unitario</TableHead>
                    <TableHead>Monto</TableHead>
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
                        No hay ítems en esta factura
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
                      <TableCell colSpan={3} className="text-right">Impuesto ({invoice.tax}%)</TableCell>
                      <TableCell>{formatCurrency((Number(invoice.subtotal) * Number(invoice.tax)) / 100)}</TableCell>
                    </TableRow>
                  )}
                  {Number(invoice.discount) > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Descuento ({invoice.discount}%)</TableCell>
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
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Estado de materiales</h3>
                  <p className="text-sm text-gray-600">Control de materiales provistos y pendientes</p>
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPaymentModalOpen(true)}
                    disabled={isPaidInFull}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Registrar materiales
                  </Button>
                  {!isPaidInFull && invoice.status !== "completed" && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleMarkAsPaid}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como completada
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm">Total materiales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(total)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm">Materiales provistos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(amountPaid)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm">Materiales pendientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${pendingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(pendingAmount)}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {invoice.payments && invoice.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                        <TableCell>
                          {payment.paymentMethod === "cash" && "Materiales básicos"}
                          {payment.paymentMethod === "credit_card" && "Materiales especiales"}
                          {payment.paymentMethod === "bank_transfer" && "Materiales de acabado"}
                          {payment.paymentMethod === "check" && "Herramientas"}
                          {payment.paymentMethod !== "cash" && 
                           payment.paymentMethod !== "credit_card" && 
                           payment.paymentMethod !== "bank_transfer" && 
                           payment.paymentMethod !== "check" && payment.paymentMethod}
                        </TableCell>
                        <TableCell>{payment.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No hay materiales registrados</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Aún no se han registrado materiales provistos para esta orden
                  </p>
                  {!isPaidInFull && (
                    <Button onClick={() => setIsPaymentModalOpen(true)}>
                      <Check className="h-4 w-4 mr-2" />
                      Registrar materiales
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="terms">
          <Card>
            <CardContent className="py-4">
              {invoice.terms ? (
                <div className="prose max-w-none">
                  <p>{invoice.terms}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No se han especificado instrucciones de trabajo para esta orden.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal para registrar materiales */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar materiales</DialogTitle>
            <DialogDescription>
              Registre materiales provistos para la orden {invoice.invoiceNumber}. El valor de materiales pendientes es {formatCurrency(pendingAmount)}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handlePaymentSubmit)}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  defaultValue={pendingAmount.toString()}
                  {...form.register("amount")}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Tipo de material</Label>
                <select
                  id="paymentMethod"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  {...form.register("paymentMethod")}
                >
                  <option value="cash">Materiales básicos</option>
                  <option value="credit_card">Materiales especiales</option>
                  <option value="bank_transfer">Materiales de acabado</option>
                  <option value="check">Herramientas</option>
                </select>
                {form.formState.errors.paymentMethod && (
                  <p className="text-sm text-red-600">{form.formState.errors.paymentMethod.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Fecha de entrega</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  {...form.register("paymentDate")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Detalles</Label>
                <Input
                  id="notes"
                  placeholder="Detalles adicionales sobre los materiales"
                  {...form.register("notes")}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {registerPaymentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Registrar materiales
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}