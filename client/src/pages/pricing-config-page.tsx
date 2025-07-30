import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { ArrowLeft, PencilIcon, SaveIcon, PlusIcon, Trash2, DollarSign, Settings, Home } from "lucide-react";
import { useToast } from '../hooks/use-toast';
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '../lib/queryClient';
import { usePricing, type ServicePrice, type MaterialPrice } from '../hooks/use-pricing';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';

// Extendemos la interfaz ServicePrice para añadir campos adicionales que necesitamos en la UI
interface Service extends ServicePrice {
  originalServiceType?: string; // Para mantener referencia al tipo original durante la edición
}

// Extendemos la interfaz MaterialPrice para añadir campos adicionales que necesitamos
interface Material extends MaterialPrice {
  // Campos adicionales si los necesitáramos
}

const PricingConfigPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Usar nuestro hook de precios para obtener datos del servidor
  const { 
    services: configuredServices, 
    materials: configuredMaterials, 
    isLoading: isLoadingPrices 
  } = usePricing();
  
  // Estados para edición y carga
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Convertimos directamente los datos de la API para mostrarlos
  const services: Service[] = Array.isArray(configuredServices) 
    ? configuredServices.map((service: any) => ({
        id: String(service.id || service.serviceType),
        name: service.name || 'Unnamed Service',
        serviceType: service.serviceType || '',
        unit: service.unit || 'ft',
        laborRate: typeof service.laborRate === 'string' ? parseFloat(service.laborRate) : (service.laborRate || 0),
        laborMethod: service.laborCalculationMethod || service.laborMethod || 'by_length'
      }))
    : [];

  const materials: Material[] = Array.isArray(configuredMaterials) 
    ? configuredMaterials.map((material: any) => ({
        id: String(material.id || material.material_id || material.code),
        name: material.name || 'Unnamed Material',
        category: material.category || 'General',
        unitPrice: typeof material.unitPrice === 'string' ? parseFloat(material.unitPrice) : (material.unitPrice || 0),
        unit: material.unit || 'ft',
        supplier: material.supplier || 'No especificado'
      }))
    : [];

  // Para editar un servicio
  const handleEditService = (service: Service) => {
    const serviceToEdit = {
      ...service
    };
    (serviceToEdit as any).originalServiceType = service.serviceType;
    setEditingService(serviceToEdit);
  };

  // Add a new service
  const handleAddService = () => {
    const timestamp = Date.now();
    const serviceId = `service-${timestamp}`;
    const newService: Service = {
      id: serviceId,
      name: 'New Service',
      serviceType: '',
      unit: 'ft',
      laborRate: 0,
      laborMethod: 'by_length',
    };
    setEditingService(newService);
  };

  // Save service changes
  const handleSaveService = async () => {
    if (!editingService) return;

    setIsLoading(true);
    
    try {
      const numericLaborRate = parseFloat(String(editingService.laborRate));
      
      const serviceData = {
        id: editingService.id,
        name: editingService.name,
        serviceType: editingService.serviceType || editingService.id,
        laborRate: numericLaborRate,
        unit: editingService.unit || 'ft',
        laborMethod: editingService.laborMethod || 'by_length',
        contractorId: 1,
        originalServiceType: editingService.originalServiceType || editingService.serviceType || editingService.id
      };
      
      if (editingService.originalServiceType && editingService.originalServiceType !== editingService.serviceType) {
        // If service type changed, delete old and create new
        const deleteResponse = await fetch(`/api/direct/services/${editingService.originalServiceType}`, {
          method: 'DELETE'
        });
        
        if (!deleteResponse.ok) {
          throw new Error('Failed to delete old service');
        }
      }
      
      const response = await fetch('/api/direct/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceData.name,
          serviceType: serviceData.serviceType,
          unit: serviceData.unit,
          laborRate: serviceData.laborRate,
          laborMethod: serviceData.laborMethod
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save service');
      }
      
      await queryClient.invalidateQueries({ queryKey: ['/api/direct/services'] });
      
      toast({
        title: "Service saved",
        description: "Labor rates have been updated successfully"
      });
      
      setEditingService(null);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error saving",
        description: "Changes could not be saved. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a service
  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/direct/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Could not delete service');
      }
      
      await queryClient.invalidateQueries({ queryKey: ['/api/direct/services'] });
      
      toast({
        title: "Service deleted",
        description: "Service has been removed successfully"
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error deleting",
        description: error instanceof Error ? error.message : "Service could not be deleted. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Material functions (simplified for now)
  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
  };

  const handleAddMaterial = () => {
    const newMaterial: Material = {
      id: `material-${Date.now()}`,
      name: 'New Material',
      category: 'General',
      unitPrice: 0,
      unit: 'ft',
      supplier: ''
    };
    setEditingMaterial(newMaterial);
  };

  const handleSaveMaterial = async () => {
    // Simplified material save - you can expand this later
    toast({
      title: "Material saved",
      description: "Material has been updated successfully"
    });
    setEditingMaterial(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />
      <div className="lg:pl-72 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
          <Helmet>
            <title>Pricing Configuration | Remodra</title>
            <meta name="description" content="Manage service and material pricing" />
          </Helmet>

          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-center mb-6">
              <img 
                src="/remodra-logo.png" 
                alt="Remodra Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center justify-center">
                  <DollarSign className="h-6 w-6 mr-2" />
                  Pricing Configuration
                </h1>
                <p className="text-muted-foreground text-center">Manage your service rates and material pricing</p>
              </div>
              <Link href="/settings">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Materials
              </TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Service Labor Rates</CardTitle>
                      <CardDescription>
                        Configure labor rates for your services. These rates will be used in estimates and invoices.
                      </CardDescription>
                    </div>
                    <Button onClick={handleAddService} className="flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Add Service
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingPrices ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading services...</p>
                    </div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No services configured yet.</p>
                      <Button onClick={handleAddService} className="mt-4">
                        Add Your First Service
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Services Table */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Labor Rate</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {services.map((service) => (
                            <TableRow key={service.id}>
                              <TableCell className="font-medium">{service.name}</TableCell>
                              <TableCell>{service.serviceType}</TableCell>
                              <TableCell>{service.unit}</TableCell>
                              <TableCell>${service.laborRate}</TableCell>
                              <TableCell>{service.laborMethod}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditService(service)}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteService(service.serviceType)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edit Service Form */}
              {editingService && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {editingService.id.includes('service-') ? 'Add New Service' : 'Edit Service'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="serviceName">Service Name</Label>
                        <Input
                          id="serviceName"
                          value={editingService.name}
                          onChange={(e) => setEditingService(prev => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="e.g., Fence Installation"
                        />
                      </div>
                      <div>
                        <Label htmlFor="serviceType">Service Type</Label>
                        <Input
                          id="serviceType"
                          value={editingService.serviceType}
                          onChange={(e) => setEditingService(prev => prev ? { ...prev, serviceType: e.target.value } : null)}
                          placeholder="e.g., fence"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Select
                          value={editingService.unit}
                          onValueChange={(value) => setEditingService(prev => prev ? { ...prev, unit: value } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ft">Linear Feet</SelectItem>
                            <SelectItem value="sqft">Square Feet</SelectItem>
                            <SelectItem value="unit">Unit</SelectItem>
                            <SelectItem value="hour">Hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="laborRate">Labor Rate ($)</Label>
                        <Input
                          id="laborRate"
                          type="number"
                          step="0.01"
                          value={editingService.laborRate}
                          onChange={(e) => setEditingService(prev => prev ? { ...prev, laborRate: parseFloat(e.target.value) || 0 } : null)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="laborMethod">Calculation Method</Label>
                        <Select
                          value={editingService.laborMethod}
                          onValueChange={(value) => setEditingService(prev => prev ? { ...prev, laborMethod: value } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="by_length">By Length</SelectItem>
                            <SelectItem value="by_area">By Area</SelectItem>
                            <SelectItem value="fixed">Fixed Price</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setEditingService(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveService}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        <SaveIcon className="h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Save Service'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Material Pricing</CardTitle>
                      <CardDescription>
                        Configure material costs and markups. This feature is coming soon.
                      </CardDescription>
                    </div>
                    <Button onClick={handleAddMaterial} disabled className="flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Add Material
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Material Pricing Coming Soon</h3>
                    <p className="text-gray-600 mb-4">
                      We're working on a comprehensive material pricing system that will allow you to:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-6">
                      <li>• Set up material costs and markups</li>
                      <li>• Track supplier information</li>
                      <li>• Manage inventory levels</li>
                      <li>• Generate material lists automatically</li>
                    </ul>
                    <p className="text-sm text-gray-500">
                      For now, you can manage your service labor rates above.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PricingConfigPage;