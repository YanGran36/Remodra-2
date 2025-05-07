import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, formatISO, parse } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calculator, 
  CalendarIcon, 
  MinusCircle, 
  PlusCircle, 
  X 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define schema for estimateItem
const estimateItemSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, { message: "La descripción es requerida" }),
  quantity: z.string().min(1, { message: "La cantidad es requerida" }),
  unitPrice: z.string().min(1, { message: "El precio unitario es requerido" }),
  amount: z.string().min(1, { message: "El monto es requerido" }),
  notes: z.string().optional(),
});

// Define schema for estimate
const estimateFormSchema = z.object({
  id: z.number().optional(),
  clientId: z.number({ required_error: "El cliente es requerido" }),
  projectId: z.number().optional().nullable(),
  estimateNumber: z.string().min(1, { message: "El número de estimado es requerido" }),
  issueDate: z.date({ required_error: "La fecha de emisión es requerida" }),
  expiryDate: z.date().optional().nullable(),
  status: z.string().min(1, { message: "El estado es requerido" }),
  subtotal: z.string().min(1, { message: "El subtotal es requerido" }),
  tax: z.string().default("0"),
  discount: z.string().default("0"),
  total: z.string().min(1, { message: "El total es requerido" }),
  terms: z.string().optional(),
  notes: z.string().optional(),
  contractorSignature: z.string().optional(),
  items: z.array(estimateItemSchema).optional(),
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

interface EstimateFormProps {
  estimateToEdit?: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EstimateForm({ estimateToEdit, isOpen, onClose }: EstimateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState<string>("0");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  
  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["/api/protected/clients"],
  });
  
  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["/api/protected/projects"],
  });
  
  // Form definition
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      clientId: undefined,
      projectId: null,
      estimateNumber: generateEstimateNumber(),
      issueDate: new Date(),
      expiryDate: addDays(new Date(), 30),
      status: "draft",
      subtotal: "0",
      tax: "0",
      discount: "0",
      total: "0",
      terms: "1. Este estimado es válido por 30 días a partir de la fecha de emisión.\n2. Se requiere un pago del 50% para iniciar el trabajo.\n3. El balance restante se pagará al completar el trabajo.\n4. Cualquier modificación al alcance del trabajo puede resultar en costos adicionales.",
      notes: "",
      contractorSignature: "",
      items: [],
    }
  });
  
  // Field array for estimate items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  // Initialize form with data if editing
  useEffect(() => {
    if (estimateToEdit) {
      const formattedEstimate = {
        ...estimateToEdit,
        issueDate: new Date(estimateToEdit.issueDate),
        expiryDate: estimateToEdit.expiryDate ? new Date(estimateToEdit.expiryDate) : null,
        subtotal: estimateToEdit.subtotal.toString(),
        tax: estimateToEdit.tax.toString(),
        discount: estimateToEdit.discount.toString(),
        total: estimateToEdit.total.toString(),
      };
      
      form.reset(formattedEstimate);
      
      if (estimateToEdit.items && estimateToEdit.items.length > 0) {
        setItems(estimateToEdit.items.map((item: any) => ({
          ...item,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: item.amount.toString(),
        })));
      }
      
      setTaxRate(calculateTaxRate(estimateToEdit.subtotal, estimateToEdit.tax).toString());
      setDiscountAmount(estimateToEdit.discount.toString());
    } else {
      // Clear the form
      form.reset({
        clientId: undefined,
        projectId: null,
        estimateNumber: generateEstimateNumber(),
        issueDate: new Date(),
        expiryDate: addDays(new Date(), 30),
        status: "draft",
        subtotal: "0",
        tax: "0",
        discount: "0",
        total: "0",
        terms: "1. Este estimado es válido por 30 días a partir de la fecha de emisión.\n2. Se requiere un pago del 50% para iniciar el trabajo.\n3. El balance restante se pagará al completar el trabajo.\n4. Cualquier modificación al alcance del trabajo puede resultar en costos adicionales.",
        notes: "",
        contractorSignature: "",
        items: [],
      });
      setItems([]);
      setTaxRate("0");
      setDiscountAmount("0");
    }
  }, [estimateToEdit, form]);
  
  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (data: EstimateFormValues) => {
      const res = await apiRequest("POST", "/api/protected/estimates", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      toast({
        title: "Estimado creado",
        description: "El estimado ha sido creado exitosamente.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear estimado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update estimate mutation
  const updateEstimateMutation = useMutation({
    mutationFn: async (data: EstimateFormValues) => {
      const res = await apiRequest("PATCH", `/api/protected/estimates/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      toast({
        title: "Estimado actualizado",
        description: "El estimado ha sido actualizado exitosamente.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar estimado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  function generateEstimateNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    // Generate a random 3-digit number
    const random = Math.floor(Math.random() * 900) + 100;
    return `EST-${year}-${random}`;
  }
  
  function calculateTaxRate(subtotal: string | number, tax: string | number): number {
    const subtotalNum = typeof subtotal === 'string' ? parseFloat(subtotal) : subtotal;
    const taxNum = typeof tax === 'string' ? parseFloat(tax) : tax;
    
    if (subtotalNum <= 0 || isNaN(subtotalNum)) return 0;
    return (taxNum / subtotalNum) * 100;
  }
  
  function calculateSubtotal(items: any[]): number {
    return items.reduce((sum, item) => {
      const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }
  
  function calculateTotal(subtotal: number, tax: number, discount: number): number {
    return subtotal + tax - discount;
  }
  
  function handleAddItem() {
    const newItem = {
      description: "",
      quantity: "1",
      unitPrice: "0",
      amount: "0",
      notes: "",
    };
    
    setItems([...items, newItem]);
    append(newItem);
  }
  
  function handleRemoveItem(index: number) {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    remove(index);
    
    // Recalculate subtotal
    const newSubtotal = calculateSubtotal(newItems);
    const newTax = (newSubtotal * parseFloat(taxRate)) / 100;
    const newTotal = calculateTotal(newSubtotal, newTax, parseFloat(discountAmount));
    
    form.setValue("subtotal", newSubtotal.toString());
    form.setValue("tax", newTax.toString());
    form.setValue("total", newTotal.toString());
  }
  
  function handleItemChange(index: number, field: string, value: string) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If quantity or unitPrice changed, recalculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? parseFloat(value) : parseFloat(newItems[index].quantity);
      const unitPrice = field === 'unitPrice' ? parseFloat(value) : parseFloat(newItems[index].unitPrice);
      
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        const amount = quantity * unitPrice;
        newItems[index].amount = amount.toString();
        
        // Update form value
        form.setValue(`items.${index}.amount`, amount.toString());
      }
    }
    
    setItems(newItems);
    form.setValue(`items.${index}.${field}`, value);
    
    // Recalculate subtotal
    const newSubtotal = calculateSubtotal(newItems);
    const newTax = (newSubtotal * parseFloat(taxRate)) / 100;
    const newDiscount = parseFloat(discountAmount);
    const newTotal = calculateTotal(newSubtotal, newTax, newDiscount);
    
    form.setValue("subtotal", newSubtotal.toString());
    form.setValue("tax", newTax.toString());
    form.setValue("total", newTotal.toString());
  }
  
  function handleTaxRateChange(value: string) {
    setTaxRate(value);
    const subtotal = parseFloat(form.getValues("subtotal"));
    const newTax = (subtotal * parseFloat(value)) / 100;
    const discount = parseFloat(form.getValues("discount"));
    const newTotal = calculateTotal(subtotal, newTax, discount);
    
    form.setValue("tax", newTax.toString());
    form.setValue("total", newTotal.toString());
  }
  
  function handleDiscountChange(value: string) {
    setDiscountAmount(value);
    const subtotal = parseFloat(form.getValues("subtotal"));
    const tax = parseFloat(form.getValues("tax"));
    const newTotal = calculateTotal(subtotal, tax, parseFloat(value));
    
    form.setValue("discount", value);
    form.setValue("total", newTotal.toString());
  }
  
  function onSubmit(data: EstimateFormValues) {
    const formattedData = {
      ...data,
      items: items.map(item => ({
        ...item,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
    };
    
    if (estimateToEdit) {
      updateEstimateMutation.mutate(formattedData);
    } else {
      createEstimateMutation.mutate(formattedData);
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{estimateToEdit ? "Editar Estimado" : "Crear Nuevo Estimado"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente*</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.firstName} {client.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proyecto (Opcional)</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => field.onChange(value && value !== "no_project" ? parseInt(value) : null)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proyecto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no_project">Sin proyecto</SelectItem>
                          {projects?.filter((project: any) => 
                            project.clientId === parseInt(form.getValues("clientId")?.toString() || "0")
                          ).map((project: any) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="estimateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Estimado*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Emisión*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Seleccionar fecha</span>
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
                                date < new Date("1900-01-01")
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
                        <FormLabel>Fecha de Expiración</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Artículos del Estimado</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar Artículo
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Descripción</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unitario</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            No hay artículos en este estimado. Haga clic en "Agregar Artículo" para comenzar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                placeholder="Descripción"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                className="mb-1"
                              />
                              <Input
                                placeholder="Notas (opcional)"
                                value={item.notes || ""}
                                onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                                className="text-xs"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                className="w-20 text-right ml-auto"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <span className="mr-1">$</span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                                  className="w-24 text-right"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <span className="mr-1">$</span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.amount}
                                  readOnly
                                  className="w-24 text-right bg-muted"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Subtotal
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">$</span>
                            <Input
                              type="number"
                              readOnly
                              value={form.watch("subtotal")}
                              className="w-24 text-right bg-muted"
                            />
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-medium">
                          Impuestos
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={taxRate}
                              onChange={(e) => handleTaxRateChange(e.target.value)}
                              className="w-16 text-right"
                            />
                            <span className="ml-1">%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">$</span>
                            <Input
                              type="number"
                              readOnly
                              value={form.watch("tax")}
                              className="w-24 text-right bg-muted"
                            />
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Descuento
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={discountAmount}
                              onChange={(e) => handleDiscountChange(e.target.value)}
                              className="w-24 text-right"
                            />
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">$</span>
                            <Input
                              type="number"
                              readOnly
                              value={form.watch("total")}
                              className="w-24 text-right bg-muted font-bold"
                            />
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Términos y Condiciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ingrese los términos y condiciones del estimado"
                        className="min-h-[120px]"
                        {...field}
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
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ingrese notas adicionales para el cliente"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="contractorSignature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma del Contratista</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingrese su nombre para firmar este estimado"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Esta firma digital será incluida en el estimado enviado al cliente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createEstimateMutation.isPending || updateEstimateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createEstimateMutation.isPending || updateEstimateMutation.isPending}
              >
                {createEstimateMutation.isPending || updateEstimateMutation.isPending
                  ? "Guardando..."
                  : estimateToEdit
                  ? "Actualizar Estimado"
                  : "Crear Estimado"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}