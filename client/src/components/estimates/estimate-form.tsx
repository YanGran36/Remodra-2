import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Save, Edit, User, FileText, Calculator, DollarSign, Settings } from "lucide-react";
import { useToast } from '../../hooks/use-toast';
import { useEstimates } from '../../hooks/use-estimates';
import { useClients } from '../../hooks/use-clients';
import { useProjects } from '../../hooks/use-projects';
import { formatCurrency } from '../../lib/utils';
import { 
  SERVICE_TYPES, 
  MATERIALS_BY_SERVICE, 
  SERVICE_INFO, 
  LABOR_RATES_BY_SERVICE,
  getMaterial,
  getServiceLabel
} from '../../lib/service-options';

import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Calendar } from '../ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '../ui/select';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

// Validation schema for the form
const estimateFormSchema = z.object({
  clientId: z.coerce.number().min(1, "Client is required"),
  projectId: z.coerce.number().optional().nullable(), // El proyecto es completamente opcional
  estimateNumber: z.string().optional(),
  issueDate: z.date(),
  expiryDate: z.date().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  // Changed monetary field types to string for backend compatibility
  subtotal: z.string().or(z.number().transform(val => String(val))),
  tax: z.string().or(z.number().transform(val => String(val))),
  discount: z.string().or(z.number().transform(val => String(val))),
  total: z.string().or(z.number().transform(val => String(val))),
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

// Schema for estimate items
const estimateItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  // Convert monetary values to string for backend compatibility
  unitPrice: z.string().or(z.number().transform(val => String(val))),
  amount: z.string().or(z.number().transform(val => String(val))),
  notes: z.string().optional(),
});

type EstimateItemValues = z.infer<typeof estimateItemSchema>;

export interface EstimateFormProps {
  clientId?: number;
  projectId?: number;
  onSuccess?: (estimate: any) => void;
  onCancel?: () => void;
  estimateId?: number; // ID of the estimate to edit
}

export default function EstimateForm({ clientId, projectId, estimateId, onSuccess, onCancel }: EstimateFormProps) {
  const [items, setItems] = useState<EstimateItemValues[]>([]);
  const [newItem, setNewItem] = useState<EstimateItemValues>({
    description: "",
    quantity: 1,
    unitPrice: "0",
    amount: "0",
    notes: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const { toast } = useToast();
  const { createEstimateMutation, updateEstimateMutation } = useEstimates();
  const { clients = [], isLoadingClients } = useClients();
  const { projects = [], isLoadingProjects } = useProjects();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      clientId: clientId || 0,
      projectId: projectId || 0,
      estimateNumber: "",
      issueDate: new Date(),
      expiryDate: undefined,
      terms: "Payment due within 30 days. Work to begin upon acceptance of estimate.",
      notes: "",
      status: "draft",
      subtotal: "0",
      tax: "0",
      discount: "0",
      total: "0",
    },
  });

  // Handle item field changes
  const handleItemChange = (field: keyof EstimateItemValues, value: string | number) => {
    const updatedItem = { ...newItem, [field]: value };
    
    // Auto-calculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) : Number(newItem.quantity);
      const unitPrice = field === 'unitPrice' ? Number(value) : Number(newItem.unitPrice);
      updatedItem.amount = (quantity * unitPrice).toString();
    }
    
    setNewItem(updatedItem);
  };

  // Add new item to the list
  const handleAddItem = () => {
    if (!newItem.description.trim()) {
      toast({
        title: "Missing Description",
        description: "Please enter a description for the item.",
        variant: "destructive",
      });
      return;
    }

    if (Number(newItem.quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (Number(newItem.unitPrice) < 0) {
      toast({
        title: "Invalid Price",
        description: "Unit price cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    const itemToAdd = {
      ...newItem,
      amount: (Number(newItem.quantity) * Number(newItem.unitPrice)).toString(),
    };

    setItems([...items, itemToAdd]);
    setNewItem({
      description: "",
      quantity: 1,
      unitPrice: "0",
      amount: "0",
      notes: "",
    });

    // Recalculate totals
    recalculateTotals([...items, itemToAdd]);
  };

  // Remove item from the list
  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    recalculateTotals(updatedItems);
  };

  // Recalculate totals based on items
  const recalculateTotals = (currentItems: EstimateItemValues[]) => {
    const subtotal = currentItems.reduce((sum, item) => sum + Number(item.amount), 0);
    const tax = Number(form.getValues("tax") || "0");
    const discount = Number(form.getValues("discount") || "0");
    
    const taxAmount = (subtotal * tax) / 100;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal + taxAmount - discountAmount;

    form.setValue("subtotal", subtotal.toString());
    form.setValue("total", total.toString());
  };

  // Load existing estimate data if editing
  useEffect(() => {
    if (estimateId) {
      setIsEditing(true);
      setIsLoading(true);
      const fetchEstimate = async () => {
        try {
          const response = await fetch(`/api/protected/estimates/${estimateId}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const estimate = await response.json();
            
            // Set form values
            form.reset({
              clientId: estimate.clientId,
              projectId: estimate.projectId || 0,
              estimateNumber: estimate.estimateNumber || "",
              issueDate: new Date(estimate.issueDate),
              expiryDate: estimate.expiryDate ? new Date(estimate.expiryDate) : undefined,
              terms: estimate.terms || "",
              notes: estimate.notes || "",
              status: estimate.status || "draft",
              subtotal: estimate.subtotal?.toString() || "0",
              tax: estimate.tax?.toString() || "0",
              discount: estimate.discount?.toString() || "0",
              total: estimate.total?.toString() || "0",
            });

            // Set items if they exist
            if (estimate.items && Array.isArray(estimate.items)) {
              setItems(estimate.items.map((item: any) => ({
                description: item.description || "",
                quantity: Number(item.quantity) || 1,
                unitPrice: item.unitPrice?.toString() || "0",
                amount: item.amount?.toString() || "0",
                notes: item.notes || "",
              })));
            }
          }
        } catch (error) {
          console.error('Error fetching estimate:', error);
          toast({
            title: "Error",
            description: "Failed to load estimate data.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchEstimate();
    }
  }, [estimateId, form, toast]);

  // Form submission handler
  const onSubmit = (data: EstimateFormValues) => {
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the estimate.",
        variant: "destructive",
      });
      return;
    }

    const updatedData = { ...data };
    const subtotal = parseFloat(updatedData.subtotal || "0");
    const tax = parseFloat(updatedData.tax || "0");
    const discount = parseFloat(updatedData.discount || "0");
    const total = parseFloat(updatedData.total || "0");
    
    console.log(`Creating estimate with calculated totals: Subtotal: $${subtotal}, Tax: ${tax}%, Discount: ${discount}%, Total: $${total}`);
    
    // Prepare complete estimate object with its items
    const estimateData = {
      ...updatedData,
      // Ensure numeric fields are properly formatted
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      discount: discount.toString(),
      total: total.toString(),
      // Si proyecto es 0, enviar null para evitar error de clave foránea
      projectId: updatedData.projectId === 0 ? null : updatedData.projectId,
      // If we are editing, maintain the current status, otherwise set as "draft"
      status: isEditing ? form.getValues("status") || "draft" : "draft",
      items: items.map(item => ({
        ...item,
        estimateId: isEditing && estimateId ? estimateId : 0, // Maintain relationship with the estimate if in edit mode
      })),
    };
    
    if (isEditing && estimateId) {
      // Update existing estimate
      updateEstimateMutation.mutate(
        { 
          id: estimateId, 
          data: estimateData
        }, 
        {
          onSuccess: (updatedEstimate) => {
            toast({
              title: "Estimate Updated",
              description: `Estimate ${updatedEstimate.estimateNumber} has been successfully updated.`,
            });
            
            if (onSuccess) {
              onSuccess(updatedEstimate);
            }
          }
        }
      );
    } else {
      // Create new estimate
      createEstimateMutation.mutate(estimateData, {
        onSuccess: (newEstimate) => {
          toast({
            title: "Estimate Created",
            description: `Estimate ${newEstimate.estimateNumber} has been successfully created.`,
          });
          
          if (onSuccess) {
            onSuccess(newEstimate);
          }
        }
      });
    }
  };

  // Si está cargando, mostrar indicador de carga
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading estimate data...</p>
      </div>
    );
  }

  // Debug log for clients
  console.log('EstimateForm: clients.length =', clients.length, 'isLoading =', isLoading, 'isLoadingClients =', isLoadingClients);

  // If clients are still loading, show a loading spinner
  if (!isLoading && isLoadingClients) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading clients...</p>
      </div>
    );
  }

  // If there are no clients, show a message and a Create Client button
  if (!isLoading && !isLoadingClients && clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64 gap-4">
        <p className="text-gray-500 text-lg">No clients available. Please create a client first.</p>
        <a href="/clients/create" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Create Client</a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="remodra-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold">
            {isEditing ? "Edit Estimate" : "Create New Estimate"}
          </h1>
        </div>
        <p className="text-slate-300 text-lg">
          {isEditing 
            ? "Update the estimate details and items. When finished, click 'Save & Close'." 
            : "Complete the estimate details and add the items to include."}
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="remodra-card p-6">
            {/* Main Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Client & Project Info */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="remodra-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg text-blue-900">Client Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Client selector */}
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-800 font-medium">Client*</FormLabel>
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            // Reset project value when client changes
                            form.setValue("projectId", 0);
                          }}
                          disabled={isEditing} // Disable client change in edit mode
                        >
                          <FormControl>
                            <SelectTrigger className="border-blue-200 focus:border-blue-400">
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.first_name} {client.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-blue-600">
                          Select the client for this estimate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Project selector - completely optional */}
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => {
                      // Filter projects by selected client
                      const clientId = form.watch("clientId");
                      const filteredProjects = clientId
                        ? projects.filter((p: any) => p.clientId === clientId)
                        : [];
                      
                      return (
                        <FormItem>
                          <FormLabel className="text-blue-800 font-medium">Project (Optional)</FormLabel>
                          <Select
                            value={field.value ? field.value.toString() : "0"}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            disabled={!clientId || isLoadingProjects || isEditing} // Disable in edit mode
                          >
                            <FormControl>
                              <SelectTrigger className="border-blue-200 focus:border-blue-400">
                                <SelectValue placeholder="No project - Will be created later" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">No project - Will be created later</SelectItem>
                              {filteredProjects.length > 0 && (
                                <SelectSeparator />
                              )}
                              {filteredProjects.map((project: any) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-blue-600">
                            Projects can be associated after the client accepts the estimate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </CardContent>
              </Card>

              {/* Estimate Details */}
              <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg text-green-900">Estimate Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="estimateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-green-800 font-medium">Estimate Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Automatically generated" 
                            {...field} 
                            value={field.value || ""} 
                            className="border-green-200 focus:border-green-400"
                          />
                        </FormControl>
                        <FormDescription className="text-green-600">
                          Leave blank to generate automatically
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-green-800 font-medium">Issue Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={
                                  "w-full pl-3 text-left font-normal flex items-center justify-between border-green-200 focus:border-green-400"
                                }
                              >
                                {field.value ? (
                                  format(field.value, "MM/dd/yyyy")
                                ) : (
                                  <span>Select a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setDate(new Date().getDate() - 30))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-green-800 font-medium">Expiry Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={
                                  "w-full pl-3 text-left font-normal flex items-center justify-between border-green-200 focus:border-green-400"
                                }
                              >
                                {field.value ? (
                                  format(field.value, "MM/dd/yyyy")
                                ) : (
                                  <span>Select a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Terms & Notes */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg text-purple-900">Terms & Conditions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-purple-800 font-medium">Terms</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Estimate terms..."
                            className="min-h-[120px] border-purple-200 focus:border-purple-400"
                            {...field}
                            value={field.value || ""}
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
                        <FormLabel className="text-purple-800 font-medium">Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes for the client..."
                            className="min-h-[120px] border-purple-200 focus:border-purple-400"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Center Column - Items & Totals */}
            <div className="lg:col-span-1 space-y-6">
              {/* Items Section */}
              <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-lg text-orange-900">Estimate Items</CardTitle>
                  </div>
                  <CardDescription className="text-orange-700">
                    Add the products or services that will be included in this estimate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Item Form */}
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-6">
                        <FormLabel className="text-orange-800 font-medium text-sm">Description</FormLabel>
                        <Input
                          placeholder="Item description"
                          value={newItem.description}
                          onChange={(e) => handleItemChange('description', e.target.value)}
                          className="border-orange-200 focus:border-orange-400"
                        />
                      </div>
                      <div className="col-span-2">
                        <FormLabel className="text-orange-800 font-medium text-sm">Qty</FormLabel>
                        <div className="flex items-center space-x-1">
                          <Input
                            type="number"
                            min="1"
                            value={newItem.quantity}
                            onChange={(e) => handleItemChange('quantity', e.target.value)}
                            className="w-full border-orange-200 focus:border-orange-400"
                          />
                          <div className="flex flex-col space-y-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-1 border-orange-200"
                              onClick={() => {
                                const currentQty = Number(newItem.quantity) || 1;
                                handleItemChange('quantity', Math.max(1, currentQty - 1));
                              }}
                            >
                              -
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-1 border-orange-200"
                              onClick={() => {
                                const currentQty = Number(newItem.quantity) || 1;
                                handleItemChange('quantity', currentQty + 1);
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <FormLabel className="text-orange-800 font-medium text-sm">Price</FormLabel>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newItem.unitPrice}
                          onChange={(e) => handleItemChange('unitPrice', e.target.value)}
                          className="border-orange-200 focus:border-orange-400"
                        />
                      </div>
                      <div className="col-span-1">
                        <FormLabel className="text-orange-800 font-medium text-sm">Total</FormLabel>
                        <Input
                          disabled
                          value={formatCurrency(newItem.amount)}
                          className="border-orange-200 bg-orange-50"
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        <Button
                          type="button"
                          onClick={handleAddItem}
                          size="icon"
                          className="w-full h-10 bg-orange-600 hover:bg-orange-700"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Add item</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Items Table */}
                  {items.length > 0 ? (
                    <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-orange-50">
                          <TableRow>
                            <TableHead className="text-orange-800 font-medium">Description</TableHead>
                            <TableHead className="text-orange-800 font-medium">Qty</TableHead>
                            <TableHead className="text-orange-800 font-medium">Price</TableHead>
                            <TableHead className="text-orange-800 font-medium">Total</TableHead>
                            <TableHead className="text-orange-800 font-medium">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, index) => (
                            <TableRow key={index} className="hover:bg-orange-50">
                              <TableCell className="font-medium">{item.description}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell className="font-semibold">{formatCurrency(item.amount)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(index)}
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove item</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-orange-600 bg-white rounded-lg border border-orange-200">
                      <Calculator className="h-12 w-12 mx-auto mb-3 text-orange-400" />
                      <p className="text-lg font-medium">No items added yet</p>
                      <p className="text-sm">Add items above to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Totals Section */}
              <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <CardTitle className="text-lg text-emerald-900">Estimate Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price Adjustments */}
                  <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <h4 className="font-medium text-emerald-800 mb-3">Price Adjustments</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-emerald-700 text-sm">Tax (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={field.value}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  field.onChange(value.toString());
                                  if (items.length > 0) {
                                    recalculateTotals(items);
                                  }
                                }}
                                className="border-emerald-200 focus:border-emerald-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-emerald-700 text-sm">Discount (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={field.value}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  field.onChange(value.toString());
                                  if (items.length > 0) {
                                    recalculateTotals(items);
                                  }
                                }}
                                className="border-emerald-200 focus:border-emerald-400"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                
                  {/* Totals Display */}
                  <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <h4 className="font-medium text-emerald-800 mb-3">Totals</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(form.getValues("subtotal"))}</span>
                      </div>
                      
                      {Number(form.getValues("tax")) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-600">Tax ({form.getValues("tax")}%):</span>
                          <span className="font-medium">{formatCurrency((Number(form.getValues("subtotal")) * Number(form.getValues("tax"))) / 100)}</span>
                        </div>
                      )}
                      
                      {Number(form.getValues("discount")) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-600">Discount ({form.getValues("discount")}%):</span>
                          <span className="font-medium text-red-600">-{formatCurrency((Number(form.getValues("subtotal")) * Number(form.getValues("discount"))) / 100)}</span>
                        </div>
                      )}
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between pt-2">
                        <span className="font-bold text-lg text-emerald-800">TOTAL:</span>
                        <span className="font-bold text-2xl text-emerald-900">{formatCurrency(form.getValues("total"))}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          </div>
          
          {/* Action Buttons */}
          <Card className="remodra-card">
            <CardFooter className="flex justify-between p-6">
              <Button variant="outline" type="button" onClick={onCancel} className="remodra-button-outline px-8">
                Cancel
              </Button>
              {isEditing ? (
                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={updateEstimateMutation.isPending}
                    className="remodra-button px-8"
                    onClick={() => {
                      // The form will be submitted and onSubmit will handle saving
                      // The onSuccess callback will handle closing the view
                    }}
                  >
                    {updateEstimateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save & Close
                  </Button>
                </div>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createEstimateMutation.isPending}
                  className="remodra-button px-8"
                >
                  {createEstimateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Estimate
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}