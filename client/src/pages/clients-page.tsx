import { useState, useRef } from "react";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Search, 
  Edit, 
  FileText, 
  BanknoteIcon
} from "lucide-react";
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import PageHeader from '../components/shared/page-header';

import ClientForm from '../components/clients/client-form';
import ClientDetail from '../components/clients/client-detail';
import { useClients, ClientWithProjects, ClientInput } from '../hooks/use-clients';
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, fetchWithBaseUrl } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import TopNav from '../components/layout/top-nav';

// Client interface
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  clientSince: string;
  projects: {
    title: string;
    status: "In Progress" | "Completed" | "On Hold";
    value: string;
  }[];
  notes: string;
  totalRevenue: string;
}

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWithProjects | null>(null);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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

  // Filter clients based on search query
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
    setLocation(`/estimates/create?clientId=${targetClient.id}`);
  };

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
          <PageHeader 
            title="Clients" 
            subtitle="Manage your client database"
          >
            <Button className="flex items-center" onClick={handleAddClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </PageHeader>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    // Export functionality
                    const csvContent = "data:text/csv;charset=utf-8," + 
                      "Name,Email,Phone,Address,City,State,Zip,Client Since,Total Revenue\n" +
                      clients.map(c => 
                        `"${c.firstName} ${c.lastName}","${c.email || ''}","${c.phone || ''}","${c.address || ''}","${c.city || ''}","${c.state || ''}","${c.zip || ''}","${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Unknown'}","${c.projects?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0).toLocaleString() || '0'}"`
                      ).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "clients.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}>
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    // Import functionality - for now just show an alert
                    alert('Import functionality coming soon! You can manually add clients for now.');
                  }}>
                    Import
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="" alt={`${client.firstName} ${client.lastName}`} />
                            <AvatarFallback className="bg-primary text-white">
                              {client.firstName[0]}{client.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{client.firstName} {client.lastName}</h3>
                            <p className="text-sm text-gray-500">
                              Client since {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center text-sm">
                            <Phone className="h-3.5 w-3.5 text-gray-500 mr-2" />
                            <span>{client.phone || 'No phone'}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Mail className="h-3.5 w-3.5 text-gray-500 mr-2" />
                            <span className="truncate">{client.email || 'No email'}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3.5 w-3.5 text-gray-500 mr-2" />
                            <span className="truncate">{client.address || 'No address'}, {client.city || ''}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="text-sm font-medium">Projects</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {client.projects?.map((project, index) => (
                              <Badge key={index} variant="outline" className="font-normal">
                                {project.title}
                              </Badge>
                            )) || <span className="text-gray-400 text-sm">No projects</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex border-t border-gray-100">
                        <Button 
                          variant="ghost" 
                          className="flex-1 rounded-none text-xs text-gray-500 h-10"
                          onClick={() => handleViewClientDetails(client)}
                        >
                          View Details
                        </Button>
                        <div className="w-px bg-gray-100" />
                        <Button 
                          variant="ghost" 
                          className="flex-1 rounded-none text-xs text-gray-500 h-10"
                          onClick={() => handleNewEstimate(client)}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          New Estimate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredClients.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search or create a new client
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

      {/* Client Detail Dialog */}
      <Dialog open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle>Client Details</DialogTitle>
              </DialogHeader>
              
              <div className="flex items-center mb-6">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarImage src="" alt={`${selectedClient.firstName} ${selectedClient.lastName}`} />
                  <AvatarFallback className="text-lg bg-primary text-white">
                    {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-lg font-semibold">{selectedClient.firstName} {selectedClient.lastName}</h4>
                  <p className="text-gray-600">{selectedClient.phone}</p>
                  <p className="text-gray-600">{selectedClient.email}</p>
                </div>
              </div>
              
              <Tabs defaultValue="info">
                <TabsList className="mb-4">
                  <TabsTrigger value="info">Contact Info</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Contact Information</h5>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center">
                          <MapPin className="text-gray-400 mr-2 h-4 w-4" />
                          <span>{selectedClient.address}, {selectedClient.city}, {selectedClient.state} {selectedClient.zip}</span>
                        </p>
                        <p className="flex items-center">
                          <Phone className="text-gray-400 mr-2 h-4 w-4" />
                          <span>{selectedClient.phone}</span>
                        </p>
                        <p className="flex items-center">
                          <Mail className="text-gray-400 mr-2 h-4 w-4" />
                          <span>{selectedClient.email}</span>
                        </p>
                        <p className="flex items-center">
                          <User className="text-gray-400 mr-2 h-4 w-4" />
                          <span>Client since: {selectedClient.createdAt ? new Date(selectedClient.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center justify-between">
                          <span className="text-gray-600">Projects</span>
                          <span className="font-medium">{selectedClient.projects.length}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-gray-600">Completed</span>
                          <span className="font-medium">
                            {selectedClient.projects.filter(p => p.status === "Completed").length}
                          </span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-gray-600">In Progress</span>
                          <span className="font-medium">
                            {selectedClient.projects.filter(p => p.status === "In Progress").length}
                          </span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-gray-600">Total Revenue</span>
                          <span className="font-medium">${selectedClient.projects?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0).toLocaleString() || '0'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="projects">
                  <h5 className="font-medium text-gray-900 mb-2">Projects</h5>
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                    {selectedClient.projects?.map((project, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{project.title}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {project.status}
                          </Badge>
                          <span className="text-sm font-medium">${project.budget?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    )) || <p className="text-gray-400 text-sm">No projects found</p>}
                  </div>
                </TabsContent>
                
                <TabsContent value="notes">
                  <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <p>{selectedClient.notes}</p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex space-x-3 mt-6">
                <Button className="flex items-center" onClick={handleEditClient}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </Button>
                <Button variant="outline" className="flex items-center" onClick={() => handleNewEstimate()}>
                  <FileText className="h-4 w-4 mr-2" />
                  New Estimate
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
            </>
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
            isSubmitting={isEditMode ? isUpdating : isCreating}
            onCancel={() => setIsClientFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
