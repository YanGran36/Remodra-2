import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from '../hooks/use-toast';
import { useEstimates } from '../hooks/use-estimates';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Calculator,
  User,
  Building2,
  DollarSign,
  Ruler,
  Sparkles,
  Loader2
} from "lucide-react";
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { apiRequest } from '../lib/queryClient';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

interface ServiceItem {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
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

  // Get clientId from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('clientId');

  // Form state
  const [estimateData, setEstimateData] = useState<EstimateData>({
    clientId: clientIdFromUrl ? parseInt(clientIdFromUrl) : null,
    projectId: null,
    services: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: "",
    terms: "Payment due within 30 days. Work to begin upon acceptance of estimate."
  });

  const [currentService, setCurrentService] = useState({
    serviceType: "",
    serviceName: "",
    description: "",
    quantity: 1,
    unit: "each",
    unitPrice: 0,
    measurements: {
      length: 0,
      width: 0,
      height: 0,
      pitch: 0,
      count: 1
    },
    appointmentNotes: ""
  });

  const [activeTab, setActiveTab] = useState("client");
  const [showFenceTool, setShowFenceTool] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Fetch data
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/clients"],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/projects"],
  });

  const { data: availableServices = [] } = useQuery<any[]>({
    queryKey: ["/api/pricing/services"],
  }); // AI Description Generation Mutation
  const generateDescriptionMutation = useMutation({
    mutationFn: async (data: {
      serviceType: string;
      appointmentNotes: string;
      measurements: any;
      clientName?: string;
    }) => {
      const response = await apiRequest('/api/ai/generate-job-description', data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentService(prev => ({
        ...prev,
        description: data.professionalDescription
      }));
      toast({
        title: "Description Generated",
        description: "AI has created a professional description for your service.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate description. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Professional service types with industry standards
  const serviceTypes = [
    { value: "fence", label: "Fence Installation", unit: "linear ft", type: "linear" },
    { value: "roof", label: "Roofing", unit: "squares", type: "roofing" },
    { value: "siding", label: "Siding", unit: "sq ft", type: "area" },
    { value: "deck", label: "Deck Construction", unit: "sq ft", type: "area" },
    { value: "gutters", label: "Gutters & Downspouts", unit: "linear ft", type: "linear" },
    { value: "windows", label: "Window Installation", unit: "each", type: "count" },
    { value: "flooring", label: "Flooring Installation", unit: "sq ft", type: "area" },
    { value: "painting", label: "Painting Services", unit: "sq ft", type: "area" },
    { value: "electrical", label: "Electrical Work", unit: "each", type: "count" },
    { value: "plumbing", label: "Plumbing Services", unit: "each", type: "count" },
    { value: "concrete", label: "Concrete Work", unit: "sq ft", type: "area" },
    { value: "landscaping", label: "Landscaping", unit: "sq ft", type: "area" },
    { value: "hvac", label: "HVAC Services", unit: "each", type: "count" },
    { value: "other", label: "Other Services", unit: "each", type: "count" }
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

  // Show toast when client is pre-selected from URL
  useEffect(() => {
    if (clientIdFromUrl && clients.length > 0) {
      const selectedClient = clients.find((client: any) => client.id.toString() === clientIdFromUrl);
      if (selectedClient) {
        toast({
          title: "Client Selected",
          description: `Creating estimate for ${selectedClient.firstName} ${selectedClient.lastName}`,
        });
      }
    }
  }, [clientIdFromUrl, clients, toast]);

  const handleServiceTypeChange = (serviceType: string) => {
    const selectedType = serviceTypes.find(type => type.value === serviceType);
    const matchingService = (availableServices as any[]).find((s: any) => s.serviceType === serviceType);

    setCurrentService(prev => ({
      ...prev,
      serviceType,
      serviceName: selectedType?.label || "",
      unit: selectedType?.unit || "each",
      unitPrice: matchingService ? parseFloat(matchingService.laborRate) : 0,
      measurements: {
        length: 0,
        width: 0,
        height: 0,
        pitch: 0,
        count: 1
      }
    }));

    setShowFenceTool(serviceType === "fence");
    calculateQuantity(serviceType, currentService.measurements);
  };

  const calculateQuantity = (serviceType: string, measurements: any) => {
    const serviceConfig = serviceTypes.find(s => s.value === serviceType);
    let quantity = 1;

    switch (serviceConfig?.type) {
      case "linear":
        quantity = measurements.length || 0;
        break;
      case "area":
        quantity = (measurements.length || 0) * (measurements.width || measurements.height || 0);
        break;
      case "roofing":
        // Roofing: Calculate squares (100 sq ft units)
        const sqft = (measurements.length || 0) * (measurements.width || 0);
        quantity = Math.ceil(sqft / 100);
        break;
      case "count":
        quantity = measurements.count || 1;
        break;
    }

    setCurrentService(prev => ({ ...prev, quantity: Math.max(quantity, 0.1) }));
  };

  const handleMeasurementChange = (field: string, value: number) => {
    const newMeasurements = { ...currentService.measurements, [field]: value };
    setCurrentService(prev => ({ ...prev, measurements: newMeasurements }));
    calculateQuantity(currentService.serviceType, newMeasurements);
  };

  const handleFenceMeasurements = (measurements: any[]) => {
    if (measurements.length > 0) {
      const totalLinearFeet = measurements.reduce((sum, m) => sum + m.totalLength, 0);
      setCurrentService(prev => ({ ...prev, quantity: totalLinearFeet }));
    }
  };

  const generateAIDescription = async () => {
    if (!currentService.serviceType || !currentService.appointmentNotes.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a service type and add appointment notes before generating description.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDescription(true);
    
    const selectedClient = clients.find((client: any) => client.id === estimateData.clientId);
    
    try {
      await generateDescriptionMutation.mutateAsync({
        serviceType: currentService.serviceType,
        appointmentNotes: currentService.appointmentNotes,
        measurements: currentService.measurements,
        clientName: selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : undefined
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const addService = () => {
    if (!currentService.serviceType || !currentService.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a service type and ensure description is generated before adding service.",
        variant: "destructive",
      });
      return;
    }

    const newService: ServiceItem = {
      id: Date.now().toString(),
      serviceType: currentService.serviceType,
      serviceName: currentService.serviceName,
      description: currentService.description,
      quantity: currentService.quantity,
      unit: currentService.unit,
      unitPrice: currentService.unitPrice,
      total: currentService.quantity * currentService.unitPrice
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
      unit: "each",
      unitPrice: 0,
      measurements: {
        length: 0,
        width: 0,
        height: 0,
        pitch: 0,
        count: 1
      },
      appointmentNotes: ""
    });

    setShowFenceTool(false);
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
    if (!estimateData.clientId || estimateData.services.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a client and add at least one service.",
        variant: "destructive",
      });
      return;
    }

    const estimateNumber = generateEstimateNumber();
    
    const estimatePayload = {
      estimateNumber,
      clientId: estimateData.clientId,
      projectId: estimateData.projectId,
      items: estimateData.services.map(service => ({
        serviceType: service.serviceType,
        serviceName: service.serviceName,
        description: service.description,
        quantity: service.quantity,
        unit: service.unit,
        unitPrice: service.unitPrice,
        total: service.total
      })),
      subtotal: estimateData.subtotal,
      tax: estimateData.tax,
      discount: estimateData.discount,
      total: estimateData.total,
      notes: estimateData.notes,
      terms: estimateData.terms,
      status: "pending"
    };

    try {
      await createEstimateMutation.mutateAsync(estimatePayload);
      toast({
        title: "Estimate Created",
        description: `Estimate ${estimateNumber} has been created successfully.`,
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

  const renderMeasurementInputs = () => {
    const serviceConfig = serviceTypes.find(s => s.value === currentService.serviceType);
    
    if (!serviceConfig) return null;

    switch (serviceConfig.type) {
      case "linear":
        return (
          <div>
            <Label>Length (ft)</Label>
            <Input
              className="input-blue-border"
              type="number"
              step="0.1"
              value={currentService.measurements.length || ""}
              onChange={(e) => handleMeasurementChange("length", parseFloat(e.target.value) || 0)}
              placeholder="Enter length in feet"
            />
          </div>
        );

      case "area":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Length (ft)</Label>
              <Input
                className="input-blue-border"
                type="number"
                step="0.1"
                value={currentService.measurements.length || ""}
                onChange={(e) => handleMeasurementChange("length", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>{serviceConfig.value === "painting" || serviceConfig.value === "siding" ? "Height (ft)" : "Width (ft)"}</Label>
              <Input
                className="input-blue-border"
                type="number"
                step="0.1"
                value={serviceConfig.value === "painting" || serviceConfig.value === "siding" ? 
                  currentService.measurements.height || "" : currentService.measurements.width || ""}
                onChange={(e) => {
                  const field = serviceConfig.value === "painting" || serviceConfig.value === "siding" ? "height" : "width";
                  handleMeasurementChange(field, parseFloat(e.target.value) || 0);
                }}
              />
            </div>
          </div>
        );

      case "roofing":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Length (ft)</Label>
              <Input
                className="input-blue-border"
                type="number"
                step="0.1"
                value={currentService.measurements.length || ""}
                onChange={(e) => handleMeasurementChange("length", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Width (ft)</Label>
              <Input
                className="input-blue-border"
                type="number"
                step="0.1"
                value={currentService.measurements.width || ""}
                onChange={(e) => handleMeasurementChange("width", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Pitch (optional)</Label>
              <Input
                className="input-blue-border"
                type="number"
                step="0.1"
                value={currentService.measurements.pitch || ""}
                onChange={(e) => handleMeasurementChange("pitch", parseFloat(e.target.value) || 0)}
                placeholder="e.g., 6/12"
              />
            </div>
          </div>
        );

      case "count":
        return (
          <div>
            <Label>Quantity</Label>
            <Input
              className="input-blue-border"
              type="number"
              value={currentService.measurements.count || 1}
              onChange={(e) => handleMeasurementChange("count", parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <main className="p-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6">
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
                    <p className="text-gray-600">Create professional estimates with AI-powered descriptions</p>
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="client" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Client
                  </TabsTrigger>
                  <TabsTrigger value="services" className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Services & AI Description
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Summary
                  </TabsTrigger>
                </TabsList>

                {/* Client Selection */}
                <TabsContent value="client" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="client">Client *</Label>
                        <Select 
                          value={estimateData.clientId?.toString() || ""} 
                          onValueChange={(value) => setEstimateData(prev => ({ ...prev, clientId: parseInt(value) }))}
                        >
                          <SelectTrigger className="input-blue-border">
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

                      <div>
                        <Label htmlFor="project">Associated Project (Optional)</Label>
                        <Select 
                          value={estimateData.projectId?.toString() || "no_project"} 
                          onValueChange={(value) => setEstimateData(prev => ({ 
                            ...prev, 
                            projectId: value && value !== "no_project" ? parseInt(value) : null 
                          }))}
                        >
                          <SelectTrigger className="input-blue-border">
                            <SelectValue placeholder="Choose a project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no_project">No Project</SelectItem>
                            {(projects as any[]).map((project: any) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {estimateData.clientId && (
                        <div className="mt-4">
                          <Button onClick={() => setActiveTab("services")}>
                            Continue to Services
                            <Building2 className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Services & AI Description */}
                <TabsContent value="services" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Service & AI Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label>Service Type *</Label>
                          <Select 
                            value={currentService.serviceType} 
                            onValueChange={handleServiceTypeChange}
                          >
                            <SelectTrigger className="input-blue-border">
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
                          <Label>Unit Price ($)</Label>
                          <Input
                            className="input-blue-border"
                            type="number"
                            step="0.01"
                            value={currentService.unitPrice}
                            onChange={(e) => setCurrentService(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                            placeholder="Enter unit price"
                          />
                        </div>
                      </div>

                      {/* Measurements */}
                      {currentService.serviceType && (
                        <div className="md:col-span-2">
                          <Label>Measurements</Label>
                          <div className="mt-2 space-y-4">
                            {renderMeasurementInputs()}
                            {currentService.quantity > 0 && (
                              <div className="text-sm text-blue-600">
                                Calculated: {currentService.quantity.toFixed(2)} {currentService.unit}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Appointment Notes for AI */}
                      <div>
                        <Label>Appointment Notes *</Label>
                        <Textarea
                          className="input-blue-border"
                          value={currentService.appointmentNotes}
                          onChange={(e) => setCurrentService(prev => ({ ...prev, appointmentNotes: e.target.value }))}
                          placeholder="Describe what was discussed during the appointment, measurements taken, materials discussed, etc. This will be used by AI to generate a professional description."
                          rows={4}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Be detailed about the work scope, materials, and any special requirements discussed.
                        </p>
                      </div>

                      {/* AI Description Generation */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Professional Description</Label>
                          <Button
                            onClick={generateAIDescription}
                            disabled={!currentService.serviceType || !currentService.appointmentNotes.trim() || isGeneratingDescription}
                            size="sm"
                            variant="outline"
                          >
                            {isGeneratingDescription ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate with AI
                              </>
                            )}
                          </Button>
                        </div>
                        
                        <Textarea
                          className="input-blue-border min-h-[100px]"
                          value={currentService.description}
                          onChange={(e) => setCurrentService(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="AI will generate a professional description based on your appointment notes..."
                          rows={4}
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-lg font-semibold">
                          Total: {formatCurrency(currentService.quantity * currentService.unitPrice)}
                        </div>
                        <Button 
                          onClick={addService} 
                          disabled={!currentService.serviceType || !currentService.description.trim()}
                          className="flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Service
                        </Button>
                      </div>
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
                            <div key={service.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">{service.serviceType}</Badge>
                                    <h4 className="font-medium text-lg">{service.serviceName}</h4>
                                  </div>
                                  <p className="text-gray-700">{service.description}</p>
                                  <div className="text-sm text-gray-500">
                                    {service.quantity.toFixed(2)} {service.unit} × {formatCurrency(service.unitPrice)} = {formatCurrency(service.total)}
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeService(service.id)}
                                  className="text-red-600 hover:text-red-700 ml-4"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {estimateData.services.length > 0 && (
                          <div className="mt-6">
                            <Button onClick={() => setActiveTab("summary")} className="w-full">
                              Continue to Summary
                              <DollarSign className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        )}
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
                          <div className="space-y-6">
                            {estimateData.services.map((service) => (
                              <div key={service.id} className="border-b pb-4 last:border-b-0">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-lg">{service.serviceName}</h4>
                                  <div className="text-right">
                                    <p className="font-bold text-lg">{formatCurrency(service.total)}</p>
                                  </div>
                                </div>
                                <p className="text-gray-700">{service.description}</p>
                                <div className="text-sm text-gray-500">
                                  {service.quantity.toFixed(2)} {service.unit} × {formatCurrency(service.unitPrice)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle>Terms & Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Terms & Conditions</Label>
                            <Textarea
                              className="input-blue-border"
                              value={estimateData.terms}
                              onChange={(e) => setEstimateData(prev => ({ ...prev, terms: e.target.value }))}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label>Additional Notes</Label>
                            <Textarea
                              className="input-blue-border"
                              value={estimateData.notes}
                              onChange={(e) => setEstimateData(prev => ({ ...prev, notes: e.target.value }))}
                              rows={3}
                              placeholder="Any additional information for the client..."
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <Card>
                        <CardHeader>
                          <CardTitle>Pricing Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(estimateData.subtotal)}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Tax (%)</Label>
                            <Input
                              className="input-blue-border"
                              type="number"
                              step="0.1"
                              value={estimateData.tax}
                              onChange={(e) => setEstimateData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Discount (%)</Label>
                            <Input
                              className="input-blue-border"
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
      </div>
    </div>
  );
}