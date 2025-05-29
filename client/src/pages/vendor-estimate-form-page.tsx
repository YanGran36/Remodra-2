import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import FenceMeasurementTool from "@/components/measurement/fence-measurement-tool";
import AdvancedMaterialsList from "@/components/estimates/advanced-materials-list";

const formSchema = z.object({
  clientId: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
  selectedServices: z.array(z.object({
    serviceType: z.string(),
    name: z.string(),
    laborRate: z.string(),
    unit: z.string(),
    measurements: z.object({
      quantity: z.number().optional(),
      squareFeet: z.number().optional(),
      linearFeet: z.number().optional(),
      units: z.number().optional(),
    }).optional(),
    notes: z.string().optional(),
  })),
  totalLaborCost: z.number().default(0),
  totalMaterialsCost: z.number().default(0),
  totalAmount: z.number().default(0),
});

type FormValues = z.infer<typeof formSchema>;

export default function VendorEstimateFormPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("client");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedServices: [],
      totalLaborCost: 0,
      totalMaterialsCost: 0,
      totalAmount: 0,
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
  });

  const createEstimateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create estimate");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Estimate created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: FormValues) => {
    createEstimateMutation.mutate(values);
  };

  const addService = () => {
    const currentServices = form.getValues("selectedServices");
    form.setValue("selectedServices", [
      ...currentServices,
      {
        serviceType: "",
        name: "",
        laborRate: "0",
        unit: "unit",
        measurements: {},
        notes: "",
      },
    ]);
  };

  const removeService = (index: number) => {
    const currentServices = form.getValues("selectedServices");
    const newServices = currentServices.filter((_, i) => i !== index);
    form.setValue("selectedServices", newServices);
  };

  const updateServiceMeasurements = (index: number, measurements: any) => {
    const currentServices = form.getValues("selectedServices");
    currentServices[index].measurements = measurements;
    form.setValue("selectedServices", currentServices);
  };

  const serviceTypeOptions = [
    "Fence",
    "Deck", 
    "Roofing",
    "Windows",
    "Gutters & Downspouts",
    "Siding",
    "Flooring",
    "Painting",
    "Electrical",
    "Plumbing",
    "Concrete",
    "Landscaping",
    "HVAC",
    "Other Services"
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Estimate</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            {/* Client Tab */}
            <TabsContent value="client" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                  <CardDescription>Select client and project details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            {(clients as any[])?.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.firstName} {client.lastName}
                              </SelectItem>
                            )) || []}
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
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project title" {...field} />
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
                            placeholder="Project description (optional)" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes (optional)" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="button" onClick={() => setActiveTab("services")}>
                    Next: Services
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Services & Labor</CardTitle>
                  <CardDescription>Add services and set labor rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.watch("selectedServices")?.map((service, index) => (
                    <Card key={index} className="p-4 border-2">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Service {index + 1}</h4>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeService(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`selectedServices.${index}.serviceType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select service type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {serviceTypeOptions.map((option) => (
                                    <SelectItem key={option.toLowerCase()} value={option.toLowerCase()}>
                                      {option}
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
                          name={`selectedServices.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Custom service name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`selectedServices.${index}.laborRate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Labor Rate ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`selectedServices.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="linear_foot">Linear Foot</SelectItem>
                                  <SelectItem value="square_foot">Square Foot</SelectItem>
                                  <SelectItem value="unit">Unit</SelectItem>
                                  <SelectItem value="hour">Hour</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`selectedServices.${index}.notes`}
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Service Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Additional notes for this service"
                                className="min-h-[60px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Card>
                  )) || []}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addService}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("client")}>
                    Previous
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("measurements")}>
                    Next: Measurements
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Measurements Tab */}
            <TabsContent value="measurements" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Measurements</CardTitle>
                  <CardDescription>Measure each service for accurate pricing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {form.watch("selectedServices")?.map((service, index) => (
                    <div key={index} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{service.serviceType}</Badge>
                        <h4 className="font-semibold">{service.name}</h4>
                      </div>

                      {service.serviceType === "fence" && (
                        <div className="bg-blue-50 p-4 rounded-lg border">
                          <h5 className="font-medium mb-3">Fence Measurement Tool</h5>
                          <FenceMeasurementTool
                            serviceUnit="linear_foot"
                            onMeasurementsChange={(measurements) => {
                              if (measurements.length > 0) {
                                const totalLength = measurements.reduce((sum, m) => sum + m.totalLength, 0);
                                const totalGates = measurements.reduce((sum, m) => sum + m.totalGates, 0);
                                updateServiceMeasurements(index, {
                                  linearFeet: totalLength,
                                  units: totalGates,
                                });
                              }
                            }}
                          />
                        </div>
                      )}

                      {service.serviceType === "deck" && (
                        <div className="bg-green-50 p-4 rounded-lg border">
                          <h5 className="font-medium mb-3">Deck Measurements</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Width (ft)</label>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0"
                                onChange={(e) => {
                                  const width = parseFloat(e.target.value) || 0;
                                  const length = service.measurements?.squareFeet ? service.measurements.squareFeet / width : 0;
                                  updateServiceMeasurements(index, {
                                    squareFeet: width * length,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Length (ft)</label>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0"
                                onChange={(e) => {
                                  const length = parseFloat(e.target.value) || 0;
                                  const width = service.measurements?.squareFeet ? service.measurements.squareFeet / length : 0;
                                  updateServiceMeasurements(index, {
                                    squareFeet: width * length,
                                  });
                                }}
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-sm text-muted-foreground">
                              Total Area: {service.measurements?.squareFeet || 0} sq ft
                            </span>
                          </div>
                        </div>
                      )}

                      {service.serviceType === "windows" && (
                        <div className="bg-yellow-50 p-4 rounded-lg border">
                          <h5 className="font-medium mb-3">Windows Count</h5>
                          <div className="w-32">
                            <label className="block text-sm font-medium mb-1">Number of Windows</label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              onChange={(e) => {
                                const units = parseInt(e.target.value) || 1;
                                updateServiceMeasurements(index, { units });
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {(service.serviceType === "gutters" || service.serviceType === "gutters & downspouts") && (
                        <div className="bg-purple-50 p-4 rounded-lg border">
                          <h5 className="font-medium mb-3">Gutters Linear Footage</h5>
                          <div className="w-32">
                            <label className="block text-sm font-medium mb-1">Linear Feet</label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              onChange={(e) => {
                                const linearFeet = parseFloat(e.target.value) || 0;
                                updateServiceMeasurements(index, { linearFeet });
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {(service.serviceType === "roofing" || service.serviceType === "siding") && (
                        <div className="bg-orange-50 p-4 rounded-lg border">
                          <h5 className="font-medium mb-3">{service.serviceType === "roofing" ? "Roof" : "Siding"} Area</h5>
                          <div className="w-32">
                            <label className="block text-sm font-medium mb-1">Square Feet</label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              onChange={(e) => {
                                const squareFeet = parseFloat(e.target.value) || 0;
                                updateServiceMeasurements(index, { squareFeet });
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )) || []}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("services")}>
                    Previous
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("materials")}>
                    Next: Materials
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Materials List</CardTitle>
                  <CardDescription>Estimated materials based on your measurements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {form.watch("selectedServices")?.map((service, serviceIndex) => {
                    if (service.serviceType === "fence") {
                      const linearFeet = service.measurements?.linearFeet || 0;
                      const totalGates = service.measurements?.units || 0;
                      const sections = Math.ceil(linearFeet / 8); // 8ft sections
                      const posts = sections + 1;
                      
                      return (
                        <div key={serviceIndex} className="bg-blue-50 p-4 rounded-lg border">
                          <h4 className="font-semibold text-blue-900 mb-3">{service.name} - Materials</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Fence Panels (6x8 ft):</span>
                                <span className="font-medium">{sections} panels</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Fence Posts (4x4x8 ft):</span>
                                <span className="font-medium">{posts} posts</span>
                              </div>
                              {totalGates > 0 && (
                                <div className="flex justify-between">
                                  <span>Gates (Complete Set):</span>
                                  <span className="font-medium">{totalGates} gates</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Concrete Bags (50lb):</span>
                                <span className="font-medium">{posts * 2} bags</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Galv. Screws (1lb box):</span>
                                <span className="font-medium">{Math.ceil(sections / 4)} boxes</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Hinges (per gate):</span>
                                <span className="font-medium">{totalGates * 2} hinges</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Gate Latches:</span>
                                <span className="font-medium">{totalGates} latches</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="text-sm text-blue-600">
                              <strong>Summary:</strong> {linearFeet} linear feet of fence with {totalGates} gates
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (service.serviceType === "deck") {
                      const squareFeet = service.measurements?.squareFeet || 0;
                      const joists = Math.ceil(squareFeet / 16); // Estimate joists
                      const boards = Math.ceil(squareFeet * 1.1); // 10% waste factor
                      
                      return (
                        <div key={serviceIndex} className="bg-green-50 p-4 rounded-lg border">
                          <h4 className="font-semibold text-green-900 mb-3">{service.name} - Materials</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Deck Boards (5/4x6x12):</span>
                                <span className="font-medium">{boards} boards</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Joists (2x8x12):</span>
                                <span className="font-medium">{joists} joists</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Joist Hangers:</span>
                                <span className="font-medium">{joists * 2} hangers</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Deck Screws (5lb box):</span>
                                <span className="font-medium">{Math.ceil(squareFeet / 100)} boxes</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Joist Hanger Nails (5lb):</span>
                                <span className="font-medium">1 box</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (service.serviceType === "windows") {
                      const units = service.measurements?.units || 0;
                      
                      return (
                        <div key={serviceIndex} className="bg-yellow-50 p-4 rounded-lg border">
                          <h4 className="font-semibold text-yellow-900 mb-3">{service.name} - Materials</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Window Units:</span>
                              <span className="font-medium">{units} windows</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Window Trim (linear ft):</span>
                              <span className="font-medium">{units * 20} ft</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Caulk Tubes:</span>
                              <span className="font-medium">{Math.ceil(units / 2)} tubes</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Window Screws:</span>
                              <span className="font-medium">{units * 12} screws</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={serviceIndex} className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-semibold text-gray-900 mb-3">{service.name} - Materials</h4>
                        <p className="text-gray-600">Custom materials list for this service type.</p>
                      </div>
                    );
                  }) || []}

                  {form.watch("selectedServices")?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Add services in the previous step to see materials list</p>
                    </div>
                  )}
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
                    type="button" 
                    onClick={() => setActiveTab("review")}
                  >
                    Next: Review
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review & Submit</CardTitle>
                  <CardDescription>Review all details before creating the estimate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client & Project Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Project Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Client:</span> {(clients as any)?.find?.((c: any) => c.id === form.watch("clientId"))?.firstName} {(clients as any)?.find?.((c: any) => c.id === form.watch("clientId"))?.lastName}
                        </div>
                        <div>
                          <span className="font-medium">Title:</span> {form.watch("title")}
                        </div>
                        {form.watch("description") && (
                          <div>
                            <span className="font-medium">Description:</span> {form.watch("description")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Labor Cost Summary */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Labor Cost Summary</h3>
                      <div className="space-y-2">
                        {form.watch("selectedServices")?.map((service: any, index: number) => {
                          const laborRate = parseFloat(service.laborRate) || 0;
                          let quantity = 1;
                          let unitLabel = "unit";
                          
                          if (service.measurements) {
                            if (service.serviceType === "fence" || service.serviceType === "gutters") {
                              quantity = service.measurements.linearFeet || 1;
                              unitLabel = "linear ft";
                            } else if (service.serviceType === "deck" || service.serviceType === "roofing" || service.serviceType === "siding") {
                              quantity = service.measurements.squareFeet || 1;
                              unitLabel = "sq ft";
                            } else if (service.serviceType === "windows") {
                              quantity = service.measurements.units || 1;
                              unitLabel = "unit";
                            }
                          }
                          
                          const serviceTotal = laborRate * quantity;
                          
                          return (
                            <div key={index} className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{service.name}</span>
                                <span className="text-muted-foreground ml-2">
                                  ({quantity.toLocaleString()} {unitLabel} × ${laborRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                </span>
                              </div>
                              <span className="font-medium">${serviceTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          );
                        }) || []}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("materials")}>
                    Back to Materials
                  </Button>
                  <Button type="submit" disabled={createEstimateMutation.isPending}>
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