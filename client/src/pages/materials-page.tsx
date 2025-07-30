import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Package, Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { Label } from '../components/ui/label';

interface Material {
  id: number;
  name: string;
  description: string;
  category: string;
  unit: string;
  unitPrice: number;
  supplier: string;
  supplierContact: string;
  minStock: number;
  currentStock: number;
  location: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

interface MaterialInput {
  name: string;
  description: string;
  category: string;
  unit: string;
  unitPrice: number;
  supplier: string;
  supplierContact: string;
  minStock: number;
  currentStock: number;
  location: string;
  notes: string;
}

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isMaterialFormOpen, setIsMaterialFormOpen] = useState(false);
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch materials
  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const response = await fetch('/api/protected/materials');
      if (!response.ok) throw new Error('Failed to fetch materials');
      return response.json();
    }
  });

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: async (data: MaterialInput) => {
      const response = await fetch('/api/protected/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create material');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsMaterialFormOpen(false);
      toast({ title: 'Success', description: 'Material created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MaterialInput }) => {
      const response = await fetch(`/api/protected/materials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update material');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsMaterialFormOpen(false);
      setIsEditMode(false);
      toast({ title: 'Success', description: 'Material updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/protected/materials/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete material');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsMaterialDetailOpen(false);
      toast({ title: 'Success', description: 'Material deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Filter materials based on search query and category
  const filteredMaterials = materials.filter((material: Material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(materials.map((m: Material) => m.category)));

  const handleAddMaterial = () => {
    setIsEditMode(false);
    setSelectedMaterial(null);
    setIsMaterialFormOpen(true);
  };

  const handleEditMaterial = () => {
    setIsEditMode(true);
    setIsMaterialFormOpen(true);
  };

  const handleViewMaterialDetails = (material: Material) => {
    setSelectedMaterial(material);
    setIsMaterialDetailOpen(true);
  };

  const handleMaterialFormSubmit = (data: MaterialInput) => {
    if (isEditMode && selectedMaterial) {
      updateMaterialMutation.mutate({ id: selectedMaterial.id, data });
    } else {
      createMaterialMutation.mutate(data);
    }
  };

  const handleDeleteMaterial = () => {
    if (selectedMaterial) {
      deleteMaterialMutation.mutate(selectedMaterial.id);
    }
  };

  // Calculate inventory value
  const totalInventoryValue = materials.reduce((sum: number, material: Material) => 
    sum + (material.currentStock * material.unitPrice), 0
  );

  // Calculate low stock items
  const lowStockItems = materials.filter((material: Material) => 
    material.currentStock <= material.minStock
  );

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <main className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img 
                  src="/remodra-logo.png" 
                  alt="Remodra Logo" 
                  className="h-16 w-16 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-amber-400 mb-2">Materials Inventory</h1>
              <p className="text-slate-400">Manage your construction materials and supplies</p>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center gap-4 mb-8">
              <Button onClick={handleAddMaterial}>
                <Plus className="h-5 w-5 mr-2" />
                Add New Material
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800 p-6 rounded-lg">
                <div className="text-2xl font-bold text-amber-400">{materials.length}</div>
                <div className="text-slate-400">Total Materials</div>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg">
                <div className="text-2xl font-bold text-amber-400">${totalInventoryValue.toLocaleString()}</div>
                <div className="text-slate-400">Total Inventory Value</div>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{lowStockItems.length}</div>
                <div className="text-slate-400">Low Stock Items</div>
              </div>
              <div className="bg-slate-800 p-6 rounded-lg">
                <div className="text-2xl font-bold text-amber-400">{categories.length}</div>
                <div className="text-slate-400">Categories</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search materials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Materials List */}
            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-amber-400">Materials Directory</h2>
                <Badge className="remodra-badge">{filteredMaterials.length} Materials</Badge>
              </div>

              {isLoadingMaterials ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto"></div>
                  <p className="mt-2 text-slate-400">Loading materials...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📦</div>
                  <div className="text-xl font-semibold text-slate-200">No Materials Found</div>
                  <div className="text-slate-400 mt-2">
                    {searchQuery || categoryFilter !== 'all' ? 'No materials match your filters' : "Start by adding your first material"}
                  </div>
                  <Button className="mt-4" onClick={handleAddMaterial}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Material
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaterials.map((material: Material) => (
                        <TableRow key={material.id}>
                          <TableCell>
                            <div>
                              <div className="font-semibold text-amber-400">{material.name}</div>
                              <div className="text-sm text-slate-400">{material.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{material.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={material.currentStock <= material.minStock ? 'text-red-400' : 'text-green-400'}>
                                {material.currentStock} {material.unit}
                              </span>
                              {material.currentStock <= material.minStock && (
                                <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>${material.unitPrice.toFixed(2)}</TableCell>
                          <TableCell>${(material.currentStock * material.unitPrice).toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{material.supplier}</div>
                              <div className="text-slate-400">{material.supplierContact}</div>
                            </div>
                          </TableCell>
                          <TableCell>{material.location}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewMaterialDetails(material)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMaterial(material);
                                  handleEditMaterial();
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMaterial(material);
                                  handleDeleteMaterial();
                                }}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Material Detail Dialog */}
      <Dialog open={isMaterialDetailOpen} onOpenChange={setIsMaterialDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMaterial && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {selectedMaterial.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                                 <div>
                   <Label className="text-sm font-medium text-slate-400">Description</Label>
                   <p className="text-slate-200">{selectedMaterial.description || 'No description'}</p>
                 </div>
                <div>
                  <Label className="text-sm font-medium text-slate-400">Category</Label>
                  <Badge variant="outline">{selectedMaterial.category}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-400">Current Stock</Label>
                  <p className="text-slate-200">{selectedMaterial.currentStock} {selectedMaterial.unit}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-400">Minimum Stock</Label>
                  <p className="text-slate-200">{selectedMaterial.minStock} {selectedMaterial.unit}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-400">Unit Price</Label>
                  <p className="text-slate-200">${selectedMaterial.unitPrice.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-400">Total Value</Label>
                  <p className="text-amber-400 font-semibold">
                    ${(selectedMaterial.currentStock * selectedMaterial.unitPrice).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-400">Supplier</Label>
                  <p className="text-slate-200">{selectedMaterial.supplier}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-400">Supplier Contact</Label>
                  <p className="text-slate-200">{selectedMaterial.supplierContact}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-slate-400">Location</Label>
                  <p className="text-slate-200">{selectedMaterial.location}</p>
                </div>
                {selectedMaterial.notes && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-slate-400">Notes</Label>
                    <p className="text-slate-200">{selectedMaterial.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-600">
                <Button variant="outline" onClick={() => setIsMaterialDetailOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleEditMaterial}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Material
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Material Form Dialog */}
      <Dialog open={isMaterialFormOpen} onOpenChange={setIsMaterialFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Material" : "Add New Material"}
            </DialogTitle>
          </DialogHeader>
          <MaterialForm 
            material={isEditMode && selectedMaterial ? selectedMaterial : undefined}
            onSubmit={handleMaterialFormSubmit}
            isSubmitting={createMaterialMutation.isPending || updateMaterialMutation.isPending}
            onCancel={() => setIsMaterialFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Material Form Component
function MaterialForm({ 
  material, 
  onSubmit, 
  isSubmitting, 
  onCancel 
}: { 
  material?: Material; 
  onSubmit: (data: MaterialInput) => void; 
  isSubmitting: boolean; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState<MaterialInput>({
    name: material?.name || '',
    description: material?.description || '',
    category: material?.category || '',
    unit: material?.unit || '',
    unitPrice: material?.unitPrice || 0,
    supplier: material?.supplier || '',
    supplierContact: material?.supplierContact || '',
    minStock: material?.minStock || 0,
    currentStock: material?.currentStock || 0,
    location: material?.location || '',
    notes: material?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-slate-300 font-medium mb-2">Material Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="remodra-input"
          />
        </div>
        <div>
          <Label htmlFor="category" className="text-slate-300 font-medium mb-2">Category *</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            className="remodra-input"
          />
        </div>
        <div>
          <Label htmlFor="unit" className="text-slate-300 font-medium mb-2">Unit *</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="e.g., pieces, kg, m²"
            required
            className="remodra-input"
          />
        </div>
        <div>
          <Label htmlFor="unitPrice" className="text-slate-300 font-medium mb-2">Unit Price *</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
            required
            className="remodra-input"
          />
        </div>
        <div>
          <Label htmlFor="currentStock" className="text-slate-300 font-medium mb-2">Current Stock *</Label>
          <Input
            id="currentStock"
            type="number"
            value={formData.currentStock}
            onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
            required
            className="remodra-input"
          />
        </div>
        <div>
          <Label htmlFor="minStock">Minimum Stock *</Label>
          <Input
            id="minStock"
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="supplier">Supplier *</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="supplierContact">Supplier Contact</Label>
          <Input
            id="supplierContact"
            value={formData.supplierContact}
            onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="location">Storage Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-600">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : (material ? "Update Material" : "Create Material")}
        </Button>
      </div>
    </form>
  );
} 