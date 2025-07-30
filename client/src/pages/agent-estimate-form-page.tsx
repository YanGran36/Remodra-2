import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { useEstimates } from '../hooks/use-estimates';
import { Plus, Trash2, Calendar, Clock, User, FileText, Calculator, Sparkles, Loader2 } from 'lucide-react';

// Layout Components
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

const estimateItemSchema = z.object({
  serviceType: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be 0 or greater"),
  notes: z.string().optional(),
});

const estimateFormSchema = z.object({
  clientId: z.number().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "archived"]),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100),
  discount: z.number().min(0),
  items: z.array(estimateItemSchema).min(1, "At least one item is required"),
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

interface Service {
  id: number;
  name: string;
  serviceType: string;
  unit: string;
  laborRate: number;
  laborMethod: string;
}

const AgentEstimateFormPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [generatingDescription, setGeneratingDescription] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      status: "draft",
      taxRate: 0,
      discount: 0,
      items: [{ description: "", quantity: 1, unitPrice: 0, notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const taxRate = watch("taxRate");
  const discount = watch("discount");

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount - discount;

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/protected/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    }
  });

  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await fetch('/api/direct/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    }
  });

  const { createEstimateMutation } = useEstimates();

  const generateDescription = async (index: number, serviceType: string) => {
    setGeneratingDescription(index);
    try {
      const response = await fetch('/api/ai/generate-service-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          serviceName: services.find(s => s.serviceType === serviceType)?.name || serviceType,
          measurements: { quantity: items[index].quantity, unit: services.find(s => s.serviceType === serviceType)?.unit || 'unit' },
          laborRate: services.find(s => s.serviceType === serviceType)?.laborRate || 0,
          unit: services.find(s => s.serviceType === serviceType)?.unit || 'unit'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setValue(`items.${index}.description`, data.description);
      }
    } catch (error) {
      console.error('Error generating description:', error);
    } finally {
      setGeneratingDescription(null);
    }
  };

  const onSubmit = (data: EstimateFormValues) => {
    const estimateData = {
      clientId: data.clientId,
      estimateNumber: data.title,
      issueDate: new Date().toISOString().split('T')[0],
      status: data.status,
      subtotal: subtotal.toFixed(2),
      tax: taxRate.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      notes: data.notes || '',
      terms: 'Payment due within 30 days',
      items: data.items.map(item => ({
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toFixed(2),
        amount: (item.quantity * item.unitPrice).toFixed(2),
        notes: item.notes || ''
      }))
    };

    createEstimateMutation.mutate(estimateData, {
      onSuccess: () => {
        toast({
          title: "Estimate Created",
          description: "Your estimate has been created successfully.",
        });
        setLocation('/estimates');
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to create estimate. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const addItem = () => {
    append({ description: "", quantity: 1, unitPrice: 0, notes: "" });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleServiceChange = (index: number, serviceType: string) => {
    setValue(`items.${index}.serviceType`, serviceType);
    
    // Auto-fill unit price from service
    const selectedService = services.find(s => s.serviceType === serviceType);
    if (selectedService) {
      setValue(`items.${index}.unitPrice`, selectedService.laborRate);
    }
    
    // Generate AI description
    generateDescription(index, serviceType);
  };

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <main className="p-8 space-y-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
            <div className="container mx-auto max-w-6xl">
              <div className="remodra-card p-6">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="remodra-logo">
                      <Calculator className="h-6 w-6 text-slate-900" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-amber-400">Create New Estimate</h1>
                      <p className="text-slate-300">Fill out the details to create a professional estimate for your client.</p>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Client and Basic Info */}
                  <Card className="remodra-card">
                    <CardHeader>
                      <CardTitle className="text-amber-400 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Client Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="clientId" className="text-slate-300 font-medium">Client</Label>
                          <Select
                            onValueChange={(value) => setValue("clientId", parseInt(value))}
                            value={watch("clientId")?.toString() || ""}
                          >
                            <SelectTrigger className="remodra-input">
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client: any) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.firstName} {client.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.clientId && <p className="text-red-400 text-sm mt-1">{errors.clientId.message}</p>}
                        </div>

                        <div>
                          <Label htmlFor="title" className="text-slate-300 font-medium">Estimate Title</Label>
                          <Input
                            id="title"
                            type="text"
                            {...register("title")}
                            className="remodra-input"
                            placeholder="Enter estimate title"
                          />
                          {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="status" className="text-slate-300 font-medium">Status</Label>
                          <Select
                            onValueChange={(value) => setValue("status", value as any)}
                            value={watch("status")}
                          >
                            <SelectTrigger className="remodra-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Items */}
                  <Card className="remodra-card">
                    <CardHeader>
                      <CardTitle className="text-amber-400 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Estimate Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {fields.map((field, index) => (
                        <div key={field.id} className="border border-slate-600 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label className="text-slate-300 font-medium">Service Type</Label>
                              <Select
                                onValueChange={(value) => handleServiceChange(index, value)}
                                value={watch(`items.${index}.serviceType`) || ""}
                              >
                                <SelectTrigger className="remodra-input">
                                  <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {services.map((service) => (
                                    <SelectItem key={service.id} value={service.serviceType}>
                                      {service.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <Label className="text-slate-300 font-medium">Quantity</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                  className="remodra-input"
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-slate-300 font-medium">Unit Price</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                  className="remodra-input"
                                />
                              </div>
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label className="text-slate-300 font-medium">Description</Label>
                              <div className="flex gap-2">
                                <Textarea
                                  {...register(`items.${index}.description`)}
                                  className="remodra-input flex-1"
                                  placeholder="Service description"
                                  rows={3}
                                />
                                {watch(`items.${index}.serviceType`) && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => generateDescription(index, watch(`items.${index}.serviceType`))}
                                    disabled={generatingDescription === index}
                                    className="text-amber-400 hover:text-amber-300"
                                  >
                                    {generatingDescription === index ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                              {errors.items?.[index]?.description && (
                                <p className="text-red-400 text-sm mt-1">{errors.items?.[index]?.description?.message}</p>
                              )}
                            </div>
                            
                            <div>
                              <Label className="text-slate-300 font-medium">Notes</Label>
                              <Input
                                {...register(`items.${index}.notes`)}
                                className="remodra-input"
                                placeholder="Additional notes"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addItem}
                        className="remodra-button-outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Pricing & Notes */}
                  <Card className="remodra-card">
                    <CardHeader>
                      <CardTitle className="text-amber-400 flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Pricing & Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="taxRate" className="text-slate-300 font-medium">Tax Rate (%)</Label>
                          <Input
                            id="taxRate"
                            type="number"
                            step="0.01"
                            {...register("taxRate", { valueAsNumber: true })}
                            className="remodra-input"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="discount" className="text-slate-300 font-medium">Discount ($)</Label>
                          <Input
                            id="discount"
                            type="number"
                            step="0.01"
                            {...register("discount", { valueAsNumber: true })}
                            className="remodra-input"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="notes" className="text-slate-300 font-medium">General Notes</Label>
                        <Textarea
                          id="notes"
                          {...register("notes")}
                          className="remodra-input"
                          placeholder="Additional notes for this estimate"
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Totals Summary */}
                  <Card className="remodra-card">
                    <CardHeader>
                      <CardTitle className="text-amber-400">Estimate Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-slate-300">
                          <span>Subtotal:</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Tax ({taxRate}%):</span>
                          <span>${taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Discount:</span>
                          <span>-${discount.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-600 pt-3">
                          <div className="flex justify-between text-amber-400 font-bold text-lg">
                            <span>Total:</span>
                            <span>${total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation('/estimates')} 
                      className="remodra-button-outline"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="remodra-button"
                    >
                      {isSubmitting ? "Saving..." : "Save Estimate"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AgentEstimateFormPage;