import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Save, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEstimates } from "@/hooks/use-estimates";
import { useClients } from "@/hooks/use-clients";
import { useProjects } from "@/hooks/use-projects";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Esquema de validación para el formulario
const estimateFormSchema = z.object({
  clientId: z.coerce.number().min(1, "El cliente es requerido"),
  projectId: z.coerce.number().optional().nullable(), // El proyecto es completamente opcional
  estimateNumber: z.string().optional(),
  issueDate: z.date(),
  expiryDate: z.date().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  // Cambiamos los tipos de campos monetarios a string para compatibilidad con el backend
  subtotal: z.string().or(z.number().transform(val => String(val))),
  tax: z.string().or(z.number().transform(val => String(val))),
  discount: z.string().or(z.number().transform(val => String(val))),
  total: z.string().or(z.number().transform(val => String(val))),
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

// Esquema para elementos del estimado
const estimateItemSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1"),
  // Convertimos los valores monetarios a string para compatibilidad con el backend
  unitPrice: z.string().or(z.number().transform(val => String(val))),
  amount: z.string().or(z.number().transform(val => String(val))),
  notes: z.string().optional(),
});

type EstimateItemValues = z.infer<typeof estimateItemSchema>;

export interface EstimateFormProps {
  clientId?: number;
  projectId?: number;
  onSuccess?: (estimate: any) => void;
  onCancel?: () => void;
  estimateId?: number; // ID del estimado a editar
}

export default function EstimateForm({ clientId, projectId, estimateId, onSuccess, onCancel }: EstimateFormProps) {
  const [items, setItems] = useState<EstimateItemValues[]>([]);
  const [newItem, setNewItem] = useState<EstimateItemValues>({
    description: "",
    quantity: 1,
    unitPrice: "0",
    amount: "0",
    notes: "",
  });
  
  const { toast } = useToast();
  const { createEstimateMutation, updateEstimateMutation, getEstimate } = useEstimates();
  const { clients = [], isLoadingClients } = useClients();
  const { projects = [], isLoadingProjects } = useProjects();
  
  // Estado para indicar si es edición o creación
  const [isEditing, setIsEditing] = useState(!!estimateId);
  const [isLoading, setIsLoading] = useState(!!estimateId);
  
  // Formulario principal del estimado
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      clientId: clientId || 0,
      projectId: projectId || 0,
      issueDate: new Date(),
      status: "pending", // Estado predeterminado
      subtotal: "0", // Convertidos a string para compatibilidad con el backend
      tax: "0",      // Convertidos a string para compatibilidad con el backend
      discount: "0", // Convertidos a string para compatibilidad con el backend
      total: "0",    // Convertidos a string para compatibilidad con el backend
    }
  });
  
  // Actualizar el monto del ítem al cambiar cantidad o precio unitario
  const handleItemChange = (field: keyof EstimateItemValues, value: string | number) => {
    const updatedItem = { ...newItem, [field]: value };
    
    // Recalcular el monto si cambia la cantidad o el precio unitario
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = Number(updatedItem.quantity);
      const unitPrice = Number(updatedItem.unitPrice);
      
      // Asegurar que son números válidos
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        // Calcular monto con precisión de 2 decimales
        const amount = quantity * unitPrice;
        const roundedAmount = parseFloat(amount.toFixed(2));
        updatedItem.amount = roundedAmount.toString();
      } else {
        updatedItem.amount = "0";
      }
    }
    
    setNewItem(updatedItem);
  };
  
  // Agregar ítem a la lista
  const handleAddItem = () => {
    // Validar el ítem antes de agregarlo
    try {
      // Asegurarse de que los valores numéricos sean correctos
      const quantity = Number(newItem.quantity) || 1;
      const unitPrice = Number(newItem.unitPrice) || 0;
      
      // Calcular el monto con precisión de 2 decimales
      const amount = quantity * unitPrice;
      const roundedAmount = parseFloat(amount.toFixed(2));
      
      const itemToValidate = {
        ...newItem,
        quantity: quantity,
        unitPrice: unitPrice.toString(),
        amount: roundedAmount.toString()
      };
      
      const validatedItem = estimateItemSchema.parse(itemToValidate);
      const updatedItems = [...items, validatedItem];
      setItems(updatedItems);
      
      // Limpiar el formulario para un nuevo ítem
      setNewItem({
        description: "",
        quantity: 1,
        unitPrice: "0",
        amount: "0",
        notes: "",
      });
      
      // Recalcular totales
      recalculateTotals(updatedItems);
      
      console.log("Ítem agregado:", validatedItem);
      console.log("Items actuales:", updatedItems);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path}: ${err.message}`).join(", ");
        toast({
          title: "Error al agregar ítem",
          description: errorMessages,
          variant: "destructive",
        });
      }
    }
  };
  
  // Eliminar ítem de la lista
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
    
    // Recalcular totales
    recalculateTotals(updatedItems);
  };
  
  // Recalcular subtotal, impuestos y total
  const recalculateTotals = (currentItems: EstimateItemValues[]) => {
    // Calcular el subtotal sumando los montos de todos los items
    const subtotal = currentItems.reduce((sum, item) => sum + Number(item.amount), 0);
    
    // Obtener porcentajes de impuesto y descuento del formulario
    const tax = Number(form.getValues("tax") || "0");
    const discount = Number(form.getValues("discount") || "0");
    
    // Calcular montos de impuesto y descuento
    const taxAmount = (subtotal * tax) / 100;
    const discountAmount = (subtotal * discount) / 100;
    
    // Calcular total: subtotal + impuestos - descuento
    const total = subtotal + taxAmount - discountAmount;
    
    // Asegurarse de utilizar valores numéricos precisos antes de convertir a string
    const subtotalRounded = parseFloat(subtotal.toFixed(2));
    const totalRounded = parseFloat(total.toFixed(2));
    
    // Actualizar valores en el formulario
    form.setValue("subtotal", subtotalRounded.toString(), { shouldValidate: true });
    form.setValue("total", totalRounded.toString(), { shouldValidate: true });
    
    console.log(`Subtotal: ${subtotalRounded}, Tax: ${tax}%, TaxAmount: ${taxAmount.toFixed(2)}, Discount: ${discount}%, DiscountAmount: ${discountAmount.toFixed(2)}, Total: ${totalRounded}`);
  };
  
  // Actualizar totales cuando cambian los impuestos o descuentos
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'tax' || name === 'discount') {
        recalculateTotals(items);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, items]);
  
  // Cargar datos del estimado si estamos en modo edición
  useEffect(() => {
    if (estimateId) {
      // Realizar consulta para obtener los datos del estimado
      setIsLoading(true);
      
      const fetchEstimate = async () => {
        try {
          const response = await fetch(`/api/protected/estimates/${estimateId}`);
          if (!response.ok) {
            throw new Error('No se pudo cargar el estimado');
          }
          
          const estimateData = await response.json();
          
          // Convertir fechas de string a objetos Date
          if (estimateData.issueDate) {
            estimateData.issueDate = new Date(estimateData.issueDate);
          }
          if (estimateData.expiryDate) {
            estimateData.expiryDate = new Date(estimateData.expiryDate);
          }
          
          // Actualizar formulario con datos del estimado
          form.reset(estimateData);
          
          // Cargar ítems del estimado
          if (estimateData.items && Array.isArray(estimateData.items)) {
            setItems(estimateData.items);
          }
          
          setIsEditing(true);
          setIsLoading(false);
        } catch (error) {
          console.error("Error loading estimate:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar el estimado",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      };
      
      fetchEstimate();
    }
  }, [estimateId, form]);
  
  // Manejar el envío del formulario
  const onSubmit = (data: EstimateFormValues) => {
    if (items.length === 0) {
      toast({
        title: "No se pueden agregar ítems",
        description: "Debe agregar al menos un ítem al estimado.",
        variant: "destructive",
      });
      return;
    }
    
    // Crear el número de estimado si no existe
    if (!data.estimateNumber) {
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 900) + 100; // Número aleatorio de 3 dígitos
      data.estimateNumber = `EST-${year}${month}-${random}`;
    }
    
    // Preparar objeto de estimado completo con sus ítems
    const estimateData = {
      ...data,
      // Si proyecto es 0, enviar null para evitar error de clave foránea
      projectId: data.projectId === 0 ? null : data.projectId,
      // Si estamos editando, mantener el status actual, si no, establecer como "pending"
      status: isEditing ? form.getValues("status") || "pending" : "pending",
      items: items.map(item => ({
        ...item,
        estimateId: isEditing && estimateId ? estimateId : 0, // Mantener relación con el estimado si es edición
      })),
    };
    
    if (isEditing && estimateId) {
      // Actualizar estimado existente
      updateEstimateMutation.mutate(
        { 
          id: estimateId, 
          data: estimateData
        }, 
        {
          onSuccess: (updatedEstimate) => {
            toast({
              title: "Estimado actualizado",
              description: `El estimado ${updatedEstimate.estimateNumber} ha sido actualizado exitosamente.`,
            });
            
            if (onSuccess) {
              onSuccess(updatedEstimate);
            }
          }
        }
      );
    } else {
      // Crear nuevo estimado
      createEstimateMutation.mutate(estimateData, {
        onSuccess: (newEstimate) => {
          toast({
            title: "Estimado creado",
            description: `El estimado ${newEstimate.estimateNumber} ha sido creado exitosamente.`,
          });
          
          if (onSuccess) {
            onSuccess(newEstimate);
          }
        }
      });
    }
  };

  // Si está cargando, mostrar indicador de carga
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Cargando datos del estimado...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {isEditing ? "Editar estimado" : "Crear nuevo estimado"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isEditing 
            ? "Actualice los detalles del estimado y sus ítems. Cuando termine, haga clic en 'Guardar y Cerrar'." 
            : "Complete los detalles del estimado y agregue los ítems a incluir."}
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información general</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selector de cliente */}
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente*</FormLabel>
                      <Select
                        value={field.value ? field.value.toString() : ""}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          // Reiniciar el valor del proyecto si se cambia el cliente
                          form.setValue("projectId", 0);
                        }}
                        disabled={isEditing} // Deshabilitar cambio de cliente en edición
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.firstName} {client.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Seleccione el cliente para este estimado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selector de proyecto - Ahora totalmente opcional */}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => {
                    // Filtrar proyectos por cliente seleccionado
                    const clientId = form.watch("clientId");
                    const filteredProjects = clientId
                      ? projects.filter((p: any) => p.clientId === clientId)
                      : [];
                    
                    return (
                      <FormItem>
                        <FormLabel>Proyecto (Opcional)</FormLabel>
                        <Select
                          value={field.value ? field.value.toString() : "0"}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          disabled={!clientId || isLoadingProjects || isEditing} // Deshabilitar en edición también
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sin proyecto - Se creará más tarde" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Sin proyecto - Se creará más tarde</SelectItem>
                            {filteredProjects.length > 0 && (
                              <SelectSeparator />
                            )}
                            {filteredProjects.map((project: any) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Los proyectos se pueden asociar después de que el cliente acepte el estimado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="estimateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de estimado</FormLabel>
                      <FormControl>
                        <Input placeholder="Generado automáticamente" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>
                        Deje en blanco para generar automáticamente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de emisión</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                "w-full pl-3 text-left font-normal flex items-center justify-between"
                              }
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Seleccione una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setDate(new Date().getDate() - 30))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de expiración</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                "w-full pl-3 text-left font-normal flex items-center justify-between"
                              }
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Seleccione una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Términos y condiciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Términos</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Términos del estimado..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas adicionales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notas para el cliente..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ítems del estimado</CardTitle>
              <CardDescription>
                Agregue los productos o servicios que serán incluidos en este estimado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-5">
                    <FormLabel>Descripción</FormLabel>
                    <Input
                      placeholder="Descripción del ítem"
                      value={newItem.description}
                      onChange={(e) => handleItemChange('description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormLabel>Cantidad</FormLabel>
                    <Input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => handleItemChange('quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormLabel>Precio unitario</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) => handleItemChange('unitPrice', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormLabel>Monto</FormLabel>
                    <Input
                      disabled
                      value={formatCurrency(newItem.amount)}
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      size="icon"
                      className="w-full h-10"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Agregar ítem</span>
                    </Button>
                  </div>
                </div>
                
                {items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Descripción</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio unitario</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>{formatCurrency(item.amount)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleRemoveItem(index)}
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar ítem</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No se han agregado ítems al estimado.
                  </div>
                )}
                
              </div>
              
              {/* Nueva sección de resumen más clara */}
              <div className="mt-8 border rounded-lg overflow-hidden">
                <div className="bg-muted p-4 border-b">
                  <h3 className="text-lg font-medium">Resumen del Estimado</h3>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Ajustes de Precios</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="tax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Impuesto (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={field.value}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      field.onChange(value.toString());
                                      if (items.length > 0) {
                                        recalculateTotals(items);
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="discount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descuento (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={field.value}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      field.onChange(value.toString());
                                      if (items.length > 0) {
                                        recalculateTotals(items);
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  
                    <div>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Totales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal:</span>
                              <span className="font-medium">{formatCurrency(form.getValues("subtotal"))}</span>
                            </div>
                            
                            {Number(form.getValues("tax")) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Impuesto ({form.getValues("tax")}%):</span>
                                <span className="font-medium">{formatCurrency((Number(form.getValues("subtotal")) * Number(form.getValues("tax"))) / 100)}</span>
                              </div>
                            )}
                            
                            {Number(form.getValues("discount")) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Descuento ({form.getValues("discount")}%):</span>
                                <span className="font-medium text-destructive">-{formatCurrency((Number(form.getValues("subtotal")) * Number(form.getValues("discount"))) / 100)}</span>
                              </div>
                            )}
                            
                            <Separator className="my-2" />
                            
                            <div className="flex justify-between pt-1">
                              <span className="font-bold">TOTAL:</span>
                              <span className="font-bold text-lg">{formatCurrency(form.getValues("total"))}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancelar
              </Button>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={updateEstimateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // El formulario se enviará y onSubmit se encargará de guardar
                      // El callback onSuccess se encargará de cerrar la vista
                    }}
                  >
                    {updateEstimateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Guardar y Cerrar
                  </Button>
                </div>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createEstimateMutation.isPending}
                >
                  {createEstimateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Crear estimado
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}