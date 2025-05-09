import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAiCostAnalysis, MaterialInput, AiAnalysisResult } from "@/hooks/use-ai-cost-analysis";
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
  Camera,
  BarChart4
} from "lucide-react";

// Componente de análisis AI
import AiAnalysisPanel from "@/components/ai/ai-analysis-panel";

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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Importar tipos y datos de servicio
import { 
  SERVICE_TYPES, 
  MATERIALS_BY_SERVICE, 
  OPTIONS_BY_SERVICE,
  SERVICE_INFO,
  getServiceLabel
} from "@/lib/service-options";

// Define el esquema de validación del formulario
const formSchema = z.object({
  clientId: z.string().min(1, { message: "Por favor seleccione un cliente" }),
  projectId: z.string().optional(),
  serviceType: z.string().min(1, { message: "Por favor seleccione un tipo de servicio" }),
  materialType: z.string().optional(),
  squareFeet: z.string().optional(),
  linearFeet: z.string().optional(),
  units: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "complex"]).default("medium"),
  notes: z.string().optional(),
  additionalInfo: z.string().optional(),
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

export default function VendorEstimateFormPageNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados locales
  const [activeTab, setActiveTab] = useState("information");
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialInput[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para herramientas de medición
  const [isDigitalMeasurementOpen, setIsDigitalMeasurementOpen] = useState(false);
  const [isLidarScannerOpen, setIsLidarScannerOpen] = useState(false);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [scanResults, setScanResults] = useState<any[]>([]);
  
  // Funciones auxiliares
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
  
  function generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    // Generate a random 3-digit number
    const random = Math.floor(Math.random() * 900) + 100;
    return `INV-${year}-${random}`;
  }
  
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
      difficulty: "medium",
      notes: "",
      additionalInfo: ""
    }
  });
  
  // Watch values
  const watchServiceType = form.watch("serviceType");
  const watchMaterialType = form.watch("materialType");
  const watchClientId = form.watch("clientId");
  const watchProjectId = form.watch("projectId");
  const watchSquareFeet = form.watch("squareFeet");
  const watchLinearFeet = form.watch("linearFeet");
  const watchUnits = form.watch("units");
  const watchDifficulty = form.watch("difficulty");
  const watchNotes = form.watch("notes");
  const watchAdditionalInfo = form.watch("additionalInfo");
  
  // Filter projects by client
  const filteredProjects = watchClientId
    ? projects.filter((project: any) => project.clientId?.toString() === watchClientId)
    : [];
  
  // Efecto para cargar materiales relevantes cuando cambia el tipo de servicio
  useEffect(() => {
    if (watchServiceType && Object.prototype.hasOwnProperty.call(MATERIALS_BY_SERVICE, watchServiceType)) {
      // Reiniciar materiales seleccionados cuando cambia el servicio
      setSelectedMaterials([]);
      setSelectedOptions([]);
      
      // Incluir TODOS los materiales básicos automáticamente para este tipo de servicio
      const allMaterials = MATERIALS_BY_SERVICE[watchServiceType as keyof typeof MATERIALS_BY_SERVICE] || [];
      const initialMaterials: MaterialInput[] = allMaterials.map((material: any) => ({
        name: material.name,
        quantity: 1,
        unit: material.unit,
        unitPrice: material.unitPrice || 0,
      }));
      
      setSelectedMaterials(initialMaterials);
      
      // Calcular total inicial
      const initialTotal = initialMaterials.reduce((sum, mat) => sum + (mat.quantity * mat.unitPrice), 0);
      setTotalAmount(initialTotal);
      
      toast({
        title: "Materiales básicos incluidos",
        description: `Se han agregado automáticamente ${initialMaterials.length} materiales básicos para ${getServiceLabel(watchServiceType)}`,
      });
    }
  }, [watchServiceType]);
  
  // Función para manejar el envío del formulario
  const onSubmit = (data: any) => {
    console.log("Enviando formulario para crear estimado con datos:", data);
    
    // Verificar que se haya seleccionado un cliente
    if (!data.clientId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente antes de crear un estimado",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar que haya materiales seleccionados
    if (selectedMaterials.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un material al estimado",
        variant: "destructive",
      });
      return;
    }

    // Preparar los materiales para el estimado
    const items = selectedMaterials.map(material => ({
      description: material.name,
      quantity: material.quantity.toString(),
      unitPrice: material.unitPrice.toString(),
      amount: (material.quantity * material.unitPrice).toString(),
      notes: ""
    }));

    // Calcular totales
    const subtotal = selectedMaterials.reduce((sum, mat) => sum + (mat.quantity * mat.unitPrice), 0);
    setTotalAmount(subtotal); // Actualizar el estado de totalAmount
    
    // Preparar datos del estimado
    const estimateData = {
      clientId: Number(data.clientId),
      projectId: data.projectId && data.projectId !== "none" ? Number(data.projectId) : null,
      estimateNumber: generateEstimateNumber(),
      issueDate: new Date(),
      expiryDate: addDays(new Date(), 30),
      status: "draft",
      subtotal: subtotal.toString(),
      tax: "0",
      discount: "0",
      total: subtotal.toString(),
      terms: "1. Este estimado es válido por 30 días a partir de la fecha de emisión.\n2. Se requiere un pago del 50% para iniciar el trabajo.\n3. El balance restante se pagará al completar el trabajo.\n4. Cualquier modificación al alcance del trabajo puede resultar en costos adicionales.",
      notes: data.notes || "",
      contractorSignature: user?.firstName + " " + user?.lastName,
      items
    };
    
    console.log("Datos del estimado a crear:", estimateData);
    
    // Enviar petición para crear estimado
    createEstimateMutation.mutate(estimateData);
  };

  // Crear mutation para estimados
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
  
  // Crear mutation para facturas
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsSubmitting(true);
      const res = await apiRequest("POST", "/api/protected/invoices", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "¡Factura creada exitosamente!",
        description: "La factura ha sido generada a partir de los datos capturados.",
      });
      // Redirect to the newly created invoice
      setLocation(`/invoices/${data.id}`);
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Error al crear factura",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handler para crear estimado desde análisis de IA
  const handleCreateEstimateFromAnalysis = (analysisResult: AiAnalysisResult) => {
    if (!watchClientId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente antes de crear un estimado",
        variant: "destructive",
      });
      return;
    }
    
    // Preparar los ítems del estimado a partir del análisis
    const items = analysisResult.breakdown.materials.items.map(item => ({
      description: item.name,
      quantity: "1",
      unitPrice: item.estimatedCost.toString(),
      amount: item.estimatedCost.toString(),
      notes: item.notes || ""
    }));
    
    // Agregar ítem de mano de obra
    items.push({
      description: `Mano de obra (${analysisResult.breakdown.labor.estimatedHours} horas)`,
      quantity: "1",
      unitPrice: analysisResult.breakdown.labor.total.toString(),
      amount: analysisResult.breakdown.labor.total.toString(),
      notes: analysisResult.breakdown.labor.notes || ""
    });
    
    // Obtener cliente seleccionado
    const selectedClient = clients.find((c: any) => c.id.toString() === watchClientId);
    
    // Preparar datos del estimado
    const estimateData = {
      clientId: Number(watchClientId),
      projectId: watchProjectId && watchProjectId !== "none" ? Number(watchProjectId) : null,
      estimateNumber: generateEstimateNumber(),
      issueDate: new Date(),
      expiryDate: addDays(new Date(), 30),
      status: "draft",
      subtotal: analysisResult.recommendedTotal.toString(),
      tax: "0",
      discount: "0",
      total: analysisResult.recommendedTotal.toString(),
      terms: "1. Este estimado es válido por 30 días a partir de la fecha de emisión.\n2. Se requiere un pago del 50% para iniciar el trabajo.\n3. El balance restante se pagará al completar el trabajo.\n4. Cualquier modificación al alcance del trabajo puede resultar en costos adicionales.",
      notes: analysisResult.summary,
      contractorSignature: user?.firstName + " " + user?.lastName,
      items
    };
    
    // Enviar petición para crear estimado
    createEstimateMutation.mutate(estimateData);
  };
  
  // Handler para crear factura desde análisis de IA
  const handleCreateInvoiceFromAnalysis = (analysisResult: AiAnalysisResult) => {
    if (!watchClientId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente antes de crear una factura",
        variant: "destructive",
      });
      return;
    }
    
    // Preparar los ítems de la factura a partir del análisis
    const items = analysisResult.breakdown.materials.items.map(item => ({
      description: item.name,
      quantity: "1",
      unitPrice: item.estimatedCost.toString(),
      amount: item.estimatedCost.toString(),
      notes: item.notes || ""
    }));
    
    // Agregar ítem de mano de obra
    items.push({
      description: `Mano de obra (${analysisResult.breakdown.labor.estimatedHours} horas)`,
      quantity: "1",
      unitPrice: analysisResult.breakdown.labor.total.toString(),
      amount: analysisResult.breakdown.labor.total.toString(),
      notes: analysisResult.breakdown.labor.notes || ""
    });
    
    // Obtener cliente seleccionado
    const selectedClient = clients.find((c: any) => c.id.toString() === watchClientId);
    
    // Preparar datos de la factura
    const invoiceData = {
      clientId: Number(watchClientId),
      projectId: watchProjectId && watchProjectId !== "none" ? Number(watchProjectId) : null,
      invoiceNumber: generateInvoiceNumber(),
      issueDate: new Date(),
      dueDate: addDays(new Date(), 15),
      status: "pending",
      subtotal: analysisResult.recommendedTotal.toString(),
      tax: "0",
      discount: "0",
      total: analysisResult.recommendedTotal.toString(),
      notes: analysisResult.summary,
      paymentTerms: "Pago a 15 días",
      items
    };
    
    // Enviar petición para crear factura
    createInvoiceMutation.mutate(invoiceData);
  };
  
  // Las funciones auxiliares addDays, generateEstimateNumber y generateInvoiceNumber
  // ya están definidas al inicio del componente, por lo que se omiten aquí.
  
  // Funciones para las herramientas de medición
  const handleMeasurementsChange = (newMeasurements: any[]) => {
    setMeasurements(newMeasurements);
    
    // Si hay medidas en pies cuadrados o lineales, actualizar el formulario
    const squareFeetMeasurement = newMeasurements.find(m => m.type === "area");
    const linearFeetMeasurement = newMeasurements.find(m => m.type === "linear");
    
    if (squareFeetMeasurement) {
      form.setValue("squareFeet", squareFeetMeasurement.value.toString());
    }
    
    if (linearFeetMeasurement) {
      form.setValue("linearFeet", linearFeetMeasurement.value.toString());
    }
    
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
  
  // Funciones para manipular materiales
  const handleAddMaterial = () => {
    if (!watchMaterialType) {
      toast({
        title: "Seleccione un material",
        description: "Debe seleccionar un tipo de material para agregarlo.",
        variant: "destructive",
      });
      return;
    }
    
    if (!watchServiceType || !Object.prototype.hasOwnProperty.call(MATERIALS_BY_SERVICE, watchServiceType)) {
      toast({
        title: "Error",
        description: "Seleccione un tipo de servicio válido.",
        variant: "destructive",
      });
      return;
    }
    
    const materials = MATERIALS_BY_SERVICE[watchServiceType as keyof typeof MATERIALS_BY_SERVICE];
    const materialInfo = materials.find((m: any) => m.id === watchMaterialType);
    
    if (!materialInfo) return;
    
    const newMaterial: MaterialInput = {
      name: materialInfo.name,
      quantity: 1,
      unit: materialInfo.unit,
      unitPrice: materialInfo.unitPrice || 0,
    };
    
    setSelectedMaterials(prev => [...prev, newMaterial]);
  };
  
  const handleRemoveMaterial = (index: number) => {
    setSelectedMaterials(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpdateMaterialQuantity = (index: number, newQuantity: number) => {
    setSelectedMaterials(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: newQuantity };
      return updated;
    });
  };
  
  // Propiedades para el panel de análisis de IA
  const aiAnalysisProps = {
    serviceType: watchServiceType,
    materials: selectedMaterials,
    propertySize: {
      squareFeet: watchSquareFeet ? parseFloat(watchSquareFeet) : undefined,
      linearFeet: watchLinearFeet ? parseFloat(watchLinearFeet) : undefined,
      units: watchUnits ? parseFloat(watchUnits) : undefined,
    },
    difficulty: watchDifficulty as "easy" | "medium" | "complex",
    additionalInfo: watchAdditionalInfo,
    onCreateEstimate: handleCreateEstimateFromAnalysis,
    onCreateInvoice: handleCreateInvoiceFromAnalysis,
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Formulario Avanzado para Vendedores" 
        description="Capture datos durante citas y conviértalos en estimados o facturas con ayuda de IA"
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
      </div>
      
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} id="vendor-estimate-form">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="information">Información Básica</TabsTrigger>
              <TabsTrigger value="materials">Materiales y Medidas</TabsTrigger>
              <TabsTrigger value="analysis">Análisis y Creación</TabsTrigger>
            </TabsList>
            
            {/* TAB: Información Básica */}
            <TabsContent value="information" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cliente y Servicio</CardTitle>
                  <CardDescription>
                    Seleccione el cliente y tipo de servicio para este trabajo
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
                          El cliente para quien se realizará este trabajo
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
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Asociar este trabajo a un proyecto existente (opcional)
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
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dificultad del Trabajo</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar nivel de dificultad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Fácil (terreno plano, acceso sencillo)</SelectItem>
                            <SelectItem value="medium">Media (algo de complejidad)</SelectItem>
                            <SelectItem value="complex">Compleja (terreno difícil, problemas de acceso)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          La dificultad afectará el análisis de costos y estimaciones
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Información Adicional</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Incluya cualquier detalle adicional que pueda afectar el trabajo..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Detalles como condiciones del sitio, requisitos especiales, etc.
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
                  >
                    Siguiente: Materiales y Medidas
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* TAB: Materiales y Medidas */}
            <TabsContent value="materials" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna 1: Materiales */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Materiales</CardTitle>
                    <CardDescription>
                      Agregar los materiales necesarios para este trabajo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {watchServiceType && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          <FormField
                            control={form.control}
                            name="materialType"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <div className="flex space-x-2">
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-[300px]">
                                        <SelectValue placeholder="Seleccionar material" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {watchServiceType && Object.prototype.hasOwnProperty.call(MATERIALS_BY_SERVICE, watchServiceType) 
                                       ? MATERIALS_BY_SERVICE[watchServiceType as keyof typeof MATERIALS_BY_SERVICE].map((material: any) => (
                                        <SelectItem key={material.id} value={material.id}>
                                          {material.name}
                                        </SelectItem>
                                      ))
                                      : null
                                      }
                                    </SelectContent>
                                  </Select>
                                  <Button type="button" onClick={handleAddMaterial}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      {selectedMaterials.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Unidad</TableHead>
                              <TableHead>Precio unitario</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedMaterials.map((material, index) => (
                              <TableRow key={index}>
                                <TableCell>{material.name}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    className="w-16"
                                    value={material.quantity}
                                    onChange={(e) => handleUpdateMaterialQuantity(index, parseInt(e.target.value) || 1)}
                                  />
                                </TableCell>
                                <TableCell>{material.unit}</TableCell>
                                <TableCell>${material.unitPrice.toFixed(2)}</TableCell>
                                <TableCell>${(material.quantity * material.unitPrice).toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveMaterial(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center p-4 border border-dashed rounded-md">
                          <p className="text-muted-foreground">
                            No hay materiales seleccionados. Seleccione un tipo de servicio y agregue materiales.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Columna 2: Herramientas de Medición */}
                <Card>
                  <CardHeader>
                    <CardTitle>Medidas</CardTitle>
                    <CardDescription>
                      Registre las dimensiones de la propiedad
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="squareFeet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pies cuadrados</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="linearFeet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pies lineales</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="units"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidades</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator className="my-4" />
                    
                    <div className="flex flex-col space-y-2">
                      <h3 className="text-sm font-medium">Herramientas de medición</h3>
                      
                      <Dialog open={isDigitalMeasurementOpen} onOpenChange={setIsDigitalMeasurementOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Ruler className="h-4 w-4 mr-2" />
                            Medición Digital
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                          <DialogTitle>Herramienta de Medición Digital</DialogTitle>
                          <div className="flex-1 overflow-hidden">
                            <DigitalMeasurement 
                              onMeasurementsChange={handleMeasurementsChange}
                              initialMeasurements={measurements}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={isLidarScannerOpen} onOpenChange={setIsLidarScannerOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Scan className="h-4 w-4 mr-2" />
                            Escáner LiDAR
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh]">
                          <DialogTitle>Escáner LiDAR</DialogTitle>
                          <div className="h-full">
                            <LiDARScanner onScanComplete={handleScanComplete} />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>Notas del trabajo</CardTitle>
                    <CardDescription>
                      Registre observaciones importantes sobre este trabajo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Notas y observaciones sobre el trabajo..."
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Incluya detalles importantes, preferencias del cliente, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setActiveTab("analysis")}
                      disabled={selectedMaterials.length === 0}
                    >
                      {selectedMaterials.length === 0 
                        ? "Agregue al menos un material" 
                        : "Siguiente: Análisis y Creación"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            {/* TAB: Análisis y Creación */}
            <TabsContent value="analysis" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen de Datos Capturados</CardTitle>
                      <CardDescription>
                        Revise los datos ingresados antes de continuar
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-semibold">Cliente:</h3>
                          <p>
                            {watchClientId 
                              ? clients.find((c: any) => c.id.toString() === watchClientId)?.firstName + ' ' + 
                                clients.find((c: any) => c.id.toString() === watchClientId)?.lastName
                              : "No seleccionado"}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-semibold">Tipo de servicio:</h3>
                          <p>{getServiceLabel(watchServiceType) || "No seleccionado"}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-semibold">Proyecto:</h3>
                          <p>
                            {watchProjectId && watchProjectId !== "none"
                              ? projects.find((p: any) => p.id.toString() === watchProjectId)?.title
                              : "Nuevo proyecto"}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-semibold">Dificultad:</h3>
                          <p>
                            {watchDifficulty === "easy" ? "Fácil" :
                             watchDifficulty === "medium" ? "Media" :
                             watchDifficulty === "complex" ? "Compleja" : "No especificada"}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-semibold">Medidas:</h3>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          {watchSquareFeet && (
                            <Badge variant="outline">{watchSquareFeet} pies²</Badge>
                          )}
                          {watchLinearFeet && (
                            <Badge variant="outline">{watchLinearFeet} pies lineales</Badge>
                          )}
                          {watchUnits && (
                            <Badge variant="outline">{watchUnits} unidades</Badge>
                          )}
                        </div>
                      </div>
                      
                      <Accordion type="single" collapsible>
                        <AccordionItem value="materials">
                          <AccordionTrigger>
                            Materiales ({selectedMaterials.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-1">
                              {selectedMaterials.map((mat, i) => (
                                <li key={i} className="text-sm">
                                  {mat.quantity} {mat.unit} de {mat.name} - ${(mat.quantity * mat.unitPrice).toFixed(2)}
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <AiAnalysisPanel {...aiAnalysisProps} />
                </div>
              </div>
              
              {/* Botón de envío del formulario */}
              <div className="flex justify-center mt-8">
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full max-w-md"
                  disabled={isSubmitting}
                  onClick={() => {
                    // Forzar que cambie a la pestaña de información básica si no hay cliente seleccionado
                    if (!watchClientId) {
                      setActiveTab("information");
                      toast({
                        title: "Atención",
                        description: "Debe seleccionar un cliente primero",
                      });
                      return;
                    }
                    
                    // Asegurarse de que el formulario se envíe correctamente
                    console.log("Haciendo click en Crear Estimado desde Formulario");
                    if (selectedMaterials.length === 0) {
                      toast({
                        title: "Atención",
                        description: "Debe agregar al menos un material",
                      });
                      return;
                    }
                    
                    // No necesitamos llamar a onSubmit aquí, ya que el botón es de tipo submit
                    // y el formulario ya tiene el controlador onSubmit asociado
                  }}
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Creando estimado..." : "Crear Estimado desde Formulario"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}