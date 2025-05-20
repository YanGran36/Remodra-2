import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, PencilIcon, SaveIcon, PlusIcon, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePricing } from "@/hooks/use-pricing";

// Tipos definidos para evitar errores de tipado
interface Service {
  id: string;
  name: string;
  serviceType: string;
  unitPrice: number;
  unit: string;
  laborRate: number;
  laborMethod: string;
}

interface Material {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string;
  supplier: string;
}

// Datos predefinidos con precios en cero
const defaultServices: Service[] = [
  {
    id: 'fence',
    name: 'Instalación de Cerca',
    serviceType: 'fence',
    unitPrice: 0,
    unit: 'ft',
    laborRate: 0,
    laborMethod: 'by_length',
  },
  {
    id: 'roof',
    name: 'Instalación de Techo',
    serviceType: 'roof',
    unitPrice: 0,
    unit: 'sqft',
    laborRate: 0,
    laborMethod: 'by_area',
  },
  {
    id: 'gutters',
    name: 'Instalación de Canaletas',
    serviceType: 'gutters',
    unitPrice: 0,
    unit: 'ft',
    laborRate: 0,
    laborMethod: 'by_length',
  }
];

const defaultMaterials: Material[] = [
  // Materiales para cercas (fence)
  {
    id: 'wood_fence',
    name: 'Wood Fence',
    category: 'fence',
    unitPrice: 0,
    unit: 'ln.ft',
    supplier: 'Lumber Yard',
  },
  {
    id: 'vinyl_fence',
    name: 'Vinyl Fence',
    category: 'fence',
    unitPrice: 0,
    unit: 'ln.ft',
    supplier: 'Modern Materials',
  },
  {
    id: 'chain_link',
    name: 'Chain Link Fence',
    category: 'fence',
    unitPrice: 0,
    unit: 'ln.ft',
    supplier: 'Metal Supply Co.',
  },
  {
    id: 'aluminum_fence',
    name: 'Aluminum Fence',
    category: 'fence',
    unitPrice: 0,
    unit: 'ln.ft',
    supplier: 'Metal Supply Co.',
  },
  {
    id: 'fence_gate',
    name: 'Fence Gate',
    category: 'fence',
    unitPrice: 0,
    unit: 'unit',
    supplier: 'Hardware Supply',
  },
  {
    id: 'post_caps',
    name: 'Post Caps',
    category: 'fence',
    unitPrice: 0,
    unit: 'unit',
    supplier: 'Hardware Supply',
  },
  
  // Materiales para techos (roof)
  {
    id: 'asphalt_shingles',
    name: 'Asphalt Shingles',
    category: 'roof',
    unitPrice: 0,
    unit: 'sq.ft',
    supplier: 'Roofing Supply',
  },
  {
    id: 'metal_roofing',
    name: 'Metal Roofing',
    category: 'roof',
    unitPrice: 0,
    unit: 'sq.ft',
    supplier: 'Metal Supply Co.',
  },
  {
    id: 'tile_roofing',
    name: 'Tile Roofing',
    category: 'roof',
    unitPrice: 0,
    unit: 'sq.ft',
    supplier: 'Premium Materials',
  },
  
  // Materiales para canaletas (gutters)
  {
    id: 'aluminum_gutters',
    name: 'Aluminum Gutters',
    category: 'gutters',
    unitPrice: 0,
    unit: 'ln.ft',
    supplier: 'Gutter Supply',
  },
  {
    id: 'vinyl_gutters',
    name: 'Vinyl Gutters',
    category: 'gutters',
    unitPrice: 0,
    unit: 'ln.ft',
    supplier: 'Modern Materials',
  },
  {
    id: 'downspouts',
    name: 'Downspouts',
    category: 'gutters',
    unitPrice: 0,
    unit: 'unit',
    supplier: 'Gutter Supply',
  }
];

const PricingConfigPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Usar nuestro hook de precios para obtener datos del servidor
  const { 
    services: configuredServices, 
    materials: configuredMaterials, 
    isLoading: isLoadingPrices 
  } = usePricing();
  
  // Inicializamos con los datos predeterminados o configurados, lo que sea más apropiado
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [materials, setMaterials] = useState<Material[]>(defaultMaterials);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cargar datos del servidor cuando estén disponibles o cambien
  useEffect(() => {
    // Cuando los datos son cargados de la API, forzamos la actualización de la interfaz
    if (configuredServices) {
      // Asegurarnos de que configuredServices sea un array
      const servicesArray = Array.isArray(configuredServices) ? configuredServices : [];
      
      if (servicesArray.length > 0) {
        console.log('Actualizando precios de servicios desde la base de datos:', servicesArray);
        // Aseguramos que los precios se muestren correctamente convirtiéndolos a número
        const processedServices = servicesArray.map((service: any) => ({
          ...service,
          unitPrice: typeof service.unitPrice === 'string' ? parseFloat(service.unitPrice) : service.unitPrice,
          laborRate: typeof service.laborRate === 'string' ? parseFloat(service.laborRate) : service.laborRate
        }));
        setServices(processedServices);
      }
    }
    
    if (configuredMaterials) {
      // Asegurarnos de que configuredMaterials sea un array
      const materialsArray = Array.isArray(configuredMaterials) ? configuredMaterials : [];
      
      if (materialsArray.length > 0) {
        console.log('Actualizando precios de materiales desde la base de datos:', materialsArray);
        // Aseguramos que los precios se muestren correctamente convirtiéndolos a número
        const processedMaterials = materialsArray.map((material: any) => ({
          ...material,
          unitPrice: typeof material.unitPrice === 'string' ? parseFloat(material.unitPrice) : material.unitPrice
        }));
        setMaterials(processedMaterials);
      }
    }
  }, [configuredServices, configuredMaterials]);

  // Para editar un servicio
  const handleEditService = (service: Service) => {
    setEditingService({...service});
  };

  // Para añadir un nuevo servicio
  const handleAddService = () => {
    const newService: Service = {
      id: `service-${Date.now()}`,
      name: 'Nuevo Servicio',
      serviceType: 'otro',
      unitPrice: 0,
      unit: 'ft',
      laborRate: 0,
      laborMethod: 'by_length',
    };
    setEditingService(newService);
  };

  // Para guardar cambios en un servicio
  const handleSaveService = async () => {
    if (!editingService) return;

    setIsLoading(true);
    
    try {
      // Guardamos el servicio en memoria local inmediatamente para mostrar los cambios al usuario
      const updatedService = {
        ...editingService,
        updatedAt: new Date()
      };
      
      // Verificar si el servicio ya existe en nuestra lista
      const existingIndex = services.findIndex(s => s.id === editingService.id);
      let updatedServices;
      
      if (existingIndex >= 0) {
        // Si existe, actualizar en la lista
        updatedServices = [...services];
        updatedServices[existingIndex] = updatedService;
      } else {
        // Si no existe, añadir a la lista
        updatedServices = [...services, updatedService];
      }
      
      // Actualizar la lista local
      setServices(updatedServices);
      
      // Convertir precios a formato numérico
      const numericUnitPrice = parseFloat(String(editingService.unitPrice));
      const numericLaborRate = parseFloat(String(editingService.laborRate));
      
      // Intentar guardar en la base de datos
      const response = await fetch(`/api/pricing/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingService,
          contractorId: 1,
          serviceType: editingService.serviceType || editingService.id,
          unitPrice: numericUnitPrice,
          laborRate: numericLaborRate
        })
      });
      
      if (response.ok) {
        // Invalidar cache
        queryClient.invalidateQueries({ queryKey: ['/api/pricing/services'] });
        
        toast({
          title: "Servicio guardado",
          description: "Los precios se han actualizado correctamente"
        });
      } else {
        console.warn("Error al guardar en la base de datos:", await response.text());
        
        toast({
          title: "Advertencia",
          description: "Se guardó localmente pero hubo un problema al guardar en la base de datos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setEditingService(null);
      setIsLoading(false);
    }
  };

  // Para editar un material
  const handleEditMaterial = (material: Material) => {
    setEditingMaterial({...material});
  };

  // Para añadir un nuevo material
  const handleAddMaterial = () => {
    const newMaterial: Material = {
      id: `material-${Date.now()}`,
      name: 'Nuevo Material',
      category: 'fence',
      unitPrice: 0,
      unit: 'ft',
      supplier: '',
    };
    setEditingMaterial(newMaterial);
  };

  // Para guardar cambios en un material
  const handleSaveMaterial = async () => {
    if (!editingMaterial) return;

    setIsLoading(true);
    
    try {
      // Convertir el precio a un número para asegurar formato correcto
      const numericPrice = parseFloat(String(editingMaterial.unitPrice));
      
      console.log(`Guardando material ${editingMaterial.id} con precio: ${numericPrice}`);
      
      // Simplificar los datos para evitar problemas de tipo
      const materialData = {
        name: editingMaterial.name,
        category: editingMaterial.category || 'fence',
        unitPrice: numericPrice,
        unit: editingMaterial.unit || 'ft',
        supplier: editingMaterial.supplier || '',
        code: editingMaterial.id,
        id_string: editingMaterial.id,
        material_id: editingMaterial.id,
        status: 'active',
        description: `${editingMaterial.name} para ${editingMaterial.category}`,
        contractorId: 1
      };
      
      // Llamada directa a la API
      const response = await fetch(`/api/pricing/materials/${editingMaterial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error guardando material:", errorText);
        throw new Error("No se pudo guardar en la base de datos");
      }
      
      const updatedMaterialData = await response.json();
      console.log("Respuesta del servidor:", updatedMaterialData);
      
      // Actualizar la lista local con el material actualizado
      const updatedMaterial = {
        ...editingMaterial,
        unitPrice: numericPrice
      };
      
      const existingIndex = materials.findIndex(m => m.id === editingMaterial.id);
      let updatedMaterialsList;
      
      if (existingIndex >= 0) {
        // Si el material ya existe, lo actualizamos en la lista
        updatedMaterialsList = [...materials];
        updatedMaterialsList[existingIndex] = updatedMaterial;
      } else {
        // Si es nuevo, lo añadimos a la lista
        updatedMaterialsList = [...materials, updatedMaterial];
      }
      
      // Actualizamos la lista de materiales en la UI
      setMaterials(updatedMaterialsList);
      
      // Mensaje de éxito
      toast({
        title: "Material guardado",
        description: "Los precios se han actualizado correctamente"
      });
      
      // Forzar actualización de datos en todas partes
      queryClient.invalidateQueries();
      
      // Recargar directamente los datos más recientes
      try {
        const freshResponse = await fetch('/api/pricing/materials');
        if (freshResponse.ok) {
          const freshData = await freshResponse.json();
          
          if (Array.isArray(freshData) && freshData.length > 0) {
            const processedMaterials = freshData.map((material: any) => ({
              ...material,
              id: material.id_string || material.code || material.material_id,
              unitPrice: typeof material.unitPrice === 'string' ? 
                parseFloat(material.unitPrice) : 
                (typeof material.unit_price === 'string' ? 
                  parseFloat(material.unit_price) : material.unit_price || 0)
            }));
            setMaterials(processedMaterials);
          }
        }
      } catch (refreshError) {
        console.warn("Error al recargar datos:", refreshError);
      }
    } catch (error) {
      console.error('Error al guardar material:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setEditingMaterial(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <Helmet>
        <title>Configuración de Precios | ContractorHub</title>
        <meta name="description" content="Configuración centralizada de precios" />
      </Helmet>

      {/* Barra de navegación superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración de Precios</h1>
          <p className="text-muted-foreground">
            Administra los precios de servicios y materiales para toda tu empresa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList>
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="materials">Materiales</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Precios de Servicios</CardTitle>
                <CardDescription>
                  Configura las tarifas base para todos tus servicios
                </CardDescription>
              </div>
              <Button onClick={handleAddService}>
                <PlusIcon className="mr-2 h-4 w-4" /> Añadir Servicio
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Precio por Unidad</TableHead>
                    <TableHead>Tarifa de Mano de Obra</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.serviceType}</TableCell>
                      <TableCell>${service.unitPrice.toFixed(2)} / {service.unit}</TableCell>
                      <TableCell>${service.laborRate.toFixed(2)} / {service.unit}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditService(service)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {editingService && (
                <div className="mt-6 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">
                    {editingService.id.startsWith('service-') ? 'Nuevo Servicio' : 'Editar Servicio'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="service-name">Nombre del Servicio</Label>
                      <Input 
                        id="service-name"
                        value={editingService.name}
                        onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-type">Tipo de Servicio</Label>
                      <Select
                        value={editingService.serviceType}
                        onValueChange={(value) => setEditingService({...editingService, serviceType: value})}
                      >
                        <SelectTrigger id="service-type">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fence">Cercas</SelectItem>
                          <SelectItem value="roof">Techos</SelectItem>
                          <SelectItem value="gutters">Canaletas</SelectItem>
                          <SelectItem value="windows">Ventanas</SelectItem>
                          <SelectItem value="deck">Deck</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit-price">Precio Base (por unidad)</Label>
                      <Input 
                        id="unit-price"
                        type="number" 
                        value={editingService.unitPrice}
                        onChange={(e) => setEditingService({
                          ...editingService, 
                          unitPrice: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labor-rate">Mano de Obra (por unidad)</Label>
                      <Input 
                        id="labor-rate"
                        type="number"
                        value={editingService.laborRate}
                        onChange={(e) => setEditingService({
                          ...editingService, 
                          laborRate: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unidad de Medida</Label>
                      <Select
                        value={editingService.unit}
                        onValueChange={(value) => setEditingService({...editingService, unit: value})}
                      >
                        <SelectTrigger id="unit">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ft">Pie Lineal (ft)</SelectItem>
                          <SelectItem value="sqft">Pie Cuadrado (sqft)</SelectItem>
                          <SelectItem value="unit">Unidad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labor-method">Método de Cálculo de Mano de Obra</Label>
                      <Select
                        value={editingService.laborMethod}
                        onValueChange={(value) => setEditingService({...editingService, laborMethod: value})}
                      >
                        <SelectTrigger id="labor-method">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="by_length">Por Longitud</SelectItem>
                          <SelectItem value="by_area">Por Área</SelectItem>
                          <SelectItem value="fixed">Monto Fijo</SelectItem>
                          <SelectItem value="hourly">Por Hora</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingService(null)}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveService}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span>Guardando...</span>
                      ) : (
                        <>
                          <SaveIcon className="mr-2 h-4 w-4" /> Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Precios de Materiales</CardTitle>
                <CardDescription>
                  Configura los precios para todos los materiales que utilizas
                </CardDescription>
              </div>
              <Button onClick={handleAddMaterial}>
                <PlusIcon className="mr-2 h-4 w-4" /> Añadir Material
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio por Unidad</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.category}</TableCell>
                      <TableCell>${(typeof material.unitPrice === 'number' ? material.unitPrice.toFixed(2) : parseFloat(String(material.unitPrice)).toFixed(2))} / {material.unit}</TableCell>
                      <TableCell>{material.supplier}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditMaterial(material)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {editingMaterial && (
                <div className="mt-6 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">
                    {editingMaterial.id.startsWith('material-') ? 'Nuevo Material' : 'Editar Material'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="material-name">Nombre del Material</Label>
                      <Input 
                        id="material-name"
                        value={editingMaterial.name}
                        onChange={(e) => setEditingMaterial({...editingMaterial, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-category">Categoría</Label>
                      <Select
                        value={editingMaterial.category}
                        onValueChange={(value) => setEditingMaterial({...editingMaterial, category: value})}
                      >
                        <SelectTrigger id="material-category">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fence">Cerca</SelectItem>
                          <SelectItem value="roof">Techo</SelectItem>
                          <SelectItem value="gutters">Canaletas</SelectItem>
                          <SelectItem value="windows">Ventanas</SelectItem>
                          <SelectItem value="deck">Deck</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-price">Precio por Unidad</Label>
                      <Input 
                        id="material-price"
                        type="number" 
                        value={editingMaterial.unitPrice}
                        onChange={(e) => setEditingMaterial({
                          ...editingMaterial, 
                          unitPrice: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-unit">Unidad</Label>
                      <Select
                        value={editingMaterial.unit}
                        onValueChange={(value) => setEditingMaterial({...editingMaterial, unit: value})}
                      >
                        <SelectTrigger id="material-unit">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ft">Pie Lineal (ft)</SelectItem>
                          <SelectItem value="sqft">Pie Cuadrado (sqft)</SelectItem>
                          <SelectItem value="unit">Unidad</SelectItem>
                          <SelectItem value="box">Caja</SelectItem>
                          <SelectItem value="roll">Rollo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-supplier">Proveedor</Label>
                      <Input 
                        id="material-supplier"
                        value={editingMaterial.supplier || ''}
                        onChange={(e) => setEditingMaterial({...editingMaterial, supplier: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingMaterial(null)}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveMaterial}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span>Guardando...</span>
                      ) : (
                        <>
                          <SaveIcon className="mr-2 h-4 w-4" /> Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PricingConfigPage;