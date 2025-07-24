import { useState, useRef } from "react";
import { 
  User, 
  Plus, 
  Search,
  Home,
  Grid3X3,
  List,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Eye,
  Edit,
  Trash2,
  FileText,
  Download,
  Upload,
  UserPlus
} from "lucide-react";
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import PageHeader from '../components/shared/page-header';

import ClientForm from '../components/clients/client-form';
import ClientCard from '../components/clients/client-card';
import ClientDetail from '../components/clients/client-detail';
import { useClients, ClientWithProjects, ClientInput } from '../hooks/use-clients';
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, fetchWithBaseUrl } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import TopNav from '../components/layout/top-nav';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWithProjects | null>(null);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    clients,
    isLoadingClients,
    createClient,
    updateClient,
    deleteClient,
    isCreating,
    isUpdating,
    isDeleting
  } = useClients();

  // Export clients mutation
  const exportClientsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchWithBaseUrl("/api/protected/data/clients/export");
      
      if (!response.ok) {
        throw new Error("Failed to export clients");
      }
      
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clients_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Client data has been exported and downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export client data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Import clients mutation
  const importClientsMutation = useMutation({
    mutationFn: async (clientsData: any[]) => {
      const response = await apiRequest("POST", "/api/protected/data/clients/import", {
        clientsData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      toast({
        title: "Import Successful",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import client data. Please check the file format.",
        variant: "destructive",
      });
    },
  });

  // Filter clients based on search criteria
  const filteredClients = clients.filter(client => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const searchQueryLower = searchQuery.toLowerCase();
    
    return fullName.includes(searchQueryLower) ||
      (client.email && client.email.toLowerCase().includes(searchQueryLower)) ||
      (client.phone && client.phone.includes(searchQuery));
  });

  // Abrir diálogo para crear un nuevo cliente
  const handleAddClient = () => {
    setSelectedClient(null);
    setIsEditMode(false);
    setIsClientFormOpen(true);
  };

  // Abrir diálogo para editar un cliente existente
  const handleEditClient = () => {
    if (!selectedClient) return;
    setIsEditMode(true);
    setIsClientDetailOpen(false);
    setIsClientFormOpen(true);
  };

  // Abrir diálogo para ver detalles de un cliente
  const handleViewClientDetails = (client: ClientWithProjects) => {
    setSelectedClient(client);
    setIsClientDetailOpen(true);
  };

  // Manejar la creación o edición de un cliente
  const handleClientFormSubmit = (data: ClientInput) => {
    if (isEditMode && selectedClient) {
      updateClient({
        id: selectedClient.id,
        data
      });
    } else {
      createClient(data);
    }
    setIsClientFormOpen(false);
  };

  // Manejar la eliminación de un cliente
  const handleDeleteClient = () => {
    if (!selectedClient) return;
    deleteClient(selectedClient.id);
    setIsClientDetailOpen(false);
  };

  // Handle creating a new estimate for a client
  const handleNewEstimate = (client?: ClientWithProjects) => {
    const targetClient = client || selectedClient;
    if (!targetClient) return;
    
    setIsClientDetailOpen(false);
    setLocation(`/estimates/create-professional?clientId=${targetClient.id}`);
  };

  // Handle export clients
  const handleExportClients = () => {
    exportClientsMutation.mutate();
  };

  // Handle import clients
  const handleImportClients = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection for import
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const clientsData = JSON.parse(e.target?.result as string);
        if (Array.isArray(clientsData)) {
          importClientsMutation.mutate(clientsData);
        } else {
          toast({
            title: "Invalid File Format",
            description: "Please select a valid JSON file with client data.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "File Parse Error",
          description: "Unable to read the selected file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
              Clients
            </h1>
            <p className="remodra-subtitle">
              Manage your client relationships with precision
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button className="remodra-button" onClick={handleAddClient}>
              <UserPlus className="h-5 w-5 mr-2" />
              Add New Client
            </Button>
            <Button className="remodra-button-outline" onClick={handleExportClients}>
              <Download className="h-5 w-5 mr-2" />
              Export Clients
            </Button>
            <Button className="remodra-button-outline" onClick={handleImportClients}>
              <Upload className="h-5 w-5 mr-2" />
              Import Clients
            </Button>
          </div>

          {/* View Mode Filter */}
          <div className="remodra-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <Select value={viewMode} onValueChange={(value: "cards" | "list") => setViewMode(value)}>
                <SelectTrigger className="remodra-input w-full lg:w-48">
                  <SelectValue placeholder="View Mode" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="list" className="text-slate-200 hover:bg-slate-700">List</SelectItem>
                  <SelectItem value="cards" className="text-slate-200 hover:bg-slate-700">Cards</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{clients.length}</div>
              <div className="remodra-stats-label">Total Clients</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{clients.filter(c => (c as any).status === 'active').length}</div>
              <div className="remodra-stats-label">Active Clients</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{clients.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length}</div>
              <div className="remodra-stats-label">New This Month</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">${clients.reduce((sum, c) => sum + ((c as any).totalRevenue || 0), 0).toLocaleString()}</div>
              <div className="remodra-stats-label">Total Revenue</div>
              <div className="remodra-stats-accent"></div>
            </div>
          </div>

          {/* Clients List */}
          <div className="remodra-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-400">Client Directory</h2>
              <Badge className="remodra-badge">
                {filteredClients.length} Clients
              </Badge>
            </div>

            {isLoadingClients ? (
              <div className="remodra-loading">
                <div className="remodra-spinner"></div>
                <p>Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="remodra-empty">
                <div className="remodra-empty-icon">👥</div>
                <div className="remodra-empty-title">No Clients Found</div>
                <div className="remodra-empty-description">
                  {searchQuery ? `No clients match "${searchQuery}"` : "Start by adding your first client"}
                </div>
                <Button className="remodra-button mt-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Client
                </Button>
              </div>
            ) : viewMode === "list" ? (
              // List View - Compact table format
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Client</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Contact</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Projects</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={(client as any).avatar} />
                              <AvatarFallback className="bg-amber-500 text-slate-900 font-bold text-xs">
                                {client.firstName?.[0]}{client.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-slate-200">
                                {client.firstName} {client.lastName}
                              </div>
                              {(client as any).company && (
                                <div className="text-xs text-slate-400">{(client as any).company}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Mail className="h-3 w-3 text-amber-400" />
                                <span className="truncate max-w-[200px]">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Phone className="h-3 w-3 text-amber-400" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-300">
                            <span className="text-amber-400 font-semibold">{client.projects?.length || 0}</span> projects
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${(client as any).status === 'active' ? 'remodra-badge' : 'remodra-badge-outline'}`}>
                            {(client as any).status || 'active'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewClientDetails(client)}
                              className="remodra-button-outline h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNewEstimate(client)}
                              className="remodra-button-outline h-8 w-8 p-0"
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedClient(client);
                                handleDeleteClient();
                              }}
                              className="border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-300 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Cards View - Grid format
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client) => (
                  <div key={client.id} className="remodra-card p-6 hover:border-amber-500/50 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={(client as any).avatar} />
                          <AvatarFallback className="bg-amber-500 text-slate-900 font-bold">
                            {client.firstName?.[0]}{client.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-slate-200 text-lg">
                            {client.firstName} {client.lastName}
                          </h3>
                          <p className="text-slate-400 text-sm">{client.email}</p>
                        </div>
                      </div>
                      <Badge className={`${(client as any).status === 'active' ? 'remodra-badge' : 'remodra-badge-outline'}`}>
                        {(client as any).status || 'active'}
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-4">
                      {client.phone && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Phone className="h-4 w-4 text-amber-400" />
                          <span className="text-sm">{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <MapPin className="h-4 w-4 text-amber-400" />
                          <span className="text-sm">{client.address}</span>
                        </div>
                      )}
                      {(client as any).company && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Building className="h-4 w-4 text-amber-400" />
                          <span className="text-sm">{(client as any).company}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                      <div className="text-sm text-slate-400">
                        <span className="text-amber-400 font-semibold">{client.projects?.length || 0}</span> projects
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewClientDetails(client)}
                          className="remodra-button-outline"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNewEstimate(client)}
                          className="remodra-button-outline"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client);
                            handleDeleteClient();
                          }}
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

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Cliente Detail Dialog */}
      <Dialog open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <ClientDetail 
              client={selectedClient}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
              onNewEstimate={() => handleNewEstimate()}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Cliente Form Dialog */}
      <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Client" : "Add New Client"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm 
            client={isEditMode && selectedClient ? {
              id: selectedClient.id,
              firstName: selectedClient.firstName,
              lastName: selectedClient.lastName,
              email: selectedClient.email,
              phone: selectedClient.phone,
              address: selectedClient.address,
              city: selectedClient.city,
              state: selectedClient.state,
              zip: selectedClient.zip,
              notes: selectedClient.notes,
              createdAt: selectedClient.createdAt
            } : undefined}
            onSubmit={handleClientFormSubmit}
            isSubmitting={isEditMode ? isUpdating : isCreating}
            onCancel={() => setIsClientFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}