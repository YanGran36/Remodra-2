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
import { UserPlus, Download, Upload, Eye, FileText, Trash2, Search } from 'lucide-react';
import ClientForm from '../components/clients/client-form';
import ClientDetail from '../components/clients/client-detail';

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  createdAt: number;
  projects?: any[];
}

interface ClientWithProjects extends Client {
  projects?: any[];
}

interface ClientInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithProjects | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/protected/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    }
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: ClientInput) => {
      const response = await fetch('/api/protected/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsClientFormOpen(false);
      toast({ title: 'Success', description: 'Client created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ClientInput }) => {
      const response = await fetch(`/api/protected/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsClientFormOpen(false);
      setIsEditMode(false);
      toast({ title: 'Success', description: 'Client updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/protected/clients/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsClientDetailOpen(false);
      toast({ title: 'Success', description: 'Client deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Filter clients based on search query
  const filteredClients = clients.filter((client: Client) =>
    client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  const handleAddClient = () => {
    setIsEditMode(false);
    setSelectedClient(null);
    setIsClientFormOpen(true);
  };

  const handleEditClient = () => {
    setIsEditMode(true);
    setIsClientFormOpen(true);
  };

  const handleViewClientDetails = (client: ClientWithProjects) => {
    setSelectedClient(client);
    setIsClientDetailOpen(true);
  };

  const handleClientFormSubmit = (data: ClientInput) => {
    if (isEditMode && selectedClient) {
      updateClientMutation.mutate({ id: selectedClient.id, data });
    } else {
      createClientMutation.mutate(data);
    }
  };

  const handleDeleteClient = () => {
    if (selectedClient) {
      deleteClientMutation.mutate(selectedClient.id);
    }
  };

  const handleNewEstimate = (client?: ClientWithProjects) => {
    window.location.href = `/estimates/create?clientId=${client?.id || selectedClient?.id}`;
  };

  const handleExportClients = () => {
    const dataStr = JSON.stringify(clients, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clients-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClients = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedClients = JSON.parse(e.target?.result as string);
          console.log('Imported clients:', importedClients);
          toast({ title: 'Success', description: 'Clients imported successfully' });
        } catch (error) {
          toast({ title: 'Error', description: 'Invalid file format', variant: 'destructive' });
        }
      };
      reader.readAsText(file);
    }
  };

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
              <h1 className="text-3xl font-bold text-amber-400 mb-2">Clients</h1>
              <p className="text-slate-400">Manage your client relationships</p>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center gap-4 mb-8">
              <Button onClick={handleAddClient} className="remodra-button">
                <UserPlus className="h-5 w-5 mr-2" />
                Add New Client
              </Button>
              <Button variant="outline" onClick={handleExportClients} className="remodra-button-outline">
                <Download className="h-5 w-5 mr-2" />
                Export Clients
              </Button>
              <Button variant="outline" onClick={handleImportClients} className="remodra-button-outline">
                <Upload className="h-5 w-5 mr-2" />
                Import Clients
              </Button>
            </div>

            {/* Search and View Mode */}
            <div className="remodra-card p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="remodra-input pl-10"
                  />
                </div>
                <Select value={viewMode} onValueChange={(value: "cards" | "list") => setViewMode(value)}>
                  <SelectTrigger className="remodra-input w-full lg:w-48">
                    <SelectValue placeholder="View Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="cards">Cards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Professional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="remodra-stats-card">
                <div className="remodra-stats-number">{clients.length}</div>
                <div className="remodra-stats-label">Total Clients</div>
                <div className="remodra-stats-accent"></div>
              </div>
              <div className="remodra-stats-card">
                <div className="remodra-stats-number">{clients.filter((c: any) => c.status === 'active').length}</div>
                <div className="remodra-stats-label">Active Clients</div>
                <div className="remodra-stats-accent"></div>
              </div>
              <div className="remodra-stats-card">
                <div className="remodra-stats-number">{clients.filter((c: any) => new Date(c.createdAt).getMonth() === new Date().getMonth()).length}</div>
                <div className="remodra-stats-label">New This Month</div>
                <div className="remodra-stats-accent"></div>
              </div>
              <div className="remodra-stats-card">
                <div className="remodra-stats-number">${clients.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0).toLocaleString()}</div>
                <div className="remodra-stats-label">Total Revenue</div>
                <div className="remodra-stats-accent"></div>
              </div>
            </div>

            {/* Professional Clients Table */}
            <div className="remodra-card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700 bg-slate-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-100">Client Directory</h2>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">{filteredClients.length} Clients</Badge>
                </div>
              </div>

              {isLoadingClients ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto"></div>
                  <p className="mt-2 text-slate-400">Loading clients...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <div className="text-xl font-semibold text-slate-200">No Clients Found</div>
                  <div className="text-slate-400 mt-2">
                    {searchQuery ? `No clients match "${searchQuery}"` : "Start by adding your first client"}
                  </div>
                  <Button className="mt-4" onClick={handleAddClient}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Client
                  </Button>
                </div>
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClients.map((client: ClientWithProjects) => (
                    <div key={client.id} className="remodra-card p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-amber-400">
                            {client.firstName} {client.lastName}
                          </h3>
                          <p className="text-slate-400 text-sm">{client.email}</p>
                          <p className="text-slate-400 text-sm">{client.phone}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-slate-300">
                          {client.address}, {client.city}, {client.state} {client.zip}
                        </p>
                        {client.notes && (
                          <p className="text-sm text-slate-400 line-clamp-2">{client.notes}</p>
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
                            className="border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {filteredClients.map((client: ClientWithProjects) => (
                    <div key={client.id} className="flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-slate-300">
                                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-slate-100 truncate">
                              {client.firstName} {client.lastName}
                            </h3>
                            <p className="text-sm text-slate-400 truncate">{client.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <div className="text-sm text-slate-400">
                          {client.phone}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewClientDetails(client)}
                            className="h-8 w-8 p-0 hover:bg-slate-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNewEstimate(client)}
                            className="h-8 w-8 p-0 hover:bg-slate-700"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedClient(client);
                              handleDeleteClient();
                            }}
                            className="h-8 w-8 p-0 hover:bg-red-900/20 text-red-400"
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

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Client Detail Dialog */}
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

      {/* Client Form Dialog */}
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
            isSubmitting={createClientMutation.isPending || updateClientMutation.isPending}
            onCancel={() => setIsClientFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}