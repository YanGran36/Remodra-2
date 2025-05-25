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
import { Trash2, Plus } from "lucide-react";
import FenceMeasurementTool from "@/components/measurement/fence-measurement-tool";

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
    laborCost: z.number().optional(),
    materialsCost: z.number().optional(),
    notes: z.string().optional(),
  })),
  totalLaborCost: z.number().optional(),
  totalMaterialsCost: z.number().optional(),
  totalAmount: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function VendorEstimateFormPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("client");
  const [availableServices, setAvailableServices] = useState<any[]>([]);

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
  const { data: clients } = useQuery({
    queryKey: ["/api/protected/clients"],
  });

  // Fetch available services
  const { data: services } = useQuery({
    queryKey: ["/api/direct/services"],
  });

  useEffect(() => {
    if (services) {
      setAvailableServices(services);
    }
  }, [services]);

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

  const addService = (service: any) => {
    const currentServices = form.getValues("selectedServices");
    const newService = {
      serviceType: service.serviceType,
      name: service.name,
      laborRate: service.laborRate,
      unit: service.unit,
      measurements: {},
      laborCost: 0,
      materialsCost: 0,
      notes: "",
    };
    form.setValue("selectedServices", [...currentServices, newService]);
  };

  const removeService = (index: number) => {
    const currentServices = form.getValues("selectedServices");
    currentServices.splice(index, 1);
    form.setValue("selectedServices", currentServices);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
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
                  <CardTitle>Client Information</CardTitle>
                  <CardDescription>Select client and provide estimate details</CardDescription>
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
                          <Textarea placeholder="Enter project description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="button" onClick={() => setActiveTab("services")} className="ml-auto">
                    Continue to Services
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Services</CardTitle>
                  <CardDescription>Choose the services for this estimate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Available Services */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Available Services</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableServices.map((service) => (
                        <div key={service.id} className="border rounded-lg p-4 space-y-3">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${service.laborRate}/{service.unit}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addService(service)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            ADD
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Services */}
                  {form.getValues("selectedServices").length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Selected Services</h3>
                      <div className="space-y-3">
                        {form.getValues("selectedServices").map((service: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{service.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                ${service.laborRate}/{service.unit}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeService(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("client")}>
                    Back to Client
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("measurements")}
                    disabled={!form.watch("selectedServices") || form.watch("selectedServices").length === 0}
                  >
                    Continue to Measurements
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Measurements Tab */}
            <TabsContent value="measurements" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Measurements</CardTitle>
                  <CardDescription>Measure each selected service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {form.watch("selectedServices")?.length === 0 || !form.watch("selectedServices") ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Please select services first</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {form.watch("selectedServices").map((service: any, index: number) => (
                        <div key={`${service.serviceType}-${index}`} className="border rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-4">{service.name} Measurements</h3>
                          
                          {service.serviceType === "fence" && (
                            <FenceMeasurementTool
                              serviceUnit={service.unit}
                              onMeasurementsChange={(measurements) => {
                                const currentServices = form.getValues("selectedServices");
                                // Calculate totals from measurements array
                                const totalLength = measurements.reduce((sum: number, m: any) => sum + (m.totalLength || 0), 0);
                                const totalGates = measurements.reduce((sum: number, m: any) => sum + (m.totalGates || 0), 0);
                                
                                currentServices[index] = {
                                  ...currentServices[index],
                                  measurements: {
                                    linearFeet: totalLength,
                                    squareFeet: 0,
                                    units: totalGates,
                                    quantity: totalLength,
                                  }
                                };
                                form.setValue("selectedServices", currentServices);
                              }}
                            />
                          )}
                          
                          {service.serviceType === "deck" && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Deck Area Measurement</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Width (ft)</label>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter width"
                                    onChange={(e) => {
                                      const width = parseFloat(e.target.value) || 0;
                                      const length = service.measurements?.length || 0;
                                      const squareFeet = width * length;
                                      
                                      const currentServices = form.getValues("selectedServices");
                                      currentServices[index] = {
                                        ...currentServices[index],
                                        measurements: {
                                          ...currentServices[index].measurements,
                                          width,
                                          length,
                                          squareFeet,
                                          quantity: squareFeet,
                                        }
                                      };
                                      form.setValue("selectedServices", currentServices);
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Length (ft)</label>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter length"
                                    onChange={(e) => {
                                      const length = parseFloat(e.target.value) || 0;
                                      const width = service.measurements?.width || 0;
                                      const squareFeet = width * length;
                                      
                                      const currentServices = form.getValues("selectedServices");
                                      currentServices[index] = {
                                        ...currentServices[index],
                                        measurements: {
                                          ...currentServices[index].measurements,
                                          width,
                                          length,
                                          squareFeet,
                                          quantity: squareFeet,
                                        }
                                      };
                                      form.setValue("selectedServices", currentServices);
                                    }}
                                  />
                                </div>
                              </div>
                              {service.measurements?.squareFeet > 0 && (
                                <div className="p-3 bg-blue-50 rounded">
                                  <p className="text-sm font-medium">Total Area: {service.measurements.squareFeet} sq ft</p>
                                </div>
                              )}
                            </div>
                          )}

                          {service.serviceType === "windows" && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Number of Windows</p>
                              <Input 
                                type="number" 
                                placeholder="Enter number of windows"
                                onChange={(e) => {
                                  const units = parseInt(e.target.value) || 0;
                                  
                                  const currentServices = form.getValues("selectedServices");
                                  currentServices[index] = {
                                    ...currentServices[index],
                                    measurements: {
                                      ...currentServices[index].measurements,
                                      units,
                                      quantity: units,
                                    }
                                  };
                                  form.setValue("selectedServices", currentServices);
                                }}
                              />
                              {service.measurements?.units > 0 && (
                                <div className="p-3 bg-blue-50 rounded">
                                  <p className="text-sm font-medium">Total Windows: {service.measurements.units} units</p>
                                </div>
                              )}
                            </div>
                          )}

                          {service.serviceType === "gutters" && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Linear Feet of Gutters</p>
                              <Input 
                                type="number" 
                                placeholder="Enter linear feet"
                                onChange={(e) => {
                                  const linearFeet = parseFloat(e.target.value) || 0;
                                  
                                  const currentServices = form.getValues("selectedServices");
                                  currentServices[index] = {
                                    ...currentServices[index],
                                    measurements: {
                                      ...currentServices[index].measurements,
                                      linearFeet,
                                      quantity: linearFeet,
                                    }
                                  };
                                  form.setValue("selectedServices", currentServices);
                                }}
                              />
                              {service.measurements?.linearFeet > 0 && (
                                <div className="p-3 bg-blue-50 rounded">
                                  <p className="text-sm font-medium">Total Length: {service.measurements.linearFeet} linear ft</p>
                                </div>
                              )}
                            </div>
                          )}

                          {service.serviceType === "roof" && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Roof Area (sq ft)</p>
                              <Input 
                                type="number" 
                                placeholder="Enter roof area"
                                onChange={(e) => {
                                  const squareFeet = parseFloat(e.target.value) || 0;
                                  
                                  const currentServices = form.getValues("selectedServices");
                                  currentServices[index] = {
                                    ...currentServices[index],
                                    measurements: {
                                      ...currentServices[index].measurements,
                                      squareFeet,
                                      quantity: squareFeet,
                                    }
                                  };
                                  form.setValue("selectedServices", currentServices);
                                }}
                              />
                              {service.measurements?.squareFeet > 0 && (
                                <div className="p-3 bg-blue-50 rounded">
                                  <p className="text-sm font-medium">Total Area: {service.measurements.squareFeet} sq ft</p>
                                </div>
                              )}
                            </div>
                          )}

                          {service.serviceType === "siding" && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Siding Measurements</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Height (ft)</label>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter height"
                                    onChange={(e) => {
                                      const height = parseFloat(e.target.value) || 0;
                                      const perimeter = service.measurements?.perimeter || 0;
                                      const squareFeet = height * perimeter;
                                      
                                      const currentServices = form.getValues("selectedServices");
                                      currentServices[index] = {
                                        ...currentServices[index],
                                        measurements: {
                                          ...currentServices[index].measurements,
                                          height,
                                          perimeter,
                                          squareFeet,
                                          quantity: squareFeet,
                                        }
                                      };
                                      form.setValue("selectedServices", currentServices);
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Perimeter (ft)</label>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter perimeter"
                                    onChange={(e) => {
                                      const perimeter = parseFloat(e.target.value) || 0;
                                      const height = service.measurements?.height || 0;
                                      const squareFeet = height * perimeter;
                                      
                                      const currentServices = form.getValues("selectedServices");
                                      currentServices[index] = {
                                        ...currentServices[index],
                                        measurements: {
                                          ...currentServices[index].measurements,
                                          height,
                                          perimeter,
                                          squareFeet,
                                          quantity: squareFeet,
                                        }
                                      };
                                      form.setValue("selectedServices", currentServices);
                                    }}
                                  />
                                </div>
                              </div>
                              {service.measurements?.squareFeet > 0 && (
                                <div className="p-3 bg-blue-50 rounded">
                                  <p className="text-sm font-medium">Total Area: {service.measurements.squareFeet} sq ft</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("services")}>
                    Back to Services
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("materials")}>
                    Continue to Materials
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Materials List</CardTitle>
                  <CardDescription>Basic materials needed for selected services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!form.watch("selectedServices") || form.watch("selectedServices").length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Please select services first</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {form.watch("selectedServices").map((service: any, index: number) => (
                        <div key={`materials-${service.serviceType}-${index}`} className="border rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-4">{service.name} - Materials Needed</h3>
                          
                          {service.serviceType === "fence" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Posts & Foundation</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Pressure treated posts</li>
                                  <li>• Concrete mix</li>
                                  <li>• Post anchors</li>
                                  <li>• Gravel</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Panels & Hardware</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Fence panels</li>
                                  <li>• Rails (2x4)</li>
                                  <li>• Screws/nails</li>
                                  <li>• Gate hardware</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Finishing</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Post caps</li>
                                  <li>• Wood stain</li>
                                  <li>• Primer</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "deck" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Structure</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Joists (2x8, 2x10)</li>
                                  <li>• Beam boards</li>
                                  <li>• Posts (4x4, 6x6)</li>
                                  <li>• Concrete footings</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Decking</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Deck boards</li>
                                  <li>• Joist hangers</li>
                                  <li>• Bolts and screws</li>
                                  <li>• Flashing</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Railing</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Railing posts</li>
                                  <li>• Balusters</li>
                                  <li>• Top/bottom rails</li>
                                  <li>• Deck stain</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "roof" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Roofing</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Shingles or metal</li>
                                  <li>• Underlayment</li>
                                  <li>• Ice shield</li>
                                  <li>• Drip edge</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Hardware</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Roofing nails</li>
                                  <li>• Ridge caps</li>
                                  <li>• Roof vents</li>
                                  <li>• Sealants</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "windows" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Windows</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Window units</li>
                                  <li>• Screens</li>
                                  <li>• Hardware</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Installation</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Flashing tape</li>
                                  <li>• Insulation foam</li>
                                  <li>• Caulk</li>
                                  <li>• Trim boards</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "gutters" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Gutter System</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Gutters</li>
                                  <li>• Downspouts</li>
                                  <li>• End caps</li>
                                  <li>• Guards</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Hardware</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Hangers</li>
                                  <li>• Screws</li>
                                  <li>• Splash blocks</li>
                                  <li>• Sealants</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "siding" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Siding</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Siding panels</li>
                                  <li>• Starter strips</li>
                                  <li>• J-channel</li>
                                  <li>• Corner posts</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Installation</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• House wrap</li>
                                  <li>• Fasteners</li>
                                  <li>• Caulk</li>
                                  <li>• Paint/stain</li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("measurements")}>
                    Back to Measurements
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("review")}>
                    Continue to Review
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Estimate</CardTitle>
                  <CardDescription>Complete summary ready for client presentation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Client Information Summary */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Project Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Client</p>
                        <p className="font-medium">
                          {clients?.find(c => c.id === form.watch("clientId"))?.firstName} {clients?.find(c => c.id === form.watch("clientId"))?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estimate Number</p>
                        <p className="font-medium">{form.watch("title") || "EST-" + Date.now().toString().slice(-6)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="font-medium">{form.watch("description") || "No description provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Services Summary */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Services Included</h3>
                    {form.getValues("selectedServices")?.length > 0 ? (
                      <div className="space-y-3">
                        {form.getValues("selectedServices").map((service: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{service.name}</h4>
                                <p className="text-sm text-muted-foreground">{service.serviceType} installation</p>
                              </div>
                              <Badge variant="secondary">{service.unit}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No services selected</p>
                    )}
                  </div>

                  {/* Measurements Summary */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Project Measurements</h3>
                    {form.getValues("selectedServices")?.length > 0 ? (
                      <div className="space-y-3">
                        {form.getValues("selectedServices").map((service: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <h4 className="font-medium mb-2">{service.name}</h4>
                            <div className="text-sm text-muted-foreground">
                              {service.serviceType === "fence" && (
                                <div>
                                  <p>• Professional fence layout with precise measurements</p>
                                  {service.measurements && (
                                    <>
                                      <p>• Total linear footage: {service.measurements.linearFeet || 0} ft</p>
                                      <p>• Gate installations: {service.measurements.units || 0} units</p>
                                      <p>• Post requirements calculated based on spacing</p>
                                    </>
                                  )}
                                </div>
                              )}
                              {service.serviceType === "deck" && (
                                <div>
                                  <p>• Deck area measurement and structural planning</p>
                                  {service.measurements && (
                                    <>
                                      <p>• Total deck area: {service.measurements.squareFeet || 0} sq ft</p>
                                      <p>• Structural support and joist layout included</p>
                                      <p>• Railing perimeter measured and planned</p>
                                    </>
                                  )}
                                </div>
                              )}
                              {service.serviceType === "windows" && (
                                <div>
                                  <p>• Window measurement and installation planning</p>
                                  {service.measurements && (
                                    <>
                                      <p>• Number of windows: {service.measurements.units || 0} units</p>
                                      <p>• Opening size verification and trim calculation</p>
                                      <p>• Installation sequence planned</p>
                                    </>
                                  )}
                                </div>
                              )}
                              {service.serviceType === "gutters" && (
                                <div>
                                  <p>• Gutter system measurement and slope planning</p>
                                  {service.measurements && (
                                    <>
                                      <p>• Total gutter length: {service.measurements.linearFeet || 0} ft</p>
                                      <p>• Downspout placement optimized for drainage</p>
                                      <p>• Proper slope calculated for water flow</p>
                                    </>
                                  )}
                                </div>
                              )}
                              {service.serviceType === "roof" && (
                                <div>
                                  <p>• Roof measurement and material calculation</p>
                                  {service.measurements && (
                                    <>
                                      <p>• Total roof area: {service.measurements.squareFeet || 0} sq ft</p>
                                      <p>• Pitch and slope assessment completed</p>
                                      <p>• Material waste factor included in calculations</p>
                                    </>
                                  )}
                                </div>
                              )}
                              {service.serviceType === "siding" && (
                                <div>
                                  <p>• Siding coverage measurement and planning</p>
                                  {service.measurements && (
                                    <>
                                      <p>• Coverage area: {service.measurements.squareFeet || 0} sq ft</p>
                                      <p>• Window and door cutouts accounted for</p>
                                      <p>• Corner and trim measurements included</p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No measurements available</p>
                    )}
                  </div>

                  {/* Materials Summary */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Materials & Components</h3>
                    {form.getValues("selectedServices")?.length > 0 ? (
                      <div className="space-y-4">
                        {form.getValues("selectedServices").map((service: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <h4 className="font-medium mb-2">{service.name} Materials</h4>
                            <div className="text-sm text-muted-foreground">
                              {service.serviceType === "fence" && (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Premium pressure treated posts and foundation materials</li>
                                  <li>High-quality fence panels and rail systems</li>
                                  <li>Professional-grade hardware and fasteners</li>
                                  <li>Finishing materials and protective coatings</li>
                                </ul>
                              )}
                              {service.serviceType === "deck" && (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Structural framing and support components</li>
                                  <li>Premium decking boards and surface materials</li>
                                  <li>Safety railing system and balusters</li>
                                  <li>Weather protection and finishing materials</li>
                                </ul>
                              )}
                              {service.serviceType === "roof" && (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>High-quality roofing materials and underlayment</li>
                                  <li>Professional-grade installation hardware</li>
                                  <li>Weather sealing and protection components</li>
                                </ul>
                              )}
                              {service.serviceType === "windows" && (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Energy-efficient window units</li>
                                  <li>Professional installation materials and trim</li>
                                  <li>Sealing and weatherproofing components</li>
                                </ul>
                              )}
                              {service.serviceType === "gutters" && (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Seamless gutter system components</li>
                                  <li>Professional mounting and support hardware</li>
                                  <li>Drainage accessories and end caps</li>
                                </ul>
                              )}
                              {service.serviceType === "siding" && (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Premium siding panels and trim materials</li>
                                  <li>Installation hardware and fastening systems</li>
                                  <li>Weather barrier and insulation components</li>
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No materials listed</p>
                    )}
                  </div>

                  {/* Project Details */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">What's Included</h3>
                    <div className="space-y-2 text-sm">
                      <p>✓ Professional consultation and project planning</p>
                      <p>✓ All materials and components listed above</p>
                      <p>✓ Professional installation and workmanship</p>
                      <p>✓ Site cleanup and debris removal</p>
                      <p>✓ Quality guarantee on all work performed</p>
                    </div>
                  </div>

                  {/* Final Price */}
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="text-lg font-semibold mb-3">Project Total</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Estimate</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${form.watch("selectedServices")?.reduce((total: number, service: any) => {
                            const laborRate = parseFloat(service.laborRate || 0);
                            let quantity = 1;
                            
                            // Calculate quantity based on service type and measurements
                            if (service.measurements) {
                              if (service.serviceType === "fence" || service.serviceType === "gutters") {
                                // Linear feet services
                                quantity = service.measurements.linearFeet || 1;
                              } else if (service.serviceType === "deck" || service.serviceType === "roof" || service.serviceType === "siding") {
                                // Square feet services
                                quantity = service.measurements.squareFeet || 1;
                              } else if (service.serviceType === "windows") {
                                // Unit-based services
                                quantity = service.measurements.units || 1;
                              }
                            }
                            
                            return total + (laborRate * quantity);
                          }, 0).toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Services Count</p>
                        <p className="text-lg font-semibold">{form.watch("selectedServices")?.length || 0} services</p>
                      </div>
                    </div>
                    
                    {/* Price Breakdown */}
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Price Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        {form.watch("selectedServices")?.map((service: any, index: number) => {
                          const laborRate = parseFloat(service.laborRate || 0);
                          let quantity = 1;
                          let unitLabel = "unit";
                          
                          if (service.measurements) {
                            if (service.serviceType === "fence" || service.serviceType === "gutters") {
                              quantity = service.measurements.linearFeet || 1;
                              unitLabel = "linear ft";
                            } else if (service.serviceType === "deck" || service.serviceType === "roof" || service.serviceType === "siding") {
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
                                  ({quantity} {unitLabel} × ${laborRate})
                                </span>
                              </div>
                              <span className="font-medium">${serviceTotal.toFixed(2)}</span>
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