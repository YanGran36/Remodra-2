import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  serviceType: string;
  unit: string;
  laborRate: number;
  laborMethod: string;
}

export default function SimplePricingPage() {
  const [newService, setNewService] = useState({
    name: "",
    serviceType: "",
    unit: "sqft",
    laborRate: 0,
    laborMethod: "by_area"
  });

  // Get services from database using direct endpoint
  const { data: services = [], refetch, isLoading } = useQuery<Service[]>({
    queryKey: ['/api/direct/services'],
  });

  console.log('Services from DIRECT API:', services);
  console.log('Services loading:', isLoading);

  const { toast } = useToast();

  const handleSaveService = async () => {
    try {
      if (!newService.name || !newService.serviceType) {
        toast({
          title: "Missing Information",
          description: "Please fill in service name and type",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/direct/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });

      if (response.ok) {
        // Reset form
        setNewService({
          name: "",
          serviceType: "",
          unit: "sqft",
          laborRate: 0,
          laborMethod: "by_area"
        });
        // Refresh the list
        refetch();
        toast({
          title: "Service Added",
          description: "New service has been saved successfully",
        });
      } else {
        throw new Error('Failed to save service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Could not save service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/direct/services/${serviceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        refetch();
        toast({
          title: "Service Deleted",
          description: "Service has been removed successfully",
        });
      } else {
        throw new Error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Could not delete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Service Labor Rates</h1>
      
      {/* Add New Service Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Service Name</label>
              <Input 
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Roof Installation"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Service Type</label>
              <Select value={newService.serviceType} onValueChange={(value) => setNewService(prev => ({ ...prev, serviceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roof">Roof</SelectItem>
                  <SelectItem value="fence">Fence</SelectItem>
                  <SelectItem value="gutters">Gutters</SelectItem>
                  <SelectItem value="windows">Windows</SelectItem>
                  <SelectItem value="siding">Siding</SelectItem>
                  <SelectItem value="deck">Deck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Unit</label>
              <Select value={newService.unit} onValueChange={(value) => setNewService(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Square Feet</SelectItem>
                  <SelectItem value="ft">Linear Feet</SelectItem>
                  <SelectItem value="unit">Per Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Labor Rate ($)</label>
              <Input 
                type="number"
                value={newService.laborRate}
                onChange={(e) => setNewService(prev => ({ ...prev, laborRate: Number(e.target.value) }))}
                placeholder="15.00"
              />
            </div>
          </div>
          <Button onClick={handleSaveService} className="w-full">
            Save Service
          </Button>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Services ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Labor Rate</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    Loading services...
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No services configured yet. Add your first service above.
                    <br />
                    <small>API Response: {JSON.stringify(services)}</small>
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service, index) => (
                  <TableRow key={service.id || service.serviceType || index}>
                    <TableCell className="font-medium">{service.name || 'Unknown Service'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.serviceType || service.id}</Badge>
                    </TableCell>
                    <TableCell>${service.laborRate || 0}/{service.unit || 'unit'}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteService(service.serviceType || service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}