import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3,
  Wrench
} from 'lucide-react';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

export default function EstimateEditPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const estimateId = id ? parseInt(id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [editedEstimate, setEditedEstimate] = useState<any>(null);

  console.log('EstimateEditPage loaded', { estimateId, id });

  // Fetch estimate data
  const { data: estimateData, error } = useQuery({
    queryKey: [`/api/protected/estimates/${estimateId}`],
    enabled: estimateId !== null && !isNaN(estimateId),
  });

  // Fetch clients for client name
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/protected/clients'],
    enabled: estimateId !== null && !isNaN(estimateId),
  });

  // Fetch available services
  const { data: services = [] } = useQuery({
    queryKey: ['/api/direct/services'],
    enabled: estimateId !== null && !isNaN(estimateId),
  });

  useEffect(() => {
    if (estimateData) {
      console.log('Estimate data received:', estimateData);
      const client = clients.find((c: any) => c.id === estimateData.client_id);
      const estimateWithClient = {
        ...estimateData,
        clientName: client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'
      };
      setEstimate(estimateWithClient);
      setEditedEstimate(estimateWithClient);
      setIsLoading(false);
    }
  }, [estimateData, clients]);

  const updateEstimateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/protected/estimates/${estimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update estimate');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Estimate Updated!",
        description: "Your estimate has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/estimates'] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (editedEstimate) {
      // Clean up the data to match the expected schema
      const cleanData = {
        ...editedEstimate,
        // Convert null values to appropriate defaults
        expiry_date: editedEstimate.expiry_date || undefined,
        appointment_date: editedEstimate.appointment_date || undefined,
        // Ensure items have proper notes field
        items: editedEstimate.items?.map((item: any) => ({
          ...item,
          notes: item.notes || ""
        }))
      };
      
      // Remove client and project objects that shouldn't be sent
      delete cleanData.client;
      delete cleanData.project;
      delete cleanData.clientName;
      
      updateEstimateMutation.mutate(cleanData);
    }
  };

  const handleCancel = () => {
    setEditedEstimate(estimate);
    setIsEditing(false);
  };

  const updateField = (field: string, value: any) => {
    if (editedEstimate) {
      setEditedEstimate({ ...editedEstimate, [field]: value });
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    if (editedEstimate && editedEstimate.items) {
      const newItems = [...editedEstimate.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Recalculate amount if quantity or unit_price changed
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
      }
      
      // Recalculate totals
      const subtotal = newItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const total = subtotal + (editedEstimate.tax || 0) - (editedEstimate.discount || 0);
      
      setEditedEstimate({
        ...editedEstimate,
        items: newItems,
        subtotal,
        total
      });
    }
  };

  const addItem = () => {
    if (editedEstimate) {
      const newItem = {
        serviceType: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        amount: 0,
        notes: ''
      };
      const newItems = [...(editedEstimate.items || []), newItem];
      setEditedEstimate({
        ...editedEstimate,
        items: newItems
      });
    }
  };



  const removeItem = (index: number) => {
    if (editedEstimate && editedEstimate.items) {
      const newItems = editedEstimate.items.filter((_: any, i: number) => i !== index);
      const subtotal = newItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const total = subtotal + (editedEstimate.tax || 0) - (editedEstimate.discount || 0);
      
      setEditedEstimate({
        ...editedEstimate,
        items: newItems,
        subtotal,
        total
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="remodra-layout">
        <Sidebar />
        <MobileSidebar />
        <div className="remodra-main">
          <TopNav />
          <div className="remodra-content">
            <main className="p-8">
              <div className="text-center">
                <h1 className="text-2xl font-semibold mb-4">Loading Estimate...</h1>
                <p>Please wait while we load the estimate details.</p>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="remodra-layout">
        <Sidebar />
        <MobileSidebar />
        <div className="remodra-main">
          <TopNav />
          <div className="remodra-content">
            <main className="p-8">
              <div className="text-center">
                <h1 className="text-2xl font-semibold mb-4 text-red-600">Error Loading Estimate</h1>
                <p className="text-red-500">Failed to load estimate. Please try again.</p>
                <button 
                  onClick={() => setLocation("/estimates")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Back to Estimates
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (!editedEstimate) {
    return (
      <div className="remodra-layout">
        <Sidebar />
        <MobileSidebar />
        <div className="remodra-main">
          <TopNav />
          <div className="remodra-content">
            <main className="p-8">
              <div className="text-center">
                <h1 className="text-2xl font-semibold mb-4">Estimate Not Found</h1>
                <p>The estimate you're looking for doesn't exist.</p>
                <button 
                  onClick={() => setLocation("/estimates")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Back to Estimates
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <main className="p-8 max-w-4xl mx-auto">


      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/estimates")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Estimates
          </Button>
          <div>
            <div className="flex justify-center mb-6">
              <img 
                src="/remodra-logo.png" 
                alt="Remodra Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight text-center">
              Estimate #{editedEstimate.estimate_number || editedEstimate.id}
            </h1>
            <p className="text-muted-foreground text-center">
              {editedEstimate.clientName || 'Unknown Client'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit Estimate
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateEstimateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateEstimateMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updateEstimateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Estimate Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">ESTIMATE</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Issue Date: {editedEstimate.issue_date ? format(new Date(editedEstimate.issue_date), 'MMM dd, yyyy') : 'Not specified'}
              </p>
              {editedEstimate.expiry_date && (
                <p className="text-sm text-muted-foreground">
                  Expires: {format(new Date(editedEstimate.expiry_date), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                editedEstimate.status === 'accepted' ? 'bg-green-100 text-green-800' :
                editedEstimate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                editedEstimate.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {(editedEstimate.status || 'draft').toUpperCase()}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Client Information */}
          <div>
            <h3 className="font-semibold mb-2">Bill To:</h3>
            <p className="text-sm">{editedEstimate.clientName || 'Unknown Client'}</p>
          </div>

          <Separator />

          {/* Items Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Items</h3>
              {isEditing && (
                <Button
                  onClick={addItem}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              )}
            </div>

            {editedEstimate.items && editedEstimate.items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Service</th>
                      <th className="text-left p-3 font-medium text-sm">Description</th>
                      <th className="text-right p-3 font-medium text-sm">Qty</th>
                      <th className="text-right p-3 font-medium text-sm">Unit Price</th>
                      <th className="text-right p-3 font-medium text-sm">Amount</th>
                      {isEditing && <th className="text-center p-3 font-medium text-sm">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {editedEstimate.items.map((item: any, index: number) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">
                          {isEditing ? (
                            <Select 
                              value={item.serviceType || ''} 
                              onValueChange={(value) => {
                                const service = services.find((s: any) => s.serviceType === value);
                                if (service) {
                                  updateItem(index, 'serviceType', value);
                                  updateItem(index, 'description', service.name);
                                  updateItem(index, 'unit_price', service.laborRate);
                                }
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Service" />
                              </SelectTrigger>
                              <SelectContent>
                                {services.map((service: any) => (
                                  <SelectItem key={service.id} value={service.serviceType}>
                                    {service.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="text-sm font-medium">
                              {item.serviceType || 'Custom'}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Textarea
                              value={item.description || ''}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="min-h-[60px] resize-none"
                              placeholder="Item description..."
                            />
                          ) : (
                            <div>
                              <div className="font-medium">{item.description || 'No description'}</div>
                              {item.notes && (
                                <div className="text-sm text-muted-foreground mt-1">{item.notes}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={item.quantity || 0}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            <span>{item.quantity || 0}</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={item.unit_price || 0}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-24 text-right"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            <span>{formatCurrency(item.unit_price || 0)}</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(item.amount || 0)}
                        </td>
                        {isEditing && (
                          <td className="p-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items in this estimate</p>
                {isEditing && (
                  <Button onClick={addItem} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(editedEstimate.subtotal || 0)}</span>
              </div>
              {isEditing ? (
                <>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="tax" className="text-sm">Tax:</Label>
                    <Input
                      id="tax"
                      type="number"
                      value={editedEstimate.tax || 0}
                      onChange={(e) => updateField('tax', parseFloat(e.target.value) || 0)}
                      className="w-24 text-right"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="discount" className="text-sm">Discount:</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={editedEstimate.discount || 0}
                      onChange={(e) => updateField('discount', parseFloat(e.target.value) || 0)}
                      className="w-24 text-right"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </>
              ) : (
                <>
                  {(editedEstimate.tax || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(editedEstimate.tax || 0)}</span>
                    </div>
                  )}
                  {(editedEstimate.discount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{formatCurrency(editedEstimate.discount || 0)}</span>
                    </div>
                  )}
                </>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(editedEstimate.total || 0)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <Separator />
          <div className="space-y-4">
            {/* Notes Section */}
            <div>
              <h4 className="font-semibold mb-2">Notes:</h4>
              {isEditing ? (
                <Textarea
                  value={editedEstimate.notes || ""}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Add notes..."
                  className="min-h-[80px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{editedEstimate.notes || "No notes"}</p>
              )}
            </div>
            
            {/* Terms and Conditions Section - Always Visible and Editable */}
            <div>
              <h4 className="font-semibold mb-2">Terms & Conditions:</h4>
              {isEditing ? (
                <Textarea
                  value={editedEstimate.terms || "Payment due within 30 days. Work to begin upon acceptance of estimate."}
                  onChange={(e) => updateField('terms', e.target.value)}
                  placeholder="Payment terms and conditions..."
                  className="min-h-[120px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{editedEstimate.terms || "Payment due within 30 days. Work to begin upon acceptance of estimate."}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</div>
</div>
  );
} 