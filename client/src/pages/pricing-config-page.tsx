import { useState } from "react";
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
import { ArrowLeft, PencilIcon, SaveIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Datos predefinidos
const defaultServices = [
  {
    id: 'fence',
    name: 'Instalación de Cerca',
    serviceType: 'fence',
    unitPrice: 57,
    unit: 'ft',
    laborRate: 35,
    laborMethod: 'by_length',
  },
  {
    id: 'roof',
    name: 'Instalación de Techo',
    serviceType: 'roof',
    unitPrice: 8.7,
    unit: 'sqft',
    laborRate: 3.5,
    laborMethod: 'by_area',
  },
  {
    id: 'gutters',
    name: 'Instalación de Canaletas',
    serviceType: 'gutters',
    unitPrice: 12,
    unit: 'ft',
    laborRate: 7,
    laborMethod: 'by_length',
  }
];

const defaultMaterials = [
  {
    id: 'fence-wood',
    name: 'Madera para Cerca',
    category: 'fence',
    unitPrice: 22,
    unit: 'ft',
    supplier: 'Lumber Yard',
  },
  {
    id: 'fence-metal',
    name: 'Postes Metálicos',
    category: 'fence',
    unitPrice: 35,
    unit: 'unit',
    supplier: 'Metal Supply Co.',
  },
  {
    id: 'roofing-shingles',
    name: 'Tejas Asfálticas',
    category: 'roof',
    unitPrice: 5.2,
    unit: 'sqft',
    supplier: 'Roofing Supply',
  }
];

const PricingConfigPage = () => {
  const [services, setServices] = useState(defaultServices);
  const [materials, setMaterials] = useState(defaultMaterials);
  const [editingService, setEditingService] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Para editar un servicio
  const handleEditService = (service) => {
    setEditingService({...service});
  };

  // Para guardar cambios en un servicio
  const handleSaveService = () => {
    if (!editingService) return;

    setIsLoading(true);
    // Simular una petición a la API
    setTimeout(() => {
      const updatedServices = services.map(service => 
        service.id === editingService.id ? editingService : service
      );
      setServices(updatedServices);
      setEditingService(null);
      setIsLoading(false);
      toast({
        title: "Servicio actualizado",
        description: "Los precios se han actualizado correctamente"
      });
    }, 500);
  };

  // Para editar un material
  const handleEditMaterial = (material) => {
    setEditingMaterial({...material});
  };

  // Para guardar cambios en un material
  const handleSaveMaterial = () => {
    if (!editingMaterial) return;

    setIsLoading(true);
    // Simular una petición a la API
    setTimeout(() => {
      const updatedMaterials = materials.map(material => 
        material.id === editingMaterial.id ? editingMaterial : material
      );
      setMaterials(updatedMaterials);
      setEditingMaterial(null);
      setIsLoading(false);
      toast({
        title: "Material actualizado",
        description: "Los precios se han actualizado correctamente"
      });
    }, 500);
  };

  return (
    <div className="container py-8">
      <Helmet>
        <title>Configuración de Precios | ContractorHub</title>
        <meta name="description" content="Configuración centralizada de precios" />
      </Helmet>

      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard">
          <a className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al Dashboard
          </a>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Precios</h1>
        <p className="text-muted-foreground">
          Administra los precios de servicios y materiales para toda tu empresa
        </p>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList>
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="materials">Materiales</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Precios de Servicios</CardTitle>
              <CardDescription>
                Configura las tarifas base para todos tus servicios
              </CardDescription>
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
                  <h3 className="text-lg font-medium mb-4">Editar Servicio</h3>
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
                    <div className="space-y-2">
                      <Label htmlFor="unit-price">Precio por Unidad</Label>
                      <Input 
                        id="unit-price"
                        type="number" 
                        value={editingService.unitPrice}
                        onChange={(e) => setEditingService({...editingService, unitPrice: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unidad</Label>
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
                      <Label htmlFor="labor-rate">Tarifa de Mano de Obra</Label>
                      <Input 
                        id="labor-rate"
                        type="number" 
                        value={editingService.laborRate}
                        onChange={(e) => setEditingService({...editingService, laborRate: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labor-method">Método de Cálculo</Label>
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
                          <SelectItem value="hourly">Por Hora</SelectItem>
                          <SelectItem value="fixed">Fijo</SelectItem>
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
                      disabled={isLoading}
                    >
                      {isLoading ? "Guardando..." : (
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
            <CardHeader>
              <CardTitle>Precios de Materiales</CardTitle>
              <CardDescription>
                Configura los precios de los materiales para todos los proyectos
              </CardDescription>
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
                      <TableCell>${material.unitPrice.toFixed(2)} / {material.unit}</TableCell>
                      <TableCell>{material.supplier || 'N/A'}</TableCell>
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
                  <h3 className="text-lg font-medium mb-4">Editar Material</h3>
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
                        </SelectContent>
                      </Select>
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
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveMaterial}
                      disabled={isLoading}
                    >
                      {isLoading ? "Guardando..." : (
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
  );
};

export default PricingConfigPage;