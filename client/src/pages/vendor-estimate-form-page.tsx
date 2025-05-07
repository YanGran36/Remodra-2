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
  materialType: z.string().min(1, { message: "Por favor seleccione un material" }),
  squareFeet: z.string().optional(),
  linearFeet: z.string().optional(),
  units: z.string().optional(),
  notes: z.string().optional(),
  options: z.array(
    z.object({
      id: z.string(),
      quantity: z.string()
    })
  ).optional()
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
      notes: "",
      options: []
    }
  });
  
  // Watch values
  const watchServiceType = form.watch("serviceType");
  const watchMaterialType = form.watch("materialType");
  const watchClientId = form.watch("clientId");
  const watchSquareFeet = form.watch("squareFeet");
  const watchLinearFeet = form.watch("linearFeet");
  const watchUnits = form.watch("units");
  
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
      
      // Reset measurement fields based on service type
      form.setValue("squareFeet", "");
      form.setValue("linearFeet", "");
      form.setValue("units", "");
    }
  }, [watchServiceType, selectedServiceType, form]);
  
  // Effect for material type change
  useEffect(() => {
    if (watchMaterialType && watchServiceType) {
      const materials = MATERIALS_BY_SERVICE[watchServiceType as keyof typeof MATERIALS_BY_SERVICE] || [];
      const material = materials.find(m => m.id === watchMaterialType);
      
      if (material) {
        setSelectedMaterial(material);
      } else {
        setSelectedMaterial(null);
      }
    }
  }, [watchMaterialType, watchServiceType]);
  
  // Effect to calculate total
  useEffect(() => {
    let total = 0;
    
    // Add material cost
    if (selectedMaterial) {
      if (selectedMaterial.unit === "sq.ft" && watchSquareFeet) {
        total += selectedMaterial.unitPrice * Number(watchSquareFeet);
      } else if (selectedMaterial.unit === "ln.ft" && watchLinearFeet) {
        total += selectedMaterial.unitPrice * Number(watchLinearFeet);
      } else if (selectedMaterial.unit === "unit" && watchUnits) {
        total += selectedMaterial.unitPrice * Number(watchUnits);
      }
    }
    
    // Add options cost
    selectedOptions.forEach(option => {
      total += option.total;
    });
    
    setTotalAmount(total);
  }, [selectedMaterial, watchSquareFeet, watchLinearFeet, watchUnits, selectedOptions]);
  
  // Handle option selection
  const handleOptionChange = (option: any, quantity: string) => {
    const numQuantity = Number(quantity);
    
    if (numQuantity <= 0) {
      // Remove option if quantity is zero or negative
      setSelectedOptions(prev => prev.filter(item => item.id !== option.id));
      return;
    }
    
    const existingIndex = selectedOptions.findIndex(item => item.id === option.id);
    
    if (existingIndex >= 0) {
      // Update existing option
      const updatedOptions = [...selectedOptions];
      updatedOptions[existingIndex] = {
        ...option,
        quantity: numQuantity,
        total: option.unitPrice * numQuantity
      };
      setSelectedOptions(updatedOptions);
    } else {
      // Add new option
      setSelectedOptions([
        ...selectedOptions,
        {
          ...option,
          quantity: numQuantity,
          total: option.unitPrice * numQuantity
        }
      ]);
    }
  };
  
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
    
    // Add main material item
    if (selectedMaterial) {
      let quantity = 0;
      let description = selectedMaterial.name;
      
      if (selectedMaterial.unit === "sq.ft" && values.squareFeet) {
        quantity = Number(values.squareFeet);
        description += ` (${quantity} pies cuadrados)`;
      } else if (selectedMaterial.unit === "ln.ft" && values.linearFeet) {
        quantity = Number(values.linearFeet);
        description += ` (${quantity} pies lineales)`;
      } else if (selectedMaterial.unit === "unit" && values.units) {
        quantity = Number(values.units);
        description += ` (${quantity} unidades)`;
      }
      
      if (quantity > 0) {
        items.push({
          description,
          quantity: quantity.toString(),
          unitPrice: selectedMaterial.unitPrice.toString(),
          amount: (quantity * selectedMaterial.unitPrice).toString(),
          notes: "Material principal"
        });
      }
    }
    
    // Add options as items
    selectedOptions.forEach(option => {
      items.push({
        description: option.name,
        quantity: option.quantity.toString(),
        unitPrice: option.unitPrice.toString(),
        amount: option.total.toString(),
        notes: "Opción adicional"
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
    
    // Si hay mediciones y estamos midiendo un área, actualizar los pies cuadrados
    if (newMeasurements.length >= 2 && selectedMaterial?.unit === "sq.ft") {
      // Calcular área rectangular usando las primeras dos mediciones
      const area = newMeasurements[0].realLength * newMeasurements[1].realLength;
      form.setValue("squareFeet", area.toFixed(2));
      
      toast({
        title: "Medidas actualizadas",
        description: `Área calculada: ${area.toFixed(2)} pies cuadrados`,
      });
    } 
    // Si estamos midiendo una longitud, actualizar los pies lineales
    else if (newMeasurements.length > 0 && selectedMaterial?.unit === "ln.ft") {
      // Usar la primera medición como longitud lineal
      const length = newMeasurements[0].realLength;
      form.setValue("linearFeet", length.toFixed(2));
      
      toast({
        title: "Medidas actualizadas",
        description: `Longitud calculada: ${length.toFixed(2)} pies lineales`,
      });
    }
  };
  
  const handleScanComplete = (result: any) => {
    setScanResults(prev => [...prev, result]);
    
    toast({
      title: "Escaneo completado",
      description: "El escaneo se ha completado. Puede usar estas imágenes para tomar medidas precisas.",
    });
  };
  
  // Helper to render measurement input based on service type and material
  const renderMeasurementInput = () => {
    if (!selectedMaterial) return null;
    
    // Botones de herramientas de medición
    const measurementTools = (
      <div className="flex items-center gap-2 mt-2 mb-4">
        <Dialog open={isDigitalMeasurementOpen} onOpenChange={setIsDigitalMeasurementOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" type="button" size="sm">
              <Ruler className="h-4 w-4 mr-2" />
              Medir Digitalmente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Herramienta de Medición Digital</DialogTitle>
              <DialogDescription>
                Dibuje líneas para medir longitudes o áreas. Use la calibración para establecer la escala correcta.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4">
              <DigitalMeasurement 
                unit="ft"
                onMeasurementsChange={handleMeasurementsChange}
                canvasWidth={750}
                canvasHeight={500}
              />
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsDigitalMeasurementOpen(false)}>
                Aceptar Medidas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isLidarScannerOpen} onOpenChange={setIsLidarScannerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" type="button" size="sm">
              <Scan className="h-4 w-4 mr-2" />
              Escanear Espacio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Escáner LiDAR Simulado</DialogTitle>
              <DialogDescription>
                Escanee espacios virtualmente o cargue imágenes para generar un mapa de profundidad y tomar medidas precisas.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4">
              <LiDARScanner 
                onScanComplete={handleScanComplete}
                width={750}
                height={500}
                unit="ft"
              />
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsLidarScannerOpen(false)}>
                Aceptar Escaneo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" type="button" size="sm">
          <Camera className="h-4 w-4 mr-2" />
          Usar Cámara
        </Button>
      </div>
    );
    
    if (selectedMaterial.unit === "sq.ft") {
      return (
        <div>
          {measurementTools}
          <FormField
            control={form.control}
            name="squareFeet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pies Cuadrados</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    step="0.01" 
                    placeholder="Ingrese los pies cuadrados" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Medida en pies cuadrados del área a cubrir. Use las herramientas de medición para mayor precisión.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {measurements.length >= 2 && (
            <div className="mt-2 text-sm p-2 bg-muted rounded border">
              <p className="font-medium">Mediciones registradas:</p>
              <ul className="list-disc pl-5 mt-1">
                {measurements.slice(0, 2).map((m, i) => (
                  <li key={i}>
                    Medida {i+1}: {m.realLength.toFixed(2)} ft
                  </li>
                ))}
                <li className="font-medium text-primary">
                  Área calculada: {(measurements[0].realLength * measurements[1].realLength).toFixed(2)} ft²
                </li>
              </ul>
            </div>
          )}
        </div>
      );
    } else if (selectedMaterial.unit === "ln.ft") {
      return (
        <div>
          {measurementTools}
          <FormField
            control={form.control}
            name="linearFeet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pies Lineales</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    step="0.01" 
                    placeholder="Ingrese los pies lineales" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Medida en pies lineales del área a cubrir. Use las herramientas de medición para mayor precisión.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {measurements.length > 0 && (
            <div className="mt-2 text-sm p-2 bg-muted rounded border">
              <p className="font-medium">Medición registrada:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>
                  Longitud: {measurements[0].realLength.toFixed(2)} ft
                </li>
              </ul>
            </div>
          )}
        </div>
      );
    } else if (selectedMaterial.unit === "unit") {
      return (
        <div>
          {measurementTools}
          <FormField
            control={form.control}
            name="units"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidades</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    step="1" 
                    placeholder="Ingrese el número de unidades" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Cantidad de unidades necesarias. Use las herramientas de medición para verificar dimensiones.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {scanResults.length > 0 && (
            <div className="mt-2 text-sm p-2 bg-muted rounded border">
              <p className="font-medium">Escaneos realizados: {scanResults.length}</p>
              <p>Los escaneos pueden ayudar a determinar la cantidad de unidades necesarias.</p>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  // Helper to get option quantity
  const getOptionQuantity = (optionId: string): string => {
    const option = selectedOptions.find(o => o.id === optionId);
    return option ? option.quantity.toString() : "";
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
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Estimados
        </Button>
        
        <div className="flex items-center space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Generar Estimado
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Generar estimado oficial?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto creará un estimado en el sistema utilizando la información capturada. El estimado se guardará como borrador y podrás editarlo después.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                  {isSubmitting ? "Generando..." : "Generar Estimado"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="information">Información Básica</TabsTrigger>
          <TabsTrigger value="materials">Materiales</TabsTrigger>
          <TabsTrigger value="summary">Resumen y Total</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="information" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Cliente y Proyecto</CardTitle>
                  <CardDescription>
                    Seleccione el cliente y proyecto para este estimado
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
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar proyecto (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin proyecto</SelectItem>
                            {filteredProjects.map((project: any) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Seleccione un proyecto existente o deje en blanco para crear uno nuevo después
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
                          El tipo de servicio determinará los materiales disponibles
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
                            placeholder="Ingrese cualquier nota adicional o detalles específicos del cliente"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Información adicional relevante para el estimado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" disabled>Atrás</Button>
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
                    disabled={!selectedMaterial}
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
                            {selectedMaterial && (
                              <p>
                                <span className="font-medium">Material Principal:</span>{" "}
                                {selectedMaterial.name}
                              </p>
                            )}
                            {watchSquareFeet && (
                              <p>
                                <span className="font-medium">Pies Cuadrados:</span>{" "}
                                {watchSquareFeet}
                              </p>
                            )}
                            {watchLinearFeet && (
                              <p>
                                <span className="font-medium">Pies Lineales:</span>{" "}
                                {watchLinearFeet}
                              </p>
                            )}
                            {watchUnits && (
                              <p>
                                <span className="font-medium">Unidades:</span>{" "}
                                {watchUnits}
                              </p>
                            )}
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
                        {selectedMaterial && (
                          <TableRow>
                            <TableCell className="font-medium">{selectedMaterial.name}</TableCell>
                            <TableCell>
                              {selectedMaterial.unit === "sq.ft" && watchSquareFeet
                                ? `${watchSquareFeet} sq.ft`
                                : selectedMaterial.unit === "ln.ft" && watchLinearFeet
                                ? `${watchLinearFeet} ln.ft`
                                : selectedMaterial.unit === "unit" && watchUnits
                                ? `${watchUnits} units`
                                : "-"}
                            </TableCell>
                            <TableCell>${selectedMaterial.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              ${(selectedMaterial.unit === "sq.ft" && watchSquareFeet
                                ? selectedMaterial.unitPrice * Number(watchSquareFeet)
                                : selectedMaterial.unit === "ln.ft" && watchLinearFeet
                                ? selectedMaterial.unitPrice * Number(watchLinearFeet)
                                : selectedMaterial.unit === "unit" && watchUnits
                                ? selectedMaterial.unitPrice * Number(watchUnits)
                                : 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        )}
                        
                        {selectedOptions.map((option) => (
                          <TableRow key={option.id}>
                            <TableCell>{option.name}</TableCell>
                            <TableCell>{option.quantity}</TableCell>
                            <TableCell>${option.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${option.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        
                        {(!selectedMaterial && selectedOptions.length === 0) && (
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
                    disabled={isSubmitting || totalAmount <= 0}
                  >
                    {isSubmitting ? "Generando..." : "Generar Estimado"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}