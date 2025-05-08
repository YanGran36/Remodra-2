import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEstimates } from "@/hooks/use-estimates";
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

// Esquema de validación para el formulario
const estimateFormSchema = z.object({
  clientId: z.coerce.number().min(1, "El cliente es requerido"),
  projectId: z.coerce.number().min(1, "El proyecto es requerido"),
  estimateNumber: z.string().optional(),
  issueDate: z.date(),
  expiryDate: z.date().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
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
  unitPrice: z.coerce.number().min(0, "El precio unitario debe ser al menos 0").transform(val => String(val)),
  amount: z.coerce.number().transform(val => String(val)),
  notes: z.string().optional(),
});

type EstimateItemValues = z.infer<typeof estimateItemSchema>;

export interface EstimateFormProps {
  clientId?: number;
  projectId?: number;
  onSuccess?: (estimate: any) => void;
  onCancel?: () => void;
}

export default function EstimateForm({ clientId, projectId, onSuccess, onCancel }: EstimateFormProps) {
  const [items, setItems] = useState<EstimateItemValues[]>([]);
  const [newItem, setNewItem] = useState<EstimateItemValues>({
    description: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    notes: "",
  });
  
  const { toast } = useToast();
  const { createEstimateMutation } = useEstimates();
  
  // Formulario principal del estimado
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      clientId: clientId || 0,
      projectId: projectId || 0,
      issueDate: new Date(),
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
      updatedItem.amount = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
    }
    
    setNewItem(updatedItem);
  };
  
  // Agregar ítem a la lista
  const handleAddItem = () => {
    // Validar el ítem antes de agregarlo
    try {
      const validatedItem = estimateItemSchema.parse(newItem);
      setItems([...items, validatedItem]);
      
      // Limpiar el formulario para un nuevo ítem
      setNewItem({
        description: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        notes: "",
      });
      
      // Recalcular totales
      recalculateTotals([...items, validatedItem]);
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
    const subtotal = currentItems.reduce((sum, item) => sum + Number(item.amount), 0);
    
    const tax = form.getValues("tax") || 0;
    const discount = form.getValues("discount") || 0;
    
    const taxAmount = (subtotal * tax) / 100;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    form.setValue("subtotal", subtotal);
    form.setValue("total", total);
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
      status: "pending",
      items: items.map(item => ({
        ...item,
        estimateId: 0, // Esto se asignará en el servidor
      })),
    };
    
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Crear nuevo estimado</h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete los detalles del estimado y agregue los ítems a incluir.
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
                        <TableHead className="w-[50px]">Acciones</TableHead>
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
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveItem(index)}
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
                  <div className="text-center py-4 border rounded-md bg-gray-50">
                    <p className="text-gray-500 text-sm">No hay ítems agregados al estimado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen financiero</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
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
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
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
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 mt-6 border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>{formatCurrency(form.getValues("subtotal"))}</span>
                </div>
                {form.getValues("tax") > 0 && (
                  <div className="flex justify-between">
                    <span>Impuesto ({form.getValues("tax")}%):</span>
                    <span>{formatCurrency((form.getValues("subtotal") * form.getValues("tax")) / 100)}</span>
                  </div>
                )}
                {form.getValues("discount") > 0 && (
                  <div className="flex justify-between">
                    <span>Descuento ({form.getValues("discount")}%):</span>
                    <span>-{formatCurrency((form.getValues("subtotal") * form.getValues("discount")) / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(form.getValues("total"))}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createEstimateMutation.isPending}
              >
                {createEstimateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear estimado
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}