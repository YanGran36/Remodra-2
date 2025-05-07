import { useState } from "react";
import { format } from "date-fns";
import { 
  FileEdit, 
  Download, 
  Printer, 
  Mail, 
  BanknoteIcon, 
  Check, 
  X,
  Calendar
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
    case 'draft':
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Borrador</Badge>;
    case 'sent':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Enviado</Badge>;
    case 'accepted':
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Aceptado</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Rechazado</Badge>;
    case 'expired':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Expirado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

interface EstimateDetailProps {
  estimate: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (estimate: any) => void;
}

export default function EstimateDetail({ estimate, isOpen, onClose, onEdit }: EstimateDetailProps) {
  const [isCreatingWorkOrder, setIsCreatingWorkOrder] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  if (!estimate) return null;
  
  // Update estimate status mutation
  const updateEstimateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/protected/estimates/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del estimado ha sido actualizado correctamente.",
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

  // Convert to invoice mutation
  const convertToInvoiceMutation = useMutation({
    mutationFn: async (estimateId: number) => {
      setIsCreatingWorkOrder(true);
      const res = await apiRequest("POST", `/api/protected/estimates/${estimateId}/convert-to-invoice`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      setIsCreatingWorkOrder(false);
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "Orden de trabajo creada",
        description: "El estimado ha sido convertido en una orden de trabajo exitosamente.",
      });
      onClose();
    },
    onError: (error: Error) => {
      setIsCreatingWorkOrder(false);
      toast({
        title: "Error al crear orden de trabajo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: string) => {
    updateEstimateMutation.mutate({ id: estimate.id, status });
  };

  const handleConvertToInvoice = () => {
    if (estimate.status !== 'accepted') {
      toast({
        title: "Acción no permitida",
        description: "Solo los estimados aceptados pueden ser convertidos a órdenes de trabajo.",
        variant: "destructive",
      });
      return;
    }
    
    convertToInvoiceMutation.mutate(estimate.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Detalles del Estimado #{estimate.estimateNumber}</span>
            {getStatusBadge(estimate.status)}
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
                      {estimate.client?.firstName?.[0]}{estimate.client?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{estimate.client?.firstName} {estimate.client?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{estimate.client?.email}</p>
                    <p className="text-sm text-muted-foreground">{estimate.client?.phone}</p>
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
                  <p className="font-medium">{estimate.project?.title || "Sin proyecto asignado"}</p>
                  {estimate.project && (
                    <>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {estimate.project.description}
                      </p>
                      <div className="mt-1 flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {estimate.project.startDate && format(new Date(estimate.project.startDate), 'MMM d, yyyy')}
                        {estimate.project.endDate && ` - ${format(new Date(estimate.project.endDate), 'MMM d, yyyy')}`}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Estimate Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Detalles del Estimado</CardTitle>
              <CardDescription>
                Emitido: {format(new Date(estimate.issueDate), 'dd MMMM, yyyy')}
                {estimate.expiryDate && ` | Válido hasta: ${format(new Date(estimate.expiryDate), 'dd MMMM, yyyy')}`}
              </CardDescription>
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
                        {estimate.items && estimate.items.length > 0 ? (
                          estimate.items.map((item: any) => (
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
                              No hay artículos en este estimado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                          <TableCell className="text-right">{formatCurrency(estimate.subtotal)}</TableCell>
                        </TableRow>
                        {parseFloat(estimate.tax) > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">Impuestos</TableCell>
                            <TableCell className="text-right">{formatCurrency(estimate.tax)}</TableCell>
                          </TableRow>
                        )}
                        {parseFloat(estimate.discount) > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">Descuento</TableCell>
                            <TableCell className="text-right">-{formatCurrency(estimate.discount)}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(estimate.total)}</TableCell>
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
                        <p className="whitespace-pre-line">{estimate.terms || "No se han especificado términos y condiciones."}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Firma del Contratista</h4>
                        <div className="rounded-md bg-muted p-4 h-20 flex items-center justify-center">
                          {estimate.contractorSignature ? (
                            <p className="italic">{estimate.contractorSignature}</p>
                          ) : (
                            <p className="text-muted-foreground">No hay firma</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Firma del Cliente</h4>
                        <div className="rounded-md bg-muted p-4 h-20 flex items-center justify-center">
                          {estimate.clientSignature ? (
                            <p className="italic">{estimate.clientSignature}</p>
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
                        <p className="whitespace-pre-line">{estimate.notes || "No hay notas para este estimado."}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Actions for different estimate statuses */}
          {estimate.status === 'draft' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Acciones Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default" onClick={() => handleStatusChange('sent')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Marcar como Enviado
                  </Button>
                  <Button variant="outline" onClick={() => onEdit(estimate)}>
                    <FileEdit className="h-4 w-4 mr-2" />
                    Editar Estimado
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {estimate.status === 'sent' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Acciones Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Este estimado ha sido enviado al cliente. Puede actualizar su estado basado en la respuesta del cliente.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange('accepted')}>
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como Aceptado
                    </Button>
                    <Button variant="default" className="bg-red-600 hover:bg-red-700" onClick={() => handleStatusChange('rejected')}>
                      <X className="h-4 w-4 mr-2" />
                      Marcar como Rechazado
                    </Button>
                    <Button variant="outline" onClick={() => onEdit(estimate)}>
                      <FileEdit className="h-4 w-4 mr-2" />
                      Editar Estimado
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {estimate.status === 'accepted' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Acciones Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    ¡Enhorabuena! Este estimado ha sido aceptado por el cliente. Ahora puede crear una orden de trabajo basada en este estimado.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="default" 
                      onClick={handleConvertToInvoice} 
                      disabled={isCreatingWorkOrder || convertToInvoiceMutation.isPending}
                    >
                      <BanknoteIcon className="h-4 w-4 mr-2" />
                      {isCreatingWorkOrder ? "Creando..." : "Crear Orden de Trabajo"}
                    </Button>
                  </div>
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
          {estimate.status !== 'rejected' && estimate.status !== 'expired' && (
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