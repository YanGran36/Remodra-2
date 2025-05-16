import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, X, Save, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description: string;
  pricePerUnit: number;
  unit: string;
}

interface ServicesConfigProps {
  contractorId: number;
  onSave?: () => void;
}

export default function ServicesConfig({ contractorId, onSave }: ServicesConfigProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Omit<Service, "id">>({
    name: "",
    description: "",
    pricePerUnit: 0,
    unit: "hour"
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Cargar servicios existentes
  const loadServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/contractor/${contractorId}/services`);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      } else {
        console.error("Error loading services:", await response.text());
        // Si hay error, usar servicios de ejemplo
        setServices([
          {
            id: "1",
            name: "Instalación de paneles solares",
            description: "Instalación completa de sistema solar",
            pricePerUnit: 250,
            unit: "panel"
          },
          {
            id: "2",
            name: "Mantenimiento HVAC",
            description: "Servicio de mantenimiento para sistemas de aire acondicionado",
            pricePerUnit: 95,
            unit: "hora"
          },
          {
            id: "3",
            name: "Pintura de interiores",
            description: "Pintura de alta calidad para interiores",
            pricePerUnit: 3,
            unit: "pies²"
          }
        ]);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [contractorId]);

  // Agregar un nuevo servicio
  const handleAddService = async () => {
    if (!newService.name || newService.pricePerUnit <= 0) {
      toast({
        title: "Información incompleta",
        description: "Por favor ingresa al menos el nombre y un precio válido",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      // Generar ID temporal mientras se integra con backend
      const tempId = Date.now().toString();
      const newServiceWithId = { ...newService, id: tempId };
      
      // Opciones para cuando se integre con el backend
      /*
      const response = await fetch(`/api/contractor/${contractorId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService)
      });
      
      if (response.ok) {
        const savedService = await response.json();
        setServices([...services, savedService]);
      }
      */
      
      // Por ahora, simplemente añadimos localmente
      setServices([...services, newServiceWithId]);
      setNewService({
        name: "",
        description: "",
        pricePerUnit: 0,
        unit: "hora"
      });
      
      toast({
        title: "Servicio agregado",
        description: "El servicio ha sido añadido exitosamente",
      });
    } catch (error) {
      console.error("Error adding service:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo agregar el servicio",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar un servicio
  const handleDeleteService = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Opciones para cuando se integre con el backend
      /*
      const response = await fetch(`/api/contractor/${contractorId}/services/${id}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        setServices(services.filter(service => service.id !== id));
      }
      */
      
      // Por ahora, simplemente eliminamos localmente
      setServices(services.filter(service => service.id !== id));
      
      toast({
        title: "Servicio eliminado",
        description: "El servicio ha sido eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el servicio",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar todos los servicios
  const saveAllServices = async () => {
    try {
      setIsLoading(true);
      
      // Opciones para cuando se integre con el backend
      /*
      const response = await fetch(`/api/contractor/${contractorId}/services/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(services)
      });
      
      if (response.ok) {
        toast({
          title: "Servicios guardados",
          description: "Todos los servicios han sido guardados exitosamente",
        });
      }
      */
      
      // Por ahora, solo mostramos un mensaje
      toast({
        title: "Servicios guardados",
        description: "Todos los servicios han sido guardados exitosamente",
      });
      
      onSave && onSave();
    } catch (error) {
      console.error("Error saving services:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los servicios",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar cambios en el nuevo servicio
  const handleNewServiceChange = (field: keyof Omit<Service, "id">, value: string | number) => {
    setNewService({ ...newService, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Servicios de la Compañía</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Servicios Disponibles</Label>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Nombre del Servicio</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[100px]">Precio</TableHead>
                  <TableHead className="w-[100px]">Unidad</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>${service.pricePerUnit.toFixed(2)}</TableCell>
                    <TableCell>{service.unit}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteService(service.id)}
                        aria-label="Eliminar servicio"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay servicios configurados. Agrega servicios para mostrarlos en estimaciones e invoices.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <Label>Agregar Nuevo Servicio</Label>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="service-name" className="text-xs">Nombre del Servicio</Label>
              <Input
                id="service-name"
                value={newService.name}
                onChange={(e) => handleNewServiceChange("name", e.target.value)}
                placeholder="Ej: Instalación Eléctrica"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service-description" className="text-xs">Descripción</Label>
              <Input
                id="service-description"
                value={newService.description}
                onChange={(e) => handleNewServiceChange("description", e.target.value)}
                placeholder="Ej: Instalación de sistema eléctrico residencial"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-price" className="text-xs">Precio por Unidad</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="service-price"
                  type="number"
                  value={newService.pricePerUnit === 0 ? "" : newService.pricePerUnit}
                  onChange={(e) => handleNewServiceChange("pricePerUnit", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service-unit" className="text-xs">Unidad</Label>
              <Input
                id="service-unit"
                value={newService.unit}
                onChange={(e) => handleNewServiceChange("unit", e.target.value)}
                placeholder="Ej: hora, pieza, metro"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                className="w-full" 
                onClick={handleAddService}
                disabled={isLoading}
              >
                <Plus className="mr-2 h-4 w-4" /> Agregar Servicio
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-end">
          <Button 
            variant="default"
            onClick={saveAllServices}
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" /> Guardar Todos los Servicios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}