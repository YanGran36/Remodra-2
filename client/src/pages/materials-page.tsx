import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronDown, 
  Drill, 
  Plus, 
  Search, 
  FileEdit, 
  Eye, 
  Trash2,
  ShoppingBag,
  Package,
  PackageCheck,
  PackageX,
  AlertCircle,
  Filter,
  ArchiveIcon
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import PageHeader from '../components/shared/page-header';

import { Dialog, DialogContent } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import TopNav from '../components/layout/top-nav';

// Helper function to format currency
const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Helper function to get status badge style
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'in_stock':
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>;
    case 'ordered':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ordered</Badge>;
    case 'delivered':
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Delivered</Badge>;
    case 'out_of_stock':
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Out of Stock</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);

  // Fetch materials
  const { data: materials, isLoading, error } = useQuery({
    queryKey: ["/api/protected/materials"],
  });

  // Filter and sort materials
  const filteredMaterials = materials && Array.isArray(materials)
    ? materials
        .filter((material: any) => {
          // Status filter
          if (statusFilter !== "all" && material.status !== statusFilter) {
            return false;
          }
          
          // Supplier filter
          if (supplierFilter !== "all" && material.supplier !== supplierFilter) {
            return false;
          }
          
          // Search filter
          if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            return (
              material.name.toLowerCase().includes(lowerCaseQuery) ||
              (material.description && material.description.toLowerCase().includes(lowerCaseQuery)) ||
              (material.supplier && material.supplier.toLowerCase().includes(lowerCaseQuery)) ||
              (material.orderNumber && material.orderNumber.toLowerCase().includes(lowerCaseQuery))
            );
          }
          
          return true;
        })
        .sort((a: any, b: any) => {
          if (sortBy === "name_asc") {
            return a.name.localeCompare(b.name);
          } else if (sortBy === "name_desc") {
            return b.name.localeCompare(a.name);
          } else if (sortBy === "cost_desc") {
            const aCost = a.cost ? parseFloat(a.cost) : 0;
            const bCost = b.cost ? parseFloat(b.cost) : 0;
            return bCost - aCost;
          } else if (sortBy === "cost_asc") {
            const aCost = a.cost ? parseFloat(a.cost) : 0;
            const bCost = b.cost ? parseFloat(b.cost) : 0;
            return aCost - bCost;
          } else if (sortBy === "quantity_desc") {
            const aQty = a.quantity ? parseFloat(a.quantity) : 0;
            const bQty = b.quantity ? parseFloat(b.quantity) : 0;
            return bQty - aQty;
          } else if (sortBy === "quantity_asc") {
            const aQty = a.quantity ? parseFloat(a.quantity) : 0;
            const bQty = b.quantity ? parseFloat(b.quantity) : 0;
            return aQty - bQty;
          }
          return 0;
        })
    : [];

  const viewMaterialDetails = (material: any) => {
    setSelectedMaterial(material);
    setIsDetailOpen(true);
  };

  const createNewMaterial = () => {
    setEditingMaterial(null);
    setIsFormOpen(true);
  };

  const editMaterial = (material: any) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!materials || !Array.isArray(materials)) return { totalValue: 0, count: 0, ordered: 0, outOfStock: 0 };
    
    const totalValue = materials.reduce((sum: number, material: any) => {
      const cost = material.cost ? parseFloat(material.cost) : 0;
      const quantity = material.quantity ? parseFloat(material.quantity) : 0;
      return sum + (cost * quantity);
    }, 0);
    
    return {
      totalValue,
      count: materials.length,
      ordered: materials.filter((m: any) => m.status === "ordered").length,
      outOfStock: materials.filter((m: any) => m.status === "out_of_stock").length
    };
  };

  const totals = calculateTotals();

  // Get unique suppliers for filtering
  const suppliers = materials && Array.isArray(materials)
    ? Array.from(new Set(materials.map((m: any) => m.supplier).filter(Boolean)))
    : [];

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <main className="p-8 space-y-8">
          {/* Header with Remodra branding */}
          <div className="text-center mb-8">
            <div className="remodra-logo mb-6">
              <span className="remodra-logo-text">R</span>
            </div>
            <h1 className="remodra-title mb-3">
              Materials & Supplies
            </h1>
            <p className="remodra-subtitle">
              Track materials, supplies, and inventory
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button className="remodra-button" onClick={createNewMaterial}>
              <Plus className="h-5 w-5 mr-2" />
              Add Material
            </Button>
            <Button className="remodra-button-outline" onClick={() => {
              // Import functionality - for now just show an alert
              alert('Import functionality coming soon! You can manually add materials for now.');
            }}>
              <Package className="h-5 w-5 mr-2" />
              Import Materials
            </Button>
            <Button className="remodra-button-outline" onClick={() => {
              // Export functionality
              const csvContent = "data:text/csv;charset=utf-8," + 
                "Name,Description,Cost,Quantity,Supplier,Status,Order Number,Min Quantity\n" +
                (materials as any[]).map(m => 
                  `"${m.name}","${m.description || ''}","${m.cost || 0}","${m.quantity || 0}","${m.supplier || ''}","${m.status}","${m.orderNumber || ''}","${m.minQuantity || 0}"`
                ).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "materials.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>
              <ArchiveIcon className="h-5 w-5 mr-2" />
              Export Inventory
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{totals.count}</div>
              <div className="remodra-stats-label">Total Materials</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{formatCurrency(totals.totalValue)}</div>
              <div className="remodra-stats-label">Total Value</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{totals.ordered}</div>
              <div className="remodra-stats-label">On Order</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{totals.outOfStock}</div>
              <div className="remodra-stats-label">Out of Stock</div>
              <div className="remodra-stats-accent"></div>
            </div>
          </div>

          {/* Filters */}
          <div className="remodra-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
                <SelectTrigger className="remodra-input w-full lg:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">All Status</SelectItem>
                  <SelectItem value="in_stock" className="text-slate-200 hover:bg-slate-700">In Stock</SelectItem>
                  <SelectItem value="ordered" className="text-slate-200 hover:bg-slate-700">Ordered</SelectItem>
                  <SelectItem value="delivered" className="text-slate-200 hover:bg-slate-700">Delivered</SelectItem>
                  <SelectItem value="out_of_stock" className="text-slate-200 hover:bg-slate-700">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={supplierFilter} onValueChange={(value: string) => setSupplierFilter(value)}>
                <SelectTrigger className="remodra-input w-full lg:w-48">
                  <SelectValue placeholder="Filter by supplier" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">All Suppliers</SelectItem>
                  {suppliers.map((supplier: string) => (
                    <SelectItem key={supplier} value={supplier} className="text-slate-200 hover:bg-slate-700">
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: string) => setSortBy(value)}>
                <SelectTrigger className="remodra-input w-full lg:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="name_asc" className="text-slate-200 hover:bg-slate-700">Name A-Z</SelectItem>
                  <SelectItem value="name_desc" className="text-slate-200 hover:bg-slate-700">Name Z-A</SelectItem>
                  <SelectItem value="cost_desc" className="text-slate-200 hover:bg-slate-700">Highest Cost</SelectItem>
                  <SelectItem value="cost_asc" className="text-slate-200 hover:bg-slate-700">Lowest Cost</SelectItem>
                  <SelectItem value="quantity_desc" className="text-slate-200 hover:bg-slate-700">Highest Quantity</SelectItem>
                  <SelectItem value="quantity_asc" className="text-slate-200 hover:bg-slate-700">Lowest Quantity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Materials List */}
          <div className="remodra-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-400">Materials Directory</h2>
              <Badge className="remodra-badge">
                {filteredMaterials.length} Materials
              </Badge>
            </div>

            {isLoading ? (
              <div className="remodra-loading">
                <div className="remodra-spinner"></div>
                <p className="text-slate-300">Loading materials...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400">Error loading materials: {error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="remodra-empty">
                <div className="remodra-empty-icon">📦</div>
                <div className="remodra-empty-title">No Materials Found</div>
                <div className="remodra-empty-description">
                  {searchQuery ? `No materials match "${searchQuery}"` : "Start by adding your first material"}
                </div>
                <Button className="remodra-button mt-4" onClick={createNewMaterial}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Material
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMaterials.map((material: any) => (
                  <div key={material.id} className="p-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600 hover:border-amber-500/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-slate-900" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-200 text-lg">
                            {material.name}
                          </h3>
                          <p className="text-slate-400 text-sm">{material.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${
                          material.status === 'in_stock' ? 'remodra-badge' :
                          material.status === 'out_of_stock' ? 'border-red-600/50 text-red-400' :
                          'remodra-badge-outline'
                        }`}>
                          {material.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-amber-400 font-bold text-lg">
                          {formatCurrency(material.cost)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <ShoppingBag className="h-4 w-4 text-amber-400" />
                        <span className="text-sm">
                          Qty: {material.quantity || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Package className="h-4 w-4 text-amber-400" />
                        <span className="text-sm">
                          {material.supplier || 'No supplier'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <PackageCheck className="h-4 w-4 text-amber-400" />
                        <span className="text-sm">
                          {material.orderNumber || 'No order #'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                        <span className="text-sm">
                          Min: {material.minQuantity || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                      <div className="text-sm text-slate-400">
                        <span className="text-amber-400 font-semibold">{formatCurrency((material.cost || 0) * (material.quantity || 0))}</span> total value
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewMaterialDetails(material)}
                          className="remodra-button-outline"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editMaterial(material)}
                          className="remodra-button-outline"
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="remodra-button-outline"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
