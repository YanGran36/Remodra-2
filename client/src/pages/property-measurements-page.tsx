import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Ruler, Square, CheckSquare, Pencil, Trash2, Home, Columns, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Client, PropertyMeasurement } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PageHeader from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

// Define the form validation schema
const measurementFormSchema = z.object({
  clientId: z.string().min(1, { message: "Please select a client" }),
  projectId: z.string().optional(),
  serviceType: z.enum(['roof', 'siding', 'deck', 'fence', 'windows', 'gutters']),
  totalSquareFeet: z.string().optional(),
  totalLinearFeet: z.string().optional(),
  notes: z.string().optional(),
  measurementData: z.record(z.any()).optional(),
});

type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

interface Project {
  id: number;
  title: string;
}

// A component for displaying measurement details
const MeasurementDetails = ({ measurement, onClose }: { measurement: PropertyMeasurement; onClose: () => void }) => {
  const serviceTypeIcons = {
    roof: <Roofing className="h-5 w-5 mr-2" />,
    siding: <Home className="h-5 w-5 mr-2" />,
    deck: <Square className="h-5 w-5 mr-2" />,
    fence: <Fence className="h-5 w-5 mr-2" />,
    windows: <Square className="h-5 w-5 mr-2" />,
    gutters: <Tape className="h-5 w-5 mr-2" />,
  };

  const serviceTypeNames = {
    roof: "Roof",
    siding: "Siding",
    deck: "Deck",
    fence: "Fence",
    windows: "Windows",
    gutters: "Gutters",
  };

  const serviceIcon = serviceTypeIcons[measurement.serviceType as keyof typeof serviceTypeIcons] || <Ruler className="h-5 w-5 mr-2" />;
  const serviceName = serviceTypeNames[measurement.serviceType as keyof typeof serviceTypeNames] || measurement.serviceType;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        {serviceIcon}
        <h3 className="text-xl font-semibold">{serviceName} Measurement</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Client</p>
          <p className="font-medium">{measurement.client?.firstName} {measurement.client?.lastName}</p>
        </div>
        
        {measurement.project && (
          <div>
            <p className="text-sm text-muted-foreground">Project</p>
            <p className="font-medium">{measurement.project.title}</p>
          </div>
        )}
        
        <div>
          <p className="text-sm text-muted-foreground">Total Square Feet</p>
          <p className="font-medium">{measurement.totalSquareFeet ? Number(measurement.totalSquareFeet).toFixed(2) : 'N/A'} sq ft</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Total Linear Feet</p>
          <p className="font-medium">{measurement.totalLinearFeet ? Number(measurement.totalLinearFeet).toFixed(2) : 'N/A'} linear ft</p>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">Measured On</p>
          <p className="font-medium">{format(new Date(measurement.measuredAt), 'MMM d, yyyy')}</p>
        </div>
      </div>
      
      {measurement.notes && (
        <div>
          <p className="text-sm text-muted-foreground">Notes</p>
          <p className="mt-1">{measurement.notes}</p>
        </div>
      )}
      
      {measurement.measurementData && Object.keys(measurement.measurementData).length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Measurement Details</p>
          <div className="bg-muted p-3 rounded-md">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(measurement.measurementData, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

// Main component for property measurements
const PropertyMeasurementsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMeasurement, setSelectedMeasurement] = useState<PropertyMeasurement | null>(null);
  const [filter, setFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Fetch measurements
  const { data: measurements = [], isLoading: isMeasurementsLoading } = useQuery({
    queryKey: ["/api/protected/property-measurements"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch clients
  const { data: clients = [], isLoading: isClientsLoading } = useQuery({
    queryKey: ["/api/protected/clients"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch projects
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["/api/protected/projects"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Filter projects by client
  const filteredProjects = selectedClientId 
    ? projects.filter((project: Project) => project.clientId.toString() === selectedClientId)
    : [];

  // Define form
  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: {
      clientId: "",
      projectId: "",
      serviceType: "roof",
      totalSquareFeet: "",
      totalLinearFeet: "",
      notes: "",
      measurementData: {},
    },
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: MeasurementFormValues) => {
      const res = await apiRequest("POST", "/api/protected/property-measurements", {
        ...data,
        clientId: parseInt(data.clientId),
        projectId: data.projectId ? parseInt(data.projectId) : null,
        // Convert strings to numbers where needed
        totalSquareFeet: data.totalSquareFeet ? parseFloat(data.totalSquareFeet) : null,
        totalLinearFeet: data.totalLinearFeet ? parseFloat(data.totalLinearFeet) : null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/property-measurements"] });
      setIsFormOpen(false);
      form.reset();
      toast({
        title: "Measurement saved",
        description: "Property measurement has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save measurement: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/property-measurements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/property-measurements"] });
      toast({
        title: "Measurement deleted",
        description: "Property measurement has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete measurement: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: MeasurementFormValues) => {
    createMutation.mutate(values);
  };

  // Handle client selection
  const handleClientChange = (value: string) => {
    form.setValue("clientId", value);
    setSelectedClientId(value);
    form.setValue("projectId", ""); // Reset project when client changes
  };

  // Handle service type selection
  const handleServiceTypeChange = (value: string) => {
    if (value === "roof" || value === "siding" || value === "deck" || value === "fence" || value === "windows" || value === "gutters") {
      form.setValue("serviceType", value);
    }
  };

  // Filter measurements by service type
  const filteredMeasurements = filter === "all" 
    ? measurements 
    : measurements.filter((m: PropertyMeasurement) => m.serviceType === filter);

  const getServiceTypeIcon = (type: string) => {
    switch(type) {
      case 'roof': return <Roofing className="h-4 w-4" />;
      case 'siding': return <Home className="h-4 w-4" />;
      case 'deck': return <Square className="h-4 w-4" />;
      case 'fence': return <Fence className="h-4 w-4" />;
      case 'windows': return <Square className="h-4 w-4" />;
      case 'gutters': return <Tape className="h-4 w-4" />;
      default: return <Ruler className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Property Measurements" 
        description="Record and manage measurements for client properties"
      />
      
      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" className="w-[400px]" onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="roof">Roof</TabsTrigger>
            <TabsTrigger value="siding">Siding</TabsTrigger>
            <TabsTrigger value="deck">Deck</TabsTrigger>
            <TabsTrigger value="fence">Fence</TabsTrigger>
            <TabsTrigger value="windows">Windows</TabsTrigger>
            <TabsTrigger value="gutters">Gutters</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Measurement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Property Measurement</DialogTitle>
              <DialogDescription>
                Record measurements for a client's property. Accurate measurements help create precise estimates.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={handleClientChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client: Client) => (
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
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {filteredProjects.map((project: Project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a project to associate with this measurement.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={handleServiceTypeChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="roof">Roof</SelectItem>
                          <SelectItem value="siding">Siding</SelectItem>
                          <SelectItem value="deck">Deck</SelectItem>
                          <SelectItem value="fence">Fence</SelectItem>
                          <SelectItem value="windows">Windows</SelectItem>
                          <SelectItem value="gutters">Gutters</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalSquareFeet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Square Feet</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalLinearFeet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Linear Feet</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormDescription>
                        Add any additional details or notes about the measurement.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Save Measurement"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "all" ? "All Measurements" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Measurements`}
          </CardTitle>
          <CardDescription>
            View and manage property measurements for your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMeasurementsLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : filteredMeasurements.length === 0 ? (
            <div className="text-center py-8">
              <Ruler className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No measurements found</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                {filter === "all" 
                  ? "You haven't recorded any property measurements yet." 
                  : `You haven't recorded any ${filter} measurements yet.`}
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Measurement
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Square Feet</TableHead>
                  <TableHead>Linear Feet</TableHead>
                  <TableHead>Measured On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeasurements.map((measurement: PropertyMeasurement) => (
                  <TableRow key={measurement.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {getServiceTypeIcon(measurement.serviceType)}
                        <span className="ml-2 capitalize">{measurement.serviceType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {measurement.client ? `${measurement.client.firstName} ${measurement.client.lastName}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {measurement.project ? measurement.project.title : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {measurement.totalSquareFeet ? `${Number(measurement.totalSquareFeet).toFixed(2)} sq ft` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {measurement.totalLinearFeet ? `${Number(measurement.totalLinearFeet).toFixed(2)} ft` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(measurement.measuredAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedMeasurement(measurement)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this measurement?")) {
                                deleteMutation.mutate(measurement.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedMeasurement} onOpenChange={(open) => !open && setSelectedMeasurement(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedMeasurement && (
            <MeasurementDetails 
              measurement={selectedMeasurement} 
              onClose={() => setSelectedMeasurement(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyMeasurementsPage;