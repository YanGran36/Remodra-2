import { useState } from "react";
import { format } from "date-fns";
import { 
  FileEdit, 
  Download, 
  Printer, 
  Mail, 
  CheckCircle, 
  Calendar, 
  Clock,
  AlertTriangle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
  TableFooter
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Helper function to get status badge style
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pendiente</Badge>;
    case 'paid':
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Pagada</Badge>;
    case 'overdue':
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Vencida</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

interface InvoiceDetailProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (invoice: any) => void;
}

export default function InvoiceDetail({ invoice, isOpen, onClose, onEdit }: InvoiceDetailProps) {
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  if (!invoice) return null;
  
  // Calculate payment progress
  const totalAmount = parseFloat(invoice.total);
  const paidAmount = parseFloat(invoice.amountPaid);
  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const remainingAmount = totalAmount - paidAmount;
  
  // Calculate days until due or overdue
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Update invoice status mutation
  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/protected/invoices/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la orden de trabajo ha sido actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: number, amount: string }) => {
      const res = await apiRequest("POST", `/api/protected/invoices/${id}/payment`, { amount });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "Pago registrado",
        description: "El pago ha sido registrado correctamente.",
      });
      setIsRecordingPayment(false);
      setPaymentAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrar pago",
        description: error.message,
        variant: "destructive",
      });
      setIsRecordingPayment(false);
    },
  });
  
  const handleStatusChange = (status: string) => {
    updateInvoiceStatusMutation.mutate({ id: invoice.id, status });
  };
  
  const handleRecordPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Monto inválido",
        description: "Por favor ingrese un monto válido.",
        variant: "destructive",
      });
      return;
    }
    
    if (parseFloat(paymentAmount) > remainingAmount) {
      toast({
        title: "Monto excede el saldo",
        description: "El monto del pago excede el saldo pendiente.",
        variant: "destructive",
      });
      return;
    }
    
    recordPaymentMutation.mutate({ id: invoice.id, amount: paymentAmount });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Orden de Trabajo #{invoice.invoiceNumber}</span>
            {getStatusBadge(invoice.status)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Client and Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {invoice.client?.firstName?.[0]}{invoice.client?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{invoice.client?.firstName} {invoice.client?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{invoice.client?.email}</p>
                    <p className="text-sm text-muted-foreground">{invoice.client?.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Información del Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-medium">{invoice.project?.title || "No project asignado"}</p>
                  {invoice.project && (
                    <>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {invoice.project.description}
                      </p>
                      <div className="mt-1 flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {invoice.project.startDate && format(new Date(invoice.project.startDate), 'MMM d, yyyy')}
                        {invoice.project.endDate && ` - ${format(new Date(invoice.project.endDate), 'MMM d, yyyy')}`}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Invoice Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Estado de la Orden de Trabajo</CardTitle>
              <CardDescription>
                Emitida: {format(new Date(invoice.issueDate), 'dd MMMM, yyyy')} | 
                Vencimiento: {format(new Date(invoice.dueDate), 'dd MMMM, yyyy')}
                {diffDays < 0 && invoice.status !== 'paid' ? (
                  <span className="ml-2 text-red-500 font-medium flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Vencida hace {Math.abs(diffDays)} días
                  </span>
                ) : diffDays >= 0 && invoice.status !== 'paid' ? (
                  <span className="ml-2 text-amber-500 font-medium flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Vence en {diffDays} días
                  </span>
                ) : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Progreso de Pago</span>
                  <span>{paymentProgress.toFixed(0)}%</span>
                </div>
                <Progress value={paymentProgress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="rounded-md border p-3">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-lg font-semibold">{formatCurrency(invoice.total)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-sm text-muted-foreground">Pagado</div>
                  <div className="text-lg font-semibold text-green-600">{formatCurrency(invoice.amountPaid)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-sm text-muted-foreground">Saldo Pendiente</div>
                  <div className="text-lg font-semibold text-amber-600">{formatCurrency(remainingAmount)}</div>
                </div>
              </div>
              
              {isRecordingPayment ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Monto del Pago</label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={remainingAmount}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-7 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="0.00"
                        />
                      </div>
                      <Button onClick={handleRecordPayment} disabled={recordPaymentMutation.isPending}>
                        {recordPaymentMutation.isPending ? "Registrando..." : "Registrar"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsRecordingPayment(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                invoice.status !== 'paid' && (
                  <Button onClick={() => setIsRecordingPayment(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </Button>
                )
              )}
            </CardContent>
          </Card>
          
          {/* Invoice Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Detalles de la Orden de Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="items">
                <TabsList className="mb-4">
                  <TabsTrigger value="items">Artículos</TabsTrigger>
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                  <TabsTrigger value="notes">Notas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="items">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unitario</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.items && invoice.items.length > 0 ? (
                          invoice.items.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.description}</p>
                                  {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                              No hay artículos en esta orden de trabajo
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
                        </TableRow>
                        {parseFloat(invoice.tax) > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">Impuestos</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice.tax)}</TableCell>
                          </TableRow>
                        )}
                        {parseFloat(invoice.discount) > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">Descuento</TableCell>
                            <TableCell className="text-right">-{formatCurrency(invoice.discount)}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(invoice.total)}</TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="details">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Términos y Condiciones</h4>
                      <div className="rounded-md bg-muted p-4">
                        <p className="whitespace-pre-line">{invoice.terms || "No se han especificado términos y condiciones."}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Firma del Contratista</h4>
                        <div className="rounded-md bg-muted p-4 h-20 flex items-center justify-center">
                          {invoice.contractorSignature ? (
                            <p className="italic">{invoice.contractorSignature}</p>
                          ) : (
                            <p className="text-muted-foreground">No hay firma</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Firma del Cliente</h4>
                        <div className="rounded-md bg-muted p-4 h-20 flex items-center justify-center">
                          {invoice.clientSignature ? (
                            <p className="italic">{invoice.clientSignature}</p>
                          ) : (
                            <p className="text-muted-foreground">No hay firma</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="notes">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Notas</h4>
                      <div className="rounded-md bg-muted p-4">
                        <p className="whitespace-pre-line">{invoice.notes || "No hay notas para esta orden de trabajo."}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Actions based on invoice status */}
          {invoice.status === 'pending' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Acciones Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange('paid')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Pagada
                  </Button>
                  <Button
                    variant="default"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleStatusChange('overdue')}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Marcar como Vencida
                  </Button>
                  <Button variant="outline" onClick={() => onEdit(invoice)}>
                    <FileEdit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <DialogFooter className="flex flex-wrap gap-2 sm:space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          {invoice.status !== 'cancelled' && (
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Enviar por Email
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}