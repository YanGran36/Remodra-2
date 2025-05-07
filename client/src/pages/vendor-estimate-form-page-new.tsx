import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Pencil, 
  Trash2, 
  Calculator, 
  CalendarIcon, 
  ClipboardCheck,
  Ruler,
  Scan,
  Camera
} from "lucide-react";

// Componentes de Medición Digital
import DigitalMeasurement from "@/components/measurement/digital-measurement";
import LiDARScanner from "@/components/measurement/lidar-scanner";

// UI Components
import PageHeader from "@/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
} from "@/components/ui/alert-dialog";

// Importar tipos y datos de servicio
import { 
  SERVICE_TYPES, 
  MATERIALS_BY_SERVICE, 
  OPTIONS_BY_SERVICE,
  SERVICE_INFO,
  getServiceLabel
} from "@/lib/service-options";

// Importar componente de formulario especializado por servicio
import ServiceEstimateForm from "@/components/estimates/service-estimate-form";

// Define el esquema de validación del formulario
const formSchema = z.object({
  clientId: z.string().min(1, { message: "Por favor seleccione un cliente" }),
  projectId: z.string().optional(),
  serviceType: z.string().min(1, { message: "Por favor seleccione un tipo de servicio" }),
  materialType: z.string().optional(),
  squareFeet: z.string().optional(),
  linearFeet: z.string().optional(),
  units: z.string().optional(),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

// Interfaz para los elementos seleccionados
interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export default function VendorEstimateFormPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados locales
  const [activeTab, setActiveTab] = useState("information");
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<SelectedItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para herramientas de medición
  const [isDigitalMeasurementOpen, setIsDigitalMeasurementOpen] = useState(false);
  const [isLidarScannerOpen, setIsLidarScannerOpen] = useState(false);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [scanResults, setScanResults] = useState<any[]>([]);
  
  // Estado para el formulario especializado
  const [estimateItems, setEstimateItems] = useState<SelectedItem[]>([]);
  
  // Manejar actualización de artículos y total desde el componente especializado
  const handleUpdateTotal = (items: SelectedItem[], total: number) => {
    setEstimateItems(items);
    setTotalAmount(total);
  };
  
  // Limpiar formulario especializado
  const handleClearSpecializedForm = () => {
    setEstimateItems([]);
    setTotalAmount(0);
  };
  
  // Fetch clients
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/clients"],
  });
  
  // Fetch projects
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/projects"],
  });
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      projectId: "",
      serviceType: "",
      materialType: "",
      squareFeet: "",
      linearFeet: "",
      units: "",
      notes: ""
    }
  });
  
  // Watch values
  const watchServiceType = form.watch("serviceType");
  const watchMaterialType = form.watch("materialType");
  const watchClientId = form.watch("clientId");
  
  // Filter projects by client
  const filteredProjects = watchClientId
    ? projects.filter((project: any) => project.clientId?.toString() === watchClientId)
    : [];
  
  // Effect for service type change
  useEffect(() => {
    if (watchServiceType !== selectedServiceType) {
      setSelectedServiceType(watchServiceType);
      form.setValue("materialType", "");
      setSelectedMaterial(null);
      setSelectedOptions([]);
      setEstimateItems([]);
      setTotalAmount(0);
    }
  }, [watchServiceType, selectedServiceType, form]);
  
  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsSubmitting(true);
      const res = await apiRequest("POST", "/api/protected/estimates", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      toast({
        title: "¡Estimado creado exitosamente!",
        description: "El estimado ha sido generado a partir de los datos capturados.",
      });
      // Redirect to the newly created estimate
      setLocation(`/estimates/${data.id}`);
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Error al crear estimado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (totalAmount <= 0) {
      toast({
        title: "Información incompleta",
        description: "Por favor complete las medidas y seleccione al menos un material.",
        variant: "destructive",
      });
      return;
    }
    
    // Build items array for the estimate
    const items = [];
    
    // Add items from specialized form
    estimateItems.forEach(item => {
      items.push({
        description: item.name,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        amount: item.total.toString(),
        notes: item.unit
      });
    });
    
    // Get selected client details
    const selectedClient = clients.find((c: any) => c.id.toString() === values.clientId);
    
    // Prepare estimate data
    const estimateData = {
      clientId: Number(values.clientId),
      projectId: values.projectId && values.projectId !== "none" ? Number(values.projectId) : null,
      estimateNumber: generateEstimateNumber(),
      issueDate: new Date(),
      expiryDate: addDays(new Date(), 30),
      status: "draft",
      subtotal: totalAmount.toString(),
      tax: "0",
      discount: "0",
      total: totalAmount.toString(),
      terms: "1. Este estimado es válido por 30 días a partir de la fecha de emisión.\n2. Se requiere un pago del 50% para iniciar el trabajo.\n3. El balance restante se pagará al completar el trabajo.\n4. Cualquier modificación al alcance del trabajo puede resultar en costos adicionales.",
      notes: values.notes || `Estimado para ${SERVICE_TYPES.find(s => s.value === values.serviceType)?.label} generado durante visita al cliente el ${format(new Date(), "PPP", { locale: es })}`,
      contractorSignature: user?.firstName + " " + user?.lastName,
      items
    };
    
    // Submit estimate
    createEstimateMutation.mutate(estimateData);
  };
  
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
  
  // Funciones para las herramientas de medición
  const handleMeasurementsChange = (newMeasurements: any[]) => {
    setMeasurements(newMeasurements);
    
    toast({
      title: "Medidas actualizadas",
      description: "Las mediciones han sido registradas correctamente.",
    });
  };
  
  const handleScanComplete = (result: any) => {
    setScanResults(prev => [...prev, result]);
    
    toast({
      title: "Escaneo completado",
      description: "El escaneo se ha completado. Puede usar estas imágenes para tomar medidas precisas.",
    });
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Formulario de Estimado para Vendedores" 
        description="Capture rápidamente la información durante citas con clientes para generar estimados precisos"
      />
      
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/estimates')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Estimados
        </Button>
        
        <Button 
          variant="default" 
          size="sm" 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Guardando..." : "Guardar Estimado"}
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="information">Información Básica</TabsTrigger>
              <TabsTrigger value="materials">Materiales</TabsTrigger>
              <TabsTrigger value="summary">Resumen y Total</TabsTrigger>
            </TabsList>
            
            <TabsContent value="information" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Seleccione el cliente y tipo de servicio para este estimado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente*</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
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
                          El cliente para quien se generará este estimado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proyecto</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!watchClientId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar proyecto (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Ninguno / Nuevo Proyecto</SelectItem>
                            {filteredProjects.map((project: any) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Asociar este estimado a un proyecto existente (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Servicio*</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo de servicio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SERVICE_TYPES.map((service) => (
                              <SelectItem key={service.value} value={service.value}>
                                {service.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          El tipo de servicio que se proporcionará
                        </FormDescription>
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
                            placeholder="Ingrese notas adicionales sobre el estimado"
                            {...field}
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Detalles adicionales sobre el trabajo a realizar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("materials")}
                    disabled={!form.getValues("clientId") || !form.getValues("serviceType")}
                  >
                    Siguiente
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="materials" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estimador Especializado</CardTitle>
                  <CardDescription>
                    Configure los materiales, opciones y medidas para {SERVICE_TYPES.find(s => s.value === watchServiceType)?.label || "el servicio"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!watchServiceType ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Por favor, primero seleccione un tipo de servicio en la pestaña anterior</p>
                    </div>
                  ) : (
                    <>
                      {/* Formulario especializado por tipo de servicio */}
                      <ServiceEstimateForm
                        serviceType={watchServiceType}
                        onUpdateTotal={handleUpdateTotal}
                        onClearForm={handleClearSpecializedForm}
                      />
                      
                      {/* Herramientas de medición */}
                      <div className="flex justify-center mt-6 space-x-4">
                        <Dialog open={isDigitalMeasurementOpen} onOpenChange={setIsDigitalMeasurementOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" type="button">
                              <Ruler className="h-4 w-4 mr-2" />
                              Medición Digital
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Herramienta de Medición Digital</DialogTitle>
                              <DialogDescription>
                                Dibuje líneas sobre la imagen para medir distancias con precisión
                              </DialogDescription>
                            </DialogHeader>
                            <div className="min-h-[500px]">
                              <DigitalMeasurement 
                                onMeasurementsChange={handleMeasurementsChange} 
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={isLidarScannerOpen} onOpenChange={setIsLidarScannerOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" type="button">
                              <Scan className="h-4 w-4 mr-2" />
                              Escaneo LiDAR
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Escaneo LiDAR</DialogTitle>
                              <DialogDescription>
                                Use la cámara para escanear el área y obtener medidas precisas
                              </DialogDescription>
                            </DialogHeader>
                            <div className="min-h-[500px]">
                              <LiDARScanner onScanComplete={handleScanComplete} />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setActiveTab("information")}
                  >
                    Atrás
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("summary")}
                    disabled={estimateItems.length === 0}
                  >
                    Siguiente
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="summary" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen del Estimado</CardTitle>
                  <CardDescription>
                    Revise la información antes de generar el estimado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-md font-medium mb-2">Información del Cliente</h3>
                      <div className="rounded-md bg-muted p-4">
                        {watchClientId ? (
                          <>
                            {clients.find((c: any) => c.id.toString() === watchClientId) && (
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {clients.find((c: any) => c.id.toString() === watchClientId)?.firstName} {clients.find((c: any) => c.id.toString() === watchClientId)?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {clients.find((c: any) => c.id.toString() === watchClientId)?.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {clients.find((c: any) => c.id.toString() === watchClientId)?.phone}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {clients.find((c: any) => c.id.toString() === watchClientId)?.address}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">No se ha seleccionado un cliente</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium mb-2">Detalles del Servicio</h3>
                      <div className="rounded-md bg-muted p-4">
                        {watchServiceType ? (
                          <div className="space-y-2">
                            <p>
                              <span className="font-medium">Tipo de Servicio:</span>{" "}
                              {SERVICE_TYPES.find(s => s.value === watchServiceType)?.label}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No se ha seleccionado un servicio</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">Desglose de Costos</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50%]">Ítem</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unitario</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estimateItems.map((item, index) => (
                          <TableRow key={item.id || index}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              ${item.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {estimateItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No hay ítems en este estimado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3}>Total Estimado</TableCell>
                          <TableCell className="text-right font-bold">
                            ${totalAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <h3 className="text-md font-medium mb-2">Notas</h3>
                    <p className="text-sm text-muted-foreground">
                      {form.getValues("notes") || "No se han agregado notas"}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setActiveTab("materials")}
                  >
                    Atrás
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || estimateItems.length === 0}
                  >
                    {isSubmitting ? "Guardando..." : "Generar Estimado"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}