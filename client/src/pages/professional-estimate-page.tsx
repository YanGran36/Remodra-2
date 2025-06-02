import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEstimates } from "@/hooks/use-estimates";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Calculator,
  Ruler,
  FileText,
  User,
  Building2,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import FenceMeasurementTool from "@/components/measurement/fence-measurement-tool";

interface ServiceItem {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  laborHours: number;
  measurements?: {
    area?: number;
    linearFeet?: number;
    squareFeet?: number;
    height?: number;
    width?: number;
    length?: number;
  };
  total: number;
}

interface EstimateData {
  clientId: number | null;
  projectId: number | null;
  services: ServiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string;
  terms: string;
}

export default function ProfessionalEstimatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { createEstimateMutation } = useEstimates();

  // Form state
  const [estimateData, setEstimateData] = useState<EstimateData>({
    clientId: null,
    projectId: null,
    services: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: "",
    terms: "Payment due within 30 days. Work to begin upon acceptance of estimate."
  });

  const [currentService, setCurrentService] = useState<Partial<ServiceItem>>({
    serviceType: "",
    serviceName: "",
    description: "",
    quantity: 1,
    unit: "unit",
    unitPrice: 0,
    laborHours: 0,
    measurements: {}
  });

  const [activeTab, setActiveTab] = useState("details");
  const [showMeasurements, setShowMeasurements] = useState(false);

  // Fetch data
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/clients"],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/projects"],
  });

  const { data: availableServices = [] } = useQuery<any[]>({
    queryKey: ["/api/direct/services"],
  });

  // Service types for measurement tools
  const serviceTypes = [
    { value: "fence", label: "Fence", unit: "ft", hasMeasurements: true },
    { value: "deck", label: "Deck", unit: "sqft", hasMeasurements: false },
    { value: "roof", label: "Roofing", unit: "sqft", hasMeasurements: false },
    { value: "windows", label: "Windows", unit: "unit", hasMeasurements: false },
    { value: "gutters", label: "Gutters & Downspouts", unit: "ft", hasMeasurements: false },
    { value: "siding", label: "Siding", unit: "sqft", hasMeasurements: false },
    { value: "flooring", label: "Flooring", unit: "sqft", hasMeasurements: false },
    { value: "painting", label: "Painting", unit: "sqft", hasMeasurements: false },
    { value: "electrical", label: "Electrical", unit: "unit", hasMeasurements: false },
    { value: "plumbing", label: "Plumbing", unit: "unit", hasMeasurements: false },
    { value: "concrete", label: "Concrete", unit: "sqft", hasMeasurements: false },
    { value: "landscaping", label: "Landscaping", unit: "sqft", hasMeasurements: false },
    { value: "hvac", label: "HVAC", unit: "unit", hasMeasurements: false },
    { value: "other", label: "Other Services", unit: "unit", hasMeasurements: false }
  ];

  // Calculate totals
  useEffect(() => {
    const subtotal = estimateData.services.reduce((sum, service) => sum + service.total, 0);
    const taxAmount = subtotal * (estimateData.tax / 100);
    const discountAmount = subtotal * (estimateData.discount / 100);
    const total = subtotal + taxAmount - discountAmount;

    setEstimateData(prev => ({
      ...prev,
      subtotal,
      total
    }));
  }, [estimateData.services, estimateData.tax, estimateData.discount]);

  const handleServiceTypeChange = (serviceType: string) => {
    const selectedType = serviceTypes.find(type => type.value === serviceType);
    const matchingService = (availableServices as any[]).find((s: any) => s.serviceType === serviceType);

    setCurrentService(prev => ({
      ...prev,
      serviceType,
      serviceName: selectedType?.label || "",
      unit: selectedType?.unit || "unit",
      unitPrice: matchingService ? parseFloat(matchingService.laborRate) : 0,
      measurements: {}
    }));

    setShowMeasurements(selectedType?.hasMeasurements || false);
  };

  const handleMeasurementsChange = (measurements: any[]) => {
    if (measurements.length > 0) {
      const totalLinearFeet = measurements.reduce((sum, m) => sum + m.totalLength, 0);
      setCurrentService(prev => ({
        ...prev,
        quantity: totalLinearFeet,
        measurements: {
          linearFeet: totalLinearFeet
        }
      }));
    }
  };

  const handleDimensionChange = (field: string, value: number) => {
    setCurrentService(prev => {
      const measurements = { ...prev.measurements, [field]: value };
      let quantity = 1;

      // Calculate quantity based on service type
      if (prev.serviceType === "deck" || prev.serviceType === "roof" || prev.serviceType === "siding" || 
          prev.serviceType === "flooring" || prev.serviceType === "painting" || prev.serviceType === "concrete" || 
          prev.serviceType === "landscaping") {
        // Area calculation
        const length = measurements.length || 0;
        const width = measurements.width || 0;
        quantity = length * width;
        measurements.squareFeet = quantity;
      } else if (prev.serviceType === "gutters") {
        // Linear feet
        quantity = measurements.length || 0;
        measurements.linearFeet = quantity;
      }

      return {
        ...prev,
        quantity,
        measurements
      };
    });
  };

  const addService = () => {
    if (!currentService.serviceType || !currentService.serviceName) {
      toast({
        title: "Missing Information",
        description: "Please select a service type and provide a name.",
        variant: "destructive",
      });
      return;
    }

    const total = (currentService.quantity || 1) * (currentService.unitPrice || 0);
    
    const newService: ServiceItem = {
      id: Date.now().toString(),
      serviceType: currentService.serviceType || "",
      serviceName: currentService.serviceName || "",
      description: currentService.description || "",
      quantity: currentService.quantity || 1,
      unit: currentService.unit || "unit",
      unitPrice: currentService.unitPrice || 0,
      laborHours: currentService.laborHours || 0,
      measurements: currentService.measurements || {},
      total
    };

    setEstimateData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));

    // Reset current service
    setCurrentService({
      serviceType: "",
      serviceName: "",
      description: "",
      quantity: 1,
      unit: "unit",
      unitPrice: 0,
      laborHours: 0,
      measurements: {}
    });
    setShowMeasurements(false);
  };

  const removeService = (serviceId: string) => {
    setEstimateData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId)
    }));
  };

  const generateEstimateNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EST-${year}${month}${day}-${random}`;
  };

  const saveEstimate = async () => {
    if (!estimateData.clientId) {
      toast({
        title: "Missing Client",
        description: "Please select a client for this estimate.",
        variant: "destructive",
      });
      return;
    }

    if (estimateData.services.length === 0) {
      toast({
        title: "No Services",
        description: "Please add at least one service to the estimate.",
        variant: "destructive",
      });
      return;
    }

    const estimatePayload = {
      clientId: estimateData.clientId,
      projectId: estimateData.projectId,
      estimateNumber: generateEstimateNumber(),
      subtotal: estimateData.subtotal,
      tax: estimateData.tax,
      discount: estimateData.discount,
      total: estimateData.total,
      notes: estimateData.notes,
      terms: estimateData.terms,
      items: estimateData.services.map(service => ({
        description: service.description || service.serviceName,
        quantity: service.quantity.toString(),
        unitPrice: service.unitPrice.toString(),
        amount: service.total.toString(),
        notes: service.measurements ? JSON.stringify(service.measurements) : null
      }))
    };

    try {
      await createEstimateMutation.mutateAsync(estimatePayload);
      toast({
        title: "Estimate Created",
        description: "Your professional estimate has been created successfully.",
      });
      setLocation("/estimates");
    } catch (error) {
      console.error("Error creating estimate:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(amount);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/estimates")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Estimates
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Professional Estimate</h1>
                <p className="text-gray-600">Create a comprehensive estimate with measurements and calculations</p>
              </div>
            </div>
            <Button onClick={saveEstimate} disabled={createEstimateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createEstimateMutation.isPending ? "Saving..." : "Save Estimate"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Client & Project
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger value="measurements" className="flex items-center">
                <Ruler className="h-4 w-4 mr-2" />
                Measurements
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Summary
              </TabsTrigger>
            </TabsList>

            {/* Client & Project Details */}
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="client">Select Client *</Label>
                      <Select 
                        value={estimateData.clientId?.toString() || ""} 
                        onValueChange={(value) => setEstimateData(prev => ({ ...prev, clientId: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {(clients as any[]).map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.firstName} {client.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Association</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="project">Associated Project (Optional)</Label>
                      <Select 
                        value={estimateData.projectId?.toString() || ""} 
                        onValueChange={(value) => setEstimateData(prev => ({ 
                          ...prev, 
                          projectId: value ? parseInt(value) : null 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Project</SelectItem>
                          {(projects as any[]).map((project: any) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Estimate Terms & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      value={estimateData.terms}
                      onChange={(e) => setEstimateData(prev => ({ ...prev, terms: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={estimateData.notes}
                      onChange={(e) => setEstimateData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      placeholder="Any additional information for the client..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serviceType">Service Type *</Label>
                      <Select value={currentService.serviceType} onValueChange={handleServiceTypeChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="serviceName">Service Name *</Label>
                      <Input
                        id="serviceName"
                        value={currentService.serviceName}
                        onChange={(e) => setCurrentService(prev => ({ ...prev, serviceName: e.target.value }))}
                        placeholder="e.g., Wood Fence Installation"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={currentService.description}
                        onChange={(e) => setCurrentService(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        placeholder="Detailed description of the service..."
                      />
                    </div>

                    {!showMeasurements && (
                      <>
                        {/* Simple dimension inputs for non-fence services */}
                        {currentService.serviceType && currentService.serviceType !== "fence" && (
                          <div className="md:col-span-2">
                            <Label>Measurements & Dimensions</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                              {(currentService.serviceType === "deck" || currentService.serviceType === "roof" || 
                                currentService.serviceType === "siding" || currentService.serviceType === "flooring" || 
                                currentService.serviceType === "painting" || currentService.serviceType === "concrete" || 
                                currentService.serviceType === "landscaping") && (
                                <>
                                  <div>
                                    <Label className="text-xs">Length (ft)</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={currentService.measurements?.length || ""}
                                      onChange={(e) => handleDimensionChange("length", parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Width (ft)</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={currentService.measurements?.width || ""}
                                      onChange={(e) => handleDimensionChange("width", parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </>
                              )}
                              {currentService.serviceType === "gutters" && (
                                <div>
                                  <Label className="text-xs">Length (ft)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={currentService.measurements?.length || ""}
                                    onChange={(e) => handleDimensionChange("length", parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              )}
                              {(currentService.serviceType === "windows" || currentService.serviceType === "electrical" || 
                                currentService.serviceType === "plumbing" || currentService.serviceType === "hvac" || 
                                currentService.serviceType === "other") && (
                                <div>
                                  <Label className="text-xs">Quantity</Label>
                                  <Input
                                    type="number"
                                    value={currentService.quantity || 1}
                                    onChange={(e) => setCurrentService(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                  />
                                </div>
                              )}
                            </div>
                            {currentService.measurements?.squareFeet && (
                              <div className="mt-2 text-sm text-gray-600">
                                Total Area: {currentService.measurements.squareFeet.toFixed(1)} sq ft
                              </div>
                            )}
                            {currentService.measurements?.linearFeet && (
                              <div className="mt-2 text-sm text-gray-600">
                                Total Length: {currentService.measurements.linearFeet.toFixed(1)} ft
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            step="0.1"
                            value={currentService.quantity}
                            onChange={(e) => setCurrentService(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="unitPrice">Unit Price ($)</Label>
                          <Input
                            id="unitPrice"
                            type="number"
                            step="0.01"
                            value={currentService.unitPrice}
                            onChange={(e) => setCurrentService(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label htmlFor="laborHours">Labor Hours</Label>
                      <Input
                        id="laborHours"
                        type="number"
                        step="0.5"
                        value={currentService.laborHours}
                        onChange={(e) => setCurrentService(prev => ({ ...prev, laborHours: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>

                    {!showMeasurements && (
                      <div>
                        <Label>Total: {formatCurrency((currentService.quantity || 1) * (currentService.unitPrice || 0))}</Label>
                      </div>
                    )}
                  </div>

                  {showMeasurements && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-blue-800 font-medium">Use Advanced Measurement Tool</Label>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Interactive Fence Measurements
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-700 mb-4">
                        Click the "Measurements" tab to use the visual measurement tool for fence planning.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab("measurements")}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Ruler className="h-4 w-4 mr-2" />
                        Open Measurement Tool
                      </Button>
                    </div>
                  )}

                  <Button onClick={addService} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service to Estimate
                  </Button>
                </CardContent>
              </Card>

              {/* Services List */}
              {estimateData.services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Added Services ({estimateData.services.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {estimateData.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{service.serviceType}</Badge>
                              <h4 className="font-medium">{service.serviceName}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                            <div className="text-sm text-gray-500">
                              {service.quantity} {service.unit} × {formatCurrency(service.unitPrice)} = {formatCurrency(service.total)}
                            </div>
                            {service.measurements && Object.keys(service.measurements).length > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                Measurements: {JSON.stringify(service.measurements)}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeService(service.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Measurements */}
            <TabsContent value="measurements" className="space-y-6">
              {showMeasurements && currentService.serviceType === "fence" ? (
                <FenceMeasurementTool
                  onMeasurementsChange={handleMeasurementsChange}
                  serviceUnit="ft"
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Ruler className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Measurement Tool Available</h3>
                    <p className="text-gray-600 mb-4">
                      Advanced measurement tools are available for fence services. 
                      For other services, use the dimension inputs in the Services tab.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("services")}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Return to Services
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Summary */}
            <TabsContent value="summary" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Estimate Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {estimateData.services.map((service) => (
                          <div key={service.id} className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{service.serviceName}</h4>
                              <p className="text-sm text-gray-600">{service.description}</p>
                              <p className="text-sm text-gray-500">
                                {service.quantity} {service.unit} × {formatCurrency(service.unitPrice)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(service.total)}</p>
                            </div>
                          </div>
                        ))}
                        {estimateData.services.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No services added yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(estimateData.subtotal)}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tax">Tax (%)</Label>
                        <Input
                          id="tax"
                          type="number"
                          step="0.1"
                          value={estimateData.tax}
                          onChange={(e) => setEstimateData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discount">Discount (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          step="0.1"
                          value={estimateData.discount}
                          onChange={(e) => setEstimateData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>

                      <Separator />
                      
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(estimateData.total)}</span>
                      </div>

                      <Button onClick={saveEstimate} className="w-full" disabled={createEstimateMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {createEstimateMutation.isPending ? "Creating..." : "Create Estimate"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}