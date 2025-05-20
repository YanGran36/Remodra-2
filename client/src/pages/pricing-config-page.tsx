import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { PencilIcon, PlusIcon, SaveIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/layouts/admin-layout";
import SkeletonTable from "@/components/ui/skeleton-table";

// Interfaces
interface ServicePricing {
  id: number | string;
  name: string;
  serviceType: string;
  description: string;
  unitPrice: number;
  unit: string;
  laborRate?: number;
  laborCalculationMethod?: 'by_area' | 'by_length' | 'hourly' | 'fixed';
  status: 'active' | 'inactive';
}

interface MaterialPricing {
  id: number | string;
  name: string;
  description?: string;
  category: string;
  unitPrice: number;
  unit: string;
  supplier?: string;
  status: 'active' | 'inactive';
}

// Servicios predefinidos
const defaultServices: ServicePricing[] = [
  {
    id: 'fence',
    name: 'Instalación de Cerca',
    serviceType: 'fence',
    description: 'Instalación de cercas residenciales',
    unitPrice: 57,
    unit: 'ft',
    laborRate: 35,
    laborCalculationMethod: 'by_length',
    status: 'active'
  },
  {
    id: 'roof',
    name: 'Instalación de Techo',
    serviceType: 'roof',
    description: 'Instalación de techos residenciales',
    unitPrice: 8.7,
    unit: 'sqft',
    laborRate: 3.5,
    laborCalculationMethod: 'by_area',
    status: 'active'
  },
  {
    id: 'gutters',
    name: 'Instalación de Canaletas',
    serviceType: 'gutters',
    description: 'Instalación de canaletas',
    unitPrice: 12,
    unit: 'ft',
    laborRate: 7,
    laborCalculationMethod: 'by_length',
    status: 'active'
  },
  {
    id: 'windows',
    name: 'Instalación de Ventanas',
    serviceType: 'windows',
    description: 'Instalación de ventanas',
    unitPrice: 45,
    unit: 'unit',
    laborRate: 85,
    laborCalculationMethod: 'fixed',
    status: 'active'
  },
  {
    id: 'deck',
    name: 'Instalación de Deck',
    serviceType: 'deck',
    description: 'Instalación de cubiertas exteriores',
    unitPrice: 35,
    unit: 'sqft',
    laborRate: 15,
    laborCalculationMethod: 'by_area',
    status: 'active'
  }
];

// Materiales predefinidos
const defaultMaterials: MaterialPricing[] = [
  {
    id: 'fence-wood',
    name: 'Madera para Cerca',
    description: 'Madera tratada para construcción de cercas',
    category: 'fence',
    unitPrice: 22,
    unit: 'ft',
    supplier: 'Lumber Yard',
    status: 'active'
  },
  {
    id: 'fence-metal',
    name: 'Postes Metálicos',
    description: 'Postes metálicos para soporte de cercas',
    category: 'fence',
    unitPrice: 35,
    unit: 'unit',
    supplier: 'Metal Supply Co.',
    status: 'active'
  },
  {
    id: 'roofing-shingles',
    name: 'Tejas Asfálticas',
    description: 'Tejas asfálticas estándar',
    category: 'roof',
    unitPrice: 5.2,
    unit: 'sqft',
    supplier: 'Roofing Supply',
    status: 'active'
  },
  {
    id: 'gutters-aluminum',
    name: 'Canaletas de Aluminio',
    description: 'Canaletas de aluminio de 5 pulgadas',
    category: 'gutters',
    unitPrice: 5,
    unit: 'ft',
    supplier: 'Gutter Supply',
    status: 'active'
  }
];

const PricingConfigPage = () => {
  // Estado para los servicios
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [materials, setMaterials] = useState<MaterialPricing[]>([]);
  const [editingService, setEditingService] = useState<ServicePricing | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<MaterialPricing | null>(null);
  const [isNewService, setIsNewService] = useState(false);
  const [isNewMaterial, setIsNewMaterial] = useState(false);

  // Consultas para obtener precios
  const { 
    data: servicePrices, 
    isLoading: servicesLoading 
  } = useQuery({
    queryKey: ['/api/pricing/services'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/pricing/services');
        if (!response.ok) throw new Error('Error al cargar servicios');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error loading services:', error);
        // Retornar los datos predeterminados si la API falla
        return defaultServices;
      }
    }
  });

  const { 
    data: materialPrices, 
    isLoading: materialsLoading 
  } = useQuery({
    queryKey: ['/api/pricing/materials'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/pricing/materials');
        if (!response.ok) throw new Error('Error al cargar materiales');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error loading materials:', error);
        // Retornar los datos predeterminados si la API falla
        return defaultMaterials;
      }
    }
  });

  // Mutations para guardar cambios
  const updateServiceMutation = useMutation({
    mutationFn: async (service: ServicePricing) => {
      const method = isNewService ? 'POST' : 'PUT';
      const url = isNewService 
        ? '/api/pricing/services' 
        : `/api/pricing/services/${service.id}`;
      
      const response = await apiRequest(method, url, service);
      if (!response.ok) throw new Error('Error al guardar servicio');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing/services'] });
      toast({
        title: "Servicio guardado",
        description: "Los precios se han actualizado correctamente",
      });
      setEditingService(null);
      setIsNewService(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateMaterialMutation = useMutation({
    mutationFn: async (material: MaterialPricing) => {
      const method = isNewMaterial ? 'POST' : 'PUT';
      const url = isNewMaterial 
        ? '/api/pricing/materials' 
        : `/api/pricing/materials/${material.id}`;
      
      const response = await apiRequest(method, url, material);
      if (!response.ok) throw new Error('Error al guardar material');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing/materials'] });
      toast({
        title: "Material guardado",
        description: "Los precios se han actualizado correctamente",
      });
      setEditingMaterial(null);
      setIsNewMaterial(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Actualizar estado local cuando los datos se cargan
  useEffect(() => {
    if (servicePrices) {
      setServices(servicePrices);
    }
  }, [servicePrices]);

  useEffect(() => {
    if (materialPrices) {
      setMaterials(materialPrices);
    }
  }, [materialPrices]);

  // Manejadores
  const handleEditService = (service: ServicePricing) => {
    setEditingService(service);
    setIsNewService(false);
  };

  const handleEditMaterial = (material: MaterialPricing) => {
    setEditingMaterial(material);
    setIsNewMaterial(false);
  };

  const handleAddService = () => {
    const newService: ServicePricing = {
      id: `new-${Date.now()}`,
      name: '',
      serviceType: '',
      description: '',
      unitPrice: 0,
      unit: 'ft',
      laborRate: 0,
      laborCalculationMethod: 'by_length',
      status: 'active'
    };
    setEditingService(newService);
    setIsNewService(true);
  };

  const handleAddMaterial = () => {
    const newMaterial: MaterialPricing = {
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      category: 'fence',
      unitPrice: 0,
      unit: 'ft',
      supplier: '',
      status: 'active'
    };
    setEditingMaterial(newMaterial);
    setIsNewMaterial(true);
  };

  const handleSaveService = () => {
    if (!editingService) return;
    updateServiceMutation.mutate(editingService);
  };

  const handleSaveMaterial = () => {
    if (!editingMaterial) return;
    updateMaterialMutation.mutate(editingMaterial);
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Configuración de Precios | ContractorHub</title>
        <meta name="description" content="Configura los precios de servicios y materiales para tu empresa" />
      </Helmet>
      
      <div className="container pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración de Precios</h1>
            <p className="text-muted-foreground">
              Administra los precios de servicios y materiales para toda tu empresa
            </p>
          </div>
        </div>

        <Tabs defaultValue="services" className="space-y-6">
          <TabsList>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="materials">Materiales</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Precios de Servicios</CardTitle>
                    <CardDescription>
                      Configura las tarifas base para todos tus servicios
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddService}>
                    <PlusIcon className="h-4 w-4 mr-1" /> Añadir Servicio
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <SkeletonTable columns={6} rows={5} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Precio por Unidad</TableHead>
                        <TableHead>Tarifa de Mano de Obra</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>{service.serviceType}</TableCell>
                          <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                          <TableCell>${service.unitPrice.toFixed(2)} / {service.unit}</TableCell>
                          <TableCell>
                            {service.laborRate ? `$${service.laborRate.toFixed(2)} / ${service.laborCalculationMethod === 'fixed' ? 'unidad' : 'hora'}` : 'N/A'}
                          </TableCell>
                          <TableCell>
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
                )}
                
                {editingService && (
                  <div className="mt-6 border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">
                      {isNewService ? 'Añadir Nuevo Servicio' : 'Editar Servicio'}
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
                        <Input 
                          id="service-type"
                          value={editingService.serviceType}
                          onChange={(e) => setEditingService({...editingService, serviceType: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="service-description">Descripción</Label>
                        <Input 
                          id="service-description"
                          value={editingService.description}
                          onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service-price">Precio por Unidad</Label>
                        <Input 
                          id="service-price"
                          type="number"
                          value={editingService.unitPrice}
                          onChange={(e) => setEditingService({...editingService, unitPrice: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service-unit">Unidad</Label>
                        <Select 
                          value={editingService.unit}
                          onValueChange={(value) => setEditingService({...editingService, unit: value})}
                        >
                          <SelectTrigger id="service-unit">
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ft">Pie Lineal (ft)</SelectItem>
                            <SelectItem value="sqft">Pie Cuadrado (sqft)</SelectItem>
                            <SelectItem value="unit">Unidad</SelectItem>
                            <SelectItem value="hour">Hora</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labor-rate">Tarifa de Mano de Obra</Label>
                        <Input 
                          id="labor-rate"
                          type="number"
                          value={editingService.laborRate || 0}
                          onChange={(e) => setEditingService({...editingService, laborRate: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labor-method">Método de Cálculo</Label>
                        <Select 
                          value={editingService.laborCalculationMethod || 'by_length'}
                          onValueChange={(value: any) => setEditingService({...editingService, laborCalculationMethod: value})}
                        >
                          <SelectTrigger id="labor-method">
                            <SelectValue placeholder="Seleccionar método" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="by_length">Por Longitud</SelectItem>
                            <SelectItem value="by_area">Por Área</SelectItem>
                            <SelectItem value="hourly">Por Hora</SelectItem>
                            <SelectItem value="fixed">Fijo por Unidad</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingService(null)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSaveService}
                        disabled={updateServiceMutation.isPending}
                      >
                        {updateServiceMutation.isPending ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Guardando...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <SaveIcon className="h-4 w-4 mr-1" /> Guardar
                          </span>
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
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Precios de Materiales</CardTitle>
                    <CardDescription>
                      Configura los precios de los materiales para todos los proyectos
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddMaterial}>
                    <PlusIcon className="h-4 w-4 mr-1" /> Añadir Material
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {materialsLoading ? (
                  <SkeletonTable columns={6} rows={5} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Precio por Unidad</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>{material.category}</TableCell>
                          <TableCell className="max-w-xs truncate">{material.description}</TableCell>
                          <TableCell>${material.unitPrice.toFixed(2)} / {material.unit}</TableCell>
                          <TableCell>{material.supplier || 'N/A'}</TableCell>
                          <TableCell>
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
                )}
                
                {editingMaterial && (
                  <div className="mt-6 border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">
                      {isNewMaterial ? 'Añadir Nuevo Material' : 'Editar Material'}
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
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fence">Cerca</SelectItem>
                            <SelectItem value="roof">Techo</SelectItem>
                            <SelectItem value="gutters">Canaletas</SelectItem>
                            <SelectItem value="windows">Ventanas</SelectItem>
                            <SelectItem value="deck">Deck</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="material-description">Descripción</Label>
                        <Input 
                          id="material-description"
                          value={editingMaterial.description || ''}
                          onChange={(e) => setEditingMaterial({...editingMaterial, description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="material-price">Precio por Unidad</Label>
                        <Input 
                          id="material-price"
                          type="number"
                          value={editingMaterial.unitPrice}
                          onChange={(e) => setEditingMaterial({...editingMaterial, unitPrice: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="material-unit">Unidad</Label>
                        <Select 
                          value={editingMaterial.unit}
                          onValueChange={(value) => setEditingMaterial({...editingMaterial, unit: value})}
                        >
                          <SelectTrigger id="material-unit">
                            <SelectValue placeholder="Seleccionar unidad" />
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
                      <div className="space-y-2">
                        <Label htmlFor="material-status">Estado</Label>
                        <Select 
                          value={editingMaterial.status}
                          onValueChange={(value: 'active' | 'inactive') => setEditingMaterial({...editingMaterial, status: value})}
                        >
                          <SelectTrigger id="material-status">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingMaterial(null)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSaveMaterial}
                        disabled={updateMaterialMutation.isPending}
                      >
                        {updateMaterialMutation.isPending ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Guardando...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <SaveIcon className="h-4 w-4 mr-1" /> Guardar
                          </span>
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
    </AdminLayout>
  );
};

export default PricingConfigPage;