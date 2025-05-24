import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import ProfessionalMeasurementTool from "@/components/measurement/professional-measurement-tool";

const formSchema = z.object({
  clientId: z.number().min(1, "Please select a client"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  serviceType: z.string().min(1, "Please select a service type"),
  laborAmount: z.number().min(0, "Labor amount must be positive").optional(),
  laborCost: z.number().optional(),
  materialsCost: z.number().optional(),
  totalAmount: z.number().optional(),
  quantity: z.number().min(0).optional(),
  squareFeet: z.number().min(0).optional(),
  linearFeet: z.number().min(0).optional(),
  units: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function VendorEstimateFormPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("client");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: 0,
      title: "",
      description: "",
      serviceType: "",
      laborAmount: 0,
      squareFeet: 0,
      linearFeet: 0,
      units: 0,
      notes: "",
    },
  });

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["/api/protected/clients"],
  });

  // Fetch services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/direct/services"],
  });

  // Fetch materials
  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ["/api/pricing/materials"],
  });

  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/protected/estimates", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Estimate created successfully",
      });
      setLocation("/estimates");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    createEstimateMutation.mutate(values);
  };

  function generateEstimateNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EST-${year}${month}${day}-${random}`;
  }

  useEffect(() => {
    form.setValue("title", generateEstimateNumber());
  }, [form]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setLocation("/estimates")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Estimate</h1>
          <p className="text-muted-foreground">
            Build a professional estimate for your client
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="labor">Labor</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            <TabsContent value="client" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                  <CardDescription>
                    Select the client for this estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients?.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
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
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimate Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter estimate title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter project description" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div></div>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("services")}
                    disabled={!form.getValues("clientId")}
                  >
                    Next: Services
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Multi Services</CardTitle>
                  <CardDescription>
                    Select the services you want to include in this estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {servicesLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading services...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6">
                      {services?.map((service: any) => {
                        const getServiceIcon = (serviceType: string) => {
                          switch(serviceType) {
                            case 'deck': return '🪵';
                            case 'fence': return '🔧';
                            case 'roof': return '🏠';
                            case 'windows': return '🪟';
                            case 'gutters': return '🏘️';
                            default: return '🔨';
                          }
                        };

                        return (
                          <div 
                            key={service.id}
                            className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                              form.getValues("serviceType") === service.serviceType 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                            onClick={() => form.setValue("serviceType", service.serviceType)}
                          >
                            <div className="text-center">
                              <div className="text-4xl mb-4">{getServiceIcon(service.serviceType)}</div>
                              <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">${service.laborRate}/{service.unit}</p>
                              <p className="text-xs text-gray-500">Professional {service.serviceType} service</p>
                            </div>
                          </div>
                        );
                      })}
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
                    onClick={() => setActiveTab("materials")}
                    disabled={!form.getValues("serviceType")}
                  >
                    Next: Materials
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Materials Selection</CardTitle>
                  <CardDescription>
                    Choose materials for your project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!form.getValues("serviceType") ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Please select a service type first</p>
                    </div>
                  ) : materialsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading materials...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Available Materials</h3>
                        <p className="text-sm text-muted-foreground">
                          Select materials and quantities for {services?.find(s => s.serviceType === form.getValues("serviceType"))?.name}
                        </p>
                      </div>
                      
                      {materials && materials.length > 0 ? (
                        <div className="grid gap-4">
                          {materials.map((material: any) => (
                            <div key={material.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">{material.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    ${material.unitPrice}/{material.unit}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    placeholder="Qty"
                                    className="w-20"
                                    min="0"
                                    step="0.1"
                                  />
                                  <span className="text-sm text-muted-foreground">{material.unit}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-medium">Subtotal: $0.00</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No materials found. Add materials in the pricing configuration.</p>
                        </div>
                      )}
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Materials Total:</span>
                          <span className="text-lg font-bold">$0.00</span>
                        </div>
                      </div>
                    </div>
                  )}
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
                    onClick={() => setActiveTab("labor")}
                  >
                    Next: Labor
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="labor" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Labor Calculation</CardTitle>
                  <CardDescription>
                    Configure labor costs for your estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!form.getValues("serviceType") ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Please select a service type first</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        const selectedService = services?.find(s => s.serviceType === form.getValues("serviceType"));
                        return selectedService ? (
                          <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h3 className="text-lg font-semibold mb-2">Service: {selectedService.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Labor Rate: ${selectedService.laborRate}/{selectedService.unit}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="measurements.area"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {selectedService.unit === 'sqft' ? 'Area (sq ft)' : 
                                       selectedService.unit === 'ft' ? 'Linear Feet' : 
                                       selectedService.unit === 'unit' ? 'Number of Units' : 'Quantity'}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder={`Enter ${selectedService.unit}`}
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e.target.value);
                                          // Auto-calculate labor cost
                                          const quantity = parseFloat(e.target.value) || 0;
                                          const laborRate = parseFloat(selectedService.laborRate) || 0;
                                          const laborTotal = quantity * laborRate;
                                          form.setValue("laborCost", laborTotal.toString());
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="laborCost"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Labor Cost (Calculated)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="$0.00"
                                        {...field}
                                        readOnly
                                        className="bg-gray-50"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="border-t pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <span className="text-sm font-medium">Calculation Details:</span>
                                  <div className="text-sm text-muted-foreground">
                                    <div>Quantity: {form.watch("measurements.area") || "0"} {selectedService.unit}</div>
                                    <div>Rate: ${selectedService.laborRate}/{selectedService.unit}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-semibold">Labor Total: ${form.watch("laborCost") || "0.00"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("materials")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("measurements")}
                  >
                    Next: Measurements
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="measurements" className="space-y-6 pt-4">
              {!form.getValues("serviceType") ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Measurements</CardTitle>
                    <CardDescription>
                      Take measurements for your project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Please select a service type first</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab("labor")}
                    >
                      Previous
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setActiveTab("review")}
                    >
                      Next: Review
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const selectedService = services?.find(s => s.serviceType === form.getValues("serviceType"));
                    return selectedService ? (
                      <>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="text-lg font-semibold mb-2">Service: {selectedService.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Unit: {selectedService.unit} | Labor Rate: ${selectedService.laborRate}/{selectedService.unit}
                          </p>
                        </div>
                        
                        <ProfessionalMeasurementTool 
                          onMeasurementsChange={(measurements) => {
                            // Calculate totals from professional measurements
                            const totalArea = measurements.reduce((sum, m) => sum + (m.area || 0), 0);
                            const totalLinear = measurements.reduce((sum, m) => sum + (m.length || m.perimeter || 0), 0);
                            
                            // Update form with measurement data based on service type
                            if (selectedService.unit === 'sqft') {
                              form.setValue("squareFeet", totalArea);
                            } else if (selectedService.unit === 'ft') {
                              form.setValue("linearFeet", totalLinear);
                            } else if (selectedService.unit === 'unit') {
                              form.setValue("units", measurements.length); // Count of measurements
                            }
                            
                            // Auto-calculate labor cost
                            const laborRate = parseFloat(selectedService.laborRate) || 0;
                            let laborTotal = 0;
                            
                            if (selectedService.unit === 'sqft') {
                              laborTotal = totalArea * laborRate;
                            } else if (selectedService.unit === 'ft') {
                              laborTotal = totalLinear * laborRate;
                            } else {
                              laborTotal = measurements.length * laborRate;
                            }
                            
                            form.setValue("laborCost", laborTotal);
                          }}
                          serviceUnit={selectedService.unit}
                        />
                        
                        <Card>
                          <CardFooter className="flex justify-between">
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => setActiveTab("labor")}
                            >
                              Previous
                            </Button>
                            <Button 
                              type="button" 
                              onClick={() => setActiveTab("review")}
                            >
                              Next: Review
                            </Button>
                          </CardFooter>
                        </Card>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
            </TabsContent>

            <TabsContent value="review" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review & Create Estimate</CardTitle>
                  <CardDescription>
                    Review your estimate before creating
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold">Client:</Label>
                        <p className="text-sm text-muted-foreground">
                          {clients?.find((c: any) => c.id === form.getValues("clientId"))?.firstName} {clients?.find((c: any) => c.id === form.getValues("clientId"))?.lastName}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Service:</Label>
                        <p className="text-sm text-muted-foreground">
                          {services?.find(s => s.serviceType === form.getValues("serviceType"))?.name}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="font-semibold">Title:</Label>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues("title")}
                      </p>
                    </div>
                    
                    {form.getValues("description") && (
                      <div>
                        <Label className="font-semibold">Description:</Label>
                        <p className="text-sm text-muted-foreground">
                          {form.getValues("description")}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Cost Breakdown</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Labor ({form.watch("measurements.area") || "0"} {services?.find(s => s.serviceType === form.getValues("serviceType"))?.unit})</span>
                        <span className="font-medium">${form.watch("laborCost") || "0.00"}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Materials</span>
                        <span className="font-medium">$0.00</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Estimate:</span>
                        <span>${(parseFloat(form.watch("laborCost") || "0")).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This estimate is valid for 30 days. Final pricing may vary based on site conditions and material costs.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("measurements")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createEstimateMutation.isPending}
                  >
                    {createEstimateMutation.isPending ? "Creating..." : "Create Estimate"}
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