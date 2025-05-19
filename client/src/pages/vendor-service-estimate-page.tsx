import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

// Hooks
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useClients } from "@/hooks/use-clients";
import { useEstimates } from "@/hooks/use-estimates";
import { useAiCostAnalysis, MaterialInput, AiAnalysisResult } from "@/hooks/use-ai-cost-analysis";

// Service data and utilities
import { 
  SERVICE_TYPES, 
  MATERIALS_BY_SERVICE, 
  OPTIONS_BY_SERVICE,
  SERVICE_INFO,
  getServiceLabel,
  getMaterial,
  getOption
} from "@/lib/service-options";

// Icons
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Minus, 
  Trash, 
  Calculator, 
  CalendarIcon, 
  Loader2,
  Ruler,
  Scan
} from "lucide-react";

// UI Components
import { ServiceItemSelector } from "@/components/estimates/service-item-selector";
import AiAnalysisPanel from "@/components/ai/ai-analysis-panel";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

// Digital Measurement Components
import DigitalMeasurement from "@/components/measurement/digital-measurement";
import LiDARScanner from "@/components/measurement/lidar-scanner";

// Definición del esquema de validación para el formulario
const estimateFormSchema = z.object({
  clientId: z.coerce.number().positive("Please select a client"),
  projectId: z.coerce.number().optional(),
  estimateNumber: z.string().optional(),
  issueDate: z.date(),
  expiryDate: z.date().optional(),
  status: z.string().default("pending"),
  subtotal: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional()
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

// Interfaz para ítems seleccionados
interface SelectedItem {
  id: string;
  service: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  type: 'material' | 'option';
}

export default function VendorServiceEstimatePage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados locales
  const [activeTab, setActiveTab] = useState("client");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Estados para herramientas de medición
  const [isDigitalMeasurementOpen, setIsDigitalMeasurementOpen] = useState(false);
  const [isLidarScannerOpen, setIsLidarScannerOpen] = useState(false);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [scanResults, setScanResults] = useState<any[]>([]);
  
  // Para análisis de AI
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const { analyzeJobCost, isAnalyzing } = useAiCostAnalysis();

  // Hooks para datos
  const clientsData = useClients();
  const clients = clientsData.clients || [];
  const { createEstimateMutation } = useEstimates();
  
  // Formulario con react-hook-form y zod
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      clientId: 0,
      projectId: 0,
      issueDate: new Date(),
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 días después
      status: "pending",
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      notes: "",
      terms: "Standard terms and conditions apply."
    }
  });

  useEffect(() => {
    // Si se completa la carga inicial
    setIsLoading(false);
  }, [clients]);

  // Manejar selección de servicio
  const toggleServiceType = (serviceType: string) => {
    setSelectedServiceTypes(prev => {
      // Si ya está seleccionado, lo quitamos
      if (prev.includes(serviceType)) {
        // Eliminar también los materiales relacionados con este servicio
        setSelectedItems(items => 
          items.filter(item => item.service !== serviceType)
        );
        return prev.filter(type => type !== serviceType);
      } 
      // Si no está seleccionado, lo agregamos
      return [...prev, serviceType];
    });
  };

  // Manejar adición de un material al estimado
  const addMaterial = (serviceType: string, materialId: string) => {
    const material = getMaterial(serviceType, materialId);
    if (!material) return;
    
    // Verificar si ya existe
    const existingIndex = selectedItems.findIndex(item => 
      item.id === material.id && item.type === 'material' && item.service === serviceType
    );
    
    let updatedItems = [...selectedItems];
    
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + 1,
        total: (updatedItems[existingIndex].quantity + 1) * updatedItems[existingIndex].unitPrice
      };
    } else {
      // Agregar nuevo ítem
      updatedItems.push({
        id: material.id,
        service: serviceType,
        name: material.name,
        description: `${getServiceLabel(serviceType)} - ${material.name}`,
        quantity: 1,
        unit: material.unit,
        unitPrice: material.unitPrice,
        total: material.unitPrice,
        type: 'material'
      });
    }
    
    setSelectedItems(updatedItems);
    recalculateTotal(updatedItems);
  };

  // Manejar adición de una opción al estimado
  const addOption = (serviceType: string, optionId: string) => {
    const option = getOption(serviceType, optionId);
    if (!option) return;
    
    // Verificar si ya existe
    const existingIndex = selectedItems.findIndex(item => 
      item.id === option.id && item.type === 'option' && item.service === serviceType
    );
    
    let updatedItems = [...selectedItems];
    
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + 1,
        total: (updatedItems[existingIndex].quantity + 1) * updatedItems[existingIndex].unitPrice
      };
    } else {
      // Agregar nuevo ítem
      updatedItems.push({
        id: option.id,
        service: serviceType,
        name: option.name,
        description: `Additional - ${option.name}`,
        quantity: 1,
        unit: option.unit,
        unitPrice: option.unitPrice,
        total: option.unitPrice,
        type: 'option'
      });
    }
    
    setSelectedItems(updatedItems);
    recalculateTotal(updatedItems);
  };

  // Eliminar un ítem del estimado
  const removeItem = (index: number) => {
    const updatedItems = [...selectedItems];
    updatedItems.splice(index, 1);
    setSelectedItems(updatedItems);
    recalculateTotal(updatedItems);
  };

  // Actualizar cantidad de un ítem
  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    
    const updatedItems = [...selectedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      total: quantity * updatedItems[index].unitPrice
    };
    
    setSelectedItems(updatedItems);
    recalculateTotal(updatedItems);
  };

  // Calcular el total del estimado
  const recalculateTotal = (items: SelectedItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    
    // Actualizar valores en el formulario
    form.setValue("subtotal", subtotal);
    
    const taxRate = form.getValues("tax") || 0;
    const discountAmount = form.getValues("discount") || 0;
    
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    form.setValue("total", total);
    setTotalAmount(total);
  };

  // Preparar datos para análisis de IA
  const runAiAnalysis = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Cannot run analysis",
        description: "Please add at least one item to analyze",
        variant: "destructive",
      });
      return;
    }

    // Preparar materiales para el análisis
    const materials = selectedItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice
    }));

    // Determinar el tipo de servicio principal
    let serviceType = "general";
    if (selectedServiceTypes.length > 0) {
      serviceType = selectedServiceTypes[0];
    }

    try {
      const result = await analyzeJobCost({
        serviceType,
        materials,
        propertySize: { 
          // Podríamos añadir información del tamaño de la propiedad si la tuviéramos
          squareFeet: 0,
          linearFeet: 0,
          units: 0
        }
      });
      
      setAiAnalysisResult(result);
      setShowAiAnalysis(true);
    } catch (error) {
      console.error("Error analyzing job cost:", error);
      toast({
        title: "Analysis failed",
        description: "Could not perform AI analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Actualizar totales cuando cambian impuestos o descuentos
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "tax" || name === "discount") {
        recalculateTotal(selectedItems);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, selectedItems]);

  // Manejar envío del formulario
  const onSubmit = async (data: EstimateFormValues) => {
    if (selectedItems.length === 0) {
      toast({
        title: "Cannot create estimate",
        description: "Please add at least one item to the estimate",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Crear el número de estimate si no existe
      if (!data.estimateNumber) {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 900) + 100; // Número aleatorio de 3 dígitos
        data.estimateNumber = `EST-${year}${month}-${random}`;
      }
      
      // Preparar datos del estimado
      const estimateData = {
        ...data,
        // Si el proyecto es 0, enviar null para evitar error de clave foránea
        projectId: data.projectId === 0 ? null : data.projectId,
        // Convertir valores numéricos a strings para el API
        subtotal: data.subtotal.toString(),
        tax: data.tax.toString(),
        discount: data.discount.toString(),
        total: data.total.toString(),
        // Convertir items seleccionados al formato esperado por la API
        items: selectedItems.map(item => ({
          service: item.service,
          description: item.description || item.name,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: item.total.toString(),
          notes: `${getServiceLabel(item.service)} - ${item.type === 'material' ? 'Material' : 'Option'}`
        }))
      };
      
      // Crear estimado
      await createEstimateMutation.mutateAsync(estimateData, {
        onSuccess: (newEstimate) => {
          toast({
            title: "Estimate Created",
            description: `Estimate ${newEstimate.estimateNumber} has been successfully created.`,
          });
          
          // Redirigir a la página de detalles del estimado
          setLocation(`/estimates/${newEstimate.id}`);
        },
        onError: (error) => {
          console.error("Error creating estimate:", error);
          toast({
            title: "Error Creating Estimate",
            description: "There was an error creating the estimate. Please try again.",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "There was an error creating the estimate",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Vendor Estimate Form</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/estimates')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Estimates
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="measurement">Measurements</TabsTrigger>
              <TabsTrigger value="summary">Summary & Analysis</TabsTrigger>
            </TabsList>
            
            {/* TAB: Client Information */}
            <TabsContent value="client" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                  <CardDescription>
                    Select a client for this estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client: any) => (
                              <SelectItem 
                                key={client.id} 
                                value={client.id.toString()}
                              >
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
                        <FormLabel>Project (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">No Project</SelectItem>
                            {/* Aquí podríamos cargar los proyectos del cliente cuando selecciona uno */}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Issue Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={
                                    "w-full pl-3 text-left font-normal flex justify-between"
                                  }
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="h-4 w-4" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
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
                          <FormLabel>Expiry Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={
                                    "w-full pl-3 text-left font-normal flex justify-between"
                                  }
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="h-4 w-4" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/estimates')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("services")}
                  >
                    Next: Select Services
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* TAB: Services Selection */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Services Selection</CardTitle>
                  <CardDescription>
                    Select the services you want to include in this estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {SERVICE_TYPES.map((service) => {
                      const isSelected = selectedServiceTypes.includes(service.value);
                      const serviceInfo = SERVICE_INFO[service.value as keyof typeof SERVICE_INFO];
                      
                      return (
                        <Card 
                          key={service.value}
                          className={`
                            transition-all relative overflow-hidden border-2 cursor-pointer
                            ${isSelected ? "border-primary shadow-lg" : "border-transparent hover:border-primary/20"}
                          `}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleServiceType(service.value);
                          }}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 z-10">
                              <Plus className="h-4 w-4" />
                            </div>
                          )}
                          
                          <CardContent className="p-4">
                            <div 
                              className="w-full h-1.5 rounded-full mb-3"
                              style={{ backgroundColor: serviceInfo?.color || "#888" }}
                            ></div>
                            
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-2xl">{serviceInfo?.icon || "🔧"}</div>
                              <h3 className="font-semibold text-lg">{service.label}</h3>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">
                              {serviceInfo?.description || "Service description"}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline" className="bg-primary/10">
                                {serviceInfo?.unitType === 'sq.ft' ? 'Area Based' : 
                                 serviceInfo?.unitType === 'ln.ft' ? 'Length Based' :
                                 serviceInfo?.unitType === 'unit' ? 'Per Unit' : 'Custom'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {selectedServiceTypes.length > 0 && (
                    <div className="space-y-6 mt-6">
                      <Separator />
                      
                      <div className="space-y-6">
                        {selectedServiceTypes.map(serviceType => {
                          const serviceInfo = SERVICE_INFO[serviceType as keyof typeof SERVICE_INFO];
                          const materials = MATERIALS_BY_SERVICE[serviceType as keyof typeof MATERIALS_BY_SERVICE] || [];
                          const options = OPTIONS_BY_SERVICE[serviceType as keyof typeof OPTIONS_BY_SERVICE] || [];
                          
                          return (
                            <div key={serviceType} className="space-y-4">
                              <h3 className="text-lg font-semibold">
                                {getServiceLabel(serviceType)} Materials & Options
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Materials</h4>
                                  <div className="grid grid-cols-1 gap-2">
                                    {materials.map(material => (
                                      <Card key={material.id} className="overflow-hidden">
                                        <CardContent className="p-3">
                                          <div className="flex justify-between items-center">
                                            <div>
                                              <h5 className="font-medium">{material.name}</h5>
                                              <p className="text-sm text-muted-foreground">
                                                ${material.unitPrice.toFixed(2)}/{material.unit}
                                              </p>
                                            </div>
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              type="button" 
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                addMaterial(serviceType, material.id);
                                              }}
                                            >
                                              <Plus className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Additional Options</h4>
                                  <div className="grid grid-cols-1 gap-2">
                                    {options.map(option => (
                                      <Card key={option.id} className="overflow-hidden">
                                        <CardContent className="p-3">
                                          <div className="flex justify-between items-center">
                                            <div>
                                              <h5 className="font-medium">{option.name}</h5>
                                              <p className="text-sm text-muted-foreground">
                                                ${option.unitPrice.toFixed(2)}/{option.unit}
                                              </p>
                                            </div>
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              type="button" 
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                addOption(serviceType, option.id);
                                              }}
                                            >
                                              <Plus className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <Separator />
                            </div>
                          );
                        })}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Selected Items</h3>
                        {selectedItems.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground border rounded-md">
                            No items selected. Add materials or options from above.
                          </div>
                        ) : (
                          <Card>
                            <CardContent className="p-0">
                              <table className="w-full">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="text-left p-3">Item</th>
                                    <th className="text-center p-3">Type</th>
                                    <th className="text-center p-3">Quantity</th>
                                    <th className="text-right p-3">Unit Price</th>
                                    <th className="text-right p-3">Total</th>
                                    <th className="text-center p-3">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedItems.map((item, index) => (
                                    <tr key={`${item.id}-${item.type}-${index}`} className="border-t border-border">
                                      <td className="p-3">
                                        <div>
                                          <div className="font-medium">{item.name}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {getServiceLabel(item.service)}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10">
                                          {item.type === 'material' ? 'Material' : 'Option'}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Button 
                                            size="icon" 
                                            variant="outline" 
                                            className="h-7 w-7" 
                                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                          >
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <span className="w-8 text-center">{item.quantity}</span>
                                          <Button 
                                            size="icon" 
                                            variant="outline" 
                                            className="h-7 w-7" 
                                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </td>
                                      <td className="p-3 text-right">
                                        ${item.unitPrice.toFixed(2)}/{item.unit}
                                      </td>
                                      <td className="p-3 text-right font-medium">
                                        ${item.total.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-center">
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-8 w-8 text-destructive hover:text-destructive/90" 
                                          onClick={() => removeItem(index)}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-muted/20">
                                  <tr>
                                    <td colSpan={4} className="p-3 text-right font-medium">
                                      Subtotal:
                                    </td>
                                    <td className="p-3 text-right font-medium">
                                      ${form.getValues("subtotal").toFixed(2)}
                                    </td>
                                    <td></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("client")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("measurement")}
                    disabled={selectedItems.length === 0}
                  >
                    Next: Measurements
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* TAB: Measurements */}
            <TabsContent value="measurement" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Measurements</CardTitle>
                  <CardDescription>
                    Use our digital tools to measure the property
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Digital Measurement</CardTitle>
                        <CardDescription>
                          Draw and calculate areas, lengths, and distances
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => setIsDigitalMeasurementOpen(true)}
                        >
                          <Ruler className="h-4 w-4 mr-2" />
                          Open Measurement Tool
                        </Button>
                        
                        {measurements.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-sm mb-2">Saved Measurements</h4>
                            <div className="border rounded-md divide-y">
                              {measurements.map((measurement, index) => (
                                <div key={index} className="p-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>{measurement.type}</span>
                                    <span className="font-semibold">{measurement.value} {measurement.unit}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{measurement.note}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">LiDAR Scanner</CardTitle>
                        <CardDescription>
                          Use your device's camera to scan and measure
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => setIsLidarScannerOpen(true)}
                        >
                          <Scan className="h-4 w-4 mr-2" />
                          Open LiDAR Scanner
                        </Button>
                        
                        {scanResults.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-sm mb-2">Scan Results</h4>
                            <div className="border rounded-md divide-y">
                              {scanResults.map((scan, index) => (
                                <div key={index} className="p-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>{scan.type}</span>
                                    <span className="font-semibold">{scan.value} {scan.unit}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{scan.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("services")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("summary")}
                  >
                    Next: Summary & Analysis
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Digital Measurement Dialog */}
              <Dialog open={isDigitalMeasurementOpen} onOpenChange={setIsDigitalMeasurementOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Digital Measurement Tool</DialogTitle>
                    <DialogDescription>
                      Draw to calculate areas, lengths, and distances
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden border rounded-md">
                    <DigitalMeasurement 
                      onSaveMeasurement={(measurement) => {
                        setMeasurements(prev => [...prev, measurement]);
                      }} 
                    />
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* LiDAR Scanner Dialog */}
              <Dialog open={isLidarScannerOpen} onOpenChange={setIsLidarScannerOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>LiDAR Scanner</DialogTitle>
                    <DialogDescription>
                      Use your device's camera to scan and measure
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden border rounded-md">
                    <LiDARScanner 
                      onSaveScan={(scan) => {
                        setScanResults(prev => [...prev, scan]);
                      }} 
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* TAB: Summary & Analysis */}
            <TabsContent value="summary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estimate Summary & Analysis</CardTitle>
                  <CardDescription>
                    Review the estimate details and run AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="tax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
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
                          <FormLabel>Discount Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              value={`$${field.value.toFixed(2)}`}
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="Add any additional notes here..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="Add terms and conditions here..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold">AI Cost Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Our AI can analyze your estimate and provide recommendations on pricing, materials, and labor costs.
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={runAiAnalysis}
                      disabled={isAnalyzing || selectedItems.length === 0}
                      className="w-full md:w-auto"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4 mr-2" />
                          Run AI Analysis
                        </>
                      )}
                    </Button>
                    
                    {showAiAnalysis && aiAnalysisResult && (
                      <Card className="border-primary/20 mt-4">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">AI Analysis Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <AiAnalysisPanel analysisResult={aiAnalysisResult} />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("measurement")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || selectedItems.length === 0}
                    className="min-w-[140px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Estimate
                      </>
                    )}
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