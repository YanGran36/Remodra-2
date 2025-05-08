import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, Edit, MoreVertical, Plus, Trash2, Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { usePriceConfigurations } from "@/hooks/use-price-configurations";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

const serviceTypes = [
  { id: "fence", name: "Cercas" },
  { id: "deck", name: "Cubiertas" },
  { id: "roof", name: "Techos" },
  { id: "siding", name: "Revestimientos" },
  { id: "windows", name: "Ventanas" },
  { id: "gutters", name: "Canalones" }
];

// Validación del formulario
const priceConfigurationSchema = z.object({
  serviceType: z.string().min(1, "El tipo de servicio es obligatorio"),
  configName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  baseLinearFootPrice: z.string().optional(),
  baseSquareFootPrice: z.string().optional(),
  baseUnitPrice: z.string().optional(),
  laborHourlyRate: z.string().min(1, "La tarifa por hora es obligatoria"),
  materialCostMultiplier: z.string().min(1, "El multiplicador de costo de materiales es obligatorio"),
  overheadPercentage: z.string().min(1, "El porcentaje de gastos generales es obligatorio"),
  profitMarginPercentage: z.string().min(1, "El margen de ganancia es obligatorio"),
  notes: z.string().optional(),
  isDefault: z.boolean().default(false)
});

export default function PriceConfigurationsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("fence");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentConfiguration, setCurrentConfiguration] = useState<any | null>(null);

  const {
    priceConfigurations,
    serviceConfigurations,
    defaultConfiguration,
    selectedService,
    isLoadingConfigurations,
    isLoadingServiceConfigurations,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    setDefaultConfiguration,
    isCreating,
    isUpdating,
    isDeleting,
    isSettingDefault,
    setSelectedService
  } = usePriceConfigurations();

  // Formulario para crear/editar configuración
  const form = useForm<z.infer<typeof priceConfigurationSchema>>({
    resolver: zodResolver(priceConfigurationSchema),
    defaultValues: {
      serviceType: activeTab,
      configName: "",
      baseLinearFootPrice: "",
      baseSquareFootPrice: "",
      baseUnitPrice: "",
      laborHourlyRate: "25",
      materialCostMultiplier: "1.10",
      overheadPercentage: "15",
      profitMarginPercentage: "25",
      notes: "",
      isDefault: false
    }
  });

  // Cambiar de pestaña y cargar configuraciones
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedService(value);
  };

  // Abrir diálogo para crear nueva configuración
  const handleCreateClick = () => {
    form.reset({
      serviceType: activeTab,
      configName: "",
      baseLinearFootPrice: "",
      baseSquareFootPrice: "",
      baseUnitPrice: "",
      laborHourlyRate: "25",
      materialCostMultiplier: "1.10",
      overheadPercentage: "15",
      profitMarginPercentage: "25",
      notes: "",
      isDefault: false
    });
    setIsCreateDialogOpen(true);
  };

  // Abrir diálogo para editar configuración
  const handleEditClick = (config: any) => {
    setCurrentConfiguration(config);
    form.reset({
      serviceType: config.serviceType,
      configName: config.configName,
      baseLinearFootPrice: config.baseLinearFootPrice ? String(config.baseLinearFootPrice) : "",
      baseSquareFootPrice: config.baseSquareFootPrice ? String(config.baseSquareFootPrice) : "",
      baseUnitPrice: config.baseUnitPrice ? String(config.baseUnitPrice) : "",
      laborHourlyRate: String(config.laborHourlyRate),
      materialCostMultiplier: String(config.materialCostMultiplier),
      overheadPercentage: String(config.overheadPercentage),
      profitMarginPercentage: String(config.profitMarginPercentage),
      notes: config.notes || "",
      isDefault: !!config.isDefault
    });
    setIsEditDialogOpen(true);
  };

  // Abrir diálogo para eliminar configuración
  const handleDeleteClick = (config: any) => {
    setCurrentConfiguration(config);
    setIsDeleteDialogOpen(true);
  };

  // Establecer configuración como predeterminada
  const handleSetDefaultClick = (config: any) => {
    setDefaultConfiguration(config.id);
  };

  // Enviar formulario de creación
  const onCreateSubmit = (data: z.infer<typeof priceConfigurationSchema>) => {
    // Convertir strings a números donde sea necesario
    const formattedData = {
      ...data,
      baseLinearFootPrice: data.baseLinearFootPrice ? data.baseLinearFootPrice : undefined,
      baseSquareFootPrice: data.baseSquareFootPrice ? data.baseSquareFootPrice : undefined,
      baseUnitPrice: data.baseUnitPrice ? data.baseUnitPrice : undefined,
      laborHourlyRate: data.laborHourlyRate,
      materialCostMultiplier: data.materialCostMultiplier,
      overheadPercentage: data.overheadPercentage,
      profitMarginPercentage: data.profitMarginPercentage
    };

    createConfiguration(formattedData);
    setIsCreateDialogOpen(false);
  };

  // Enviar formulario de edición
  const onEditSubmit = (data: z.infer<typeof priceConfigurationSchema>) => {
    if (!currentConfiguration) return;
    
    // Convertir strings a números donde sea necesario
    const formattedData = {
      ...data,
      baseLinearFootPrice: data.baseLinearFootPrice ? data.baseLinearFootPrice : undefined,
      baseSquareFootPrice: data.baseSquareFootPrice ? data.baseSquareFootPrice : undefined,
      baseUnitPrice: data.baseUnitPrice ? data.baseUnitPrice : undefined,
      laborHourlyRate: data.laborHourlyRate,
      materialCostMultiplier: data.materialCostMultiplier,
      overheadPercentage: data.overheadPercentage,
      profitMarginPercentage: data.profitMarginPercentage
    };

    updateConfiguration({
      id: currentConfiguration.id,
      data: formattedData
    });
    setIsEditDialogOpen(false);
  };

  // Confirmar eliminación
  const handleConfirmDelete = () => {
    if (!currentConfiguration) return;
    deleteConfiguration(currentConfiguration.id);
    setIsDeleteDialogOpen(false);
  };

  // Renderizar tarjeta de configuración
  const renderConfigurationCard = (config: any) => (
    <Card key={config.id} className="mb-4">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="flex items-center">
            {config.configName}
            {config.isDefault && (
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1" />
                Predeterminado
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="mt-1">
            {serviceTypes.find(s => s.id === config.serviceType)?.name}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditClick(config)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            {!config.isDefault && (
              <DropdownMenuItem onClick={() => handleSetDefaultClick(config)}>
                <Star className="mr-2 h-4 w-4" /> Establecer como predeterminado
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => handleDeleteClick(config)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold">Costos básicos</p>
            <ul className="mt-1 text-sm">
              {config.baseLinearFootPrice && (
                <li>Pie lineal: ${parseFloat(config.baseLinearFootPrice).toFixed(2)}</li>
              )}
              {config.baseSquareFootPrice && (
                <li>Pie cuadrado: ${parseFloat(config.baseSquareFootPrice).toFixed(2)}</li>
              )}
              {config.baseUnitPrice && (
                <li>Por unidad: ${parseFloat(config.baseUnitPrice).toFixed(2)}</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Márgenes y tarifas</p>
            <ul className="mt-1 text-sm">
              <li>Mano de obra: ${parseFloat(config.laborHourlyRate).toFixed(2)}/h</li>
              <li>Mult. materiales: {parseFloat(config.materialCostMultiplier).toFixed(2)}x</li>
              <li>Gastos gen.: {parseFloat(config.overheadPercentage).toFixed(0)}%</li>
              <li>Margen: {parseFloat(config.profitMarginPercentage).toFixed(0)}%</li>
            </ul>
          </div>
        </div>
        {config.notes && (
          <div className="mt-4">
            <p className="text-sm font-semibold">Notas</p>
            <p className="text-sm mt-1">{config.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-6xl py-6">
      <h1 className="text-3xl font-bold mb-6">Configuraciones de precios</h1>
      
      <Tabs defaultValue="fence" value={activeTab} onValueChange={handleTabChange}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            {serviceTypes.map((service) => (
              <TabsTrigger key={service.id} value={service.id}>
                {service.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" /> Nueva configuración
          </Button>
        </div>
        
        {serviceTypes.map((service) => (
          <TabsContent key={service.id} value={service.id} className="mt-0">
            {isLoadingServiceConfigurations ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : serviceConfigurations.length > 0 ? (
              <div>
                {serviceConfigurations.map(renderConfigurationCard)}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No hay configuraciones</AlertTitle>
                <AlertDescription>
                  No se encontraron configuraciones de precios para este servicio. 
                  Puedes crear una nueva configuración con el botón "Nueva configuración".
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Diálogo Crear Configuración */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear nueva configuración de precios</DialogTitle>
            <DialogDescription>
              Define una nueva estructura de precios para tus servicios.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de servicio</FormLabel>
                      <Select 
                        defaultValue={field.value} 
                        onValueChange={field.onChange}
                        disabled={true}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar servicio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceTypes.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
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
                  name="configName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la configuración</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Precios estándar, Premium, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="baseLinearFootPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio por pie lineal ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Deja en blanco si no aplica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="baseSquareFootPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio por pie cuadrado ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Deja en blanco si no aplica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="baseUnitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio por unidad ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Deja en blanco si no aplica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="laborHourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarifa por hora de mano de obra ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="materialCostMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Multiplicador de costo de materiales</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>
                        1.10 = 10% sobre el costo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="overheadPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porcentaje de gastos generales (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="profitMarginPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porcentaje de margen de ganancia (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Input placeholder="Notas adicionales sobre esta configuración" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Establecer como configuración predeterminada</FormLabel>
                      <FormDescription>
                        Esta configuración se usará por defecto para este tipo de servicio.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo Editar Configuración */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar configuración de precios</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de esta estructura de precios.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de servicio</FormLabel>
                      <Select 
                        defaultValue={field.value} 
                        onValueChange={field.onChange}
                        disabled={true}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar servicio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceTypes.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
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
                  name="configName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la configuración</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="baseLinearFootPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio por pie lineal ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Deja en blanco si no aplica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="baseSquareFootPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio por pie cuadrado ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Deja en blanco si no aplica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="baseUnitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio por unidad ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Deja en blanco si no aplica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="laborHourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarifa por hora de mano de obra ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="materialCostMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Multiplicador de costo de materiales</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>
                        1.10 = 10% sobre el costo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="overheadPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porcentaje de gastos generales (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="profitMarginPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porcentaje de margen de ganancia (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Input placeholder="Notas adicionales sobre esta configuración" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={currentConfiguration?.isDefault}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Establecer como configuración predeterminada</FormLabel>
                      <FormDescription>
                        {currentConfiguration?.isDefault 
                          ? "Esta configuración ya es la predeterminada para este servicio."
                          : "Esta configuración se usará por defecto para este tipo de servicio."}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo Eliminar Configuración */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar configuración</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la configuración "{currentConfiguration?.configName}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}