import { useState } from "react";
import { 
  User, 
  Plus, 
  Search, 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";
import ClientForm from "@/components/clients/client-form";
import ClientCard from "@/components/clients/client-card";
import ClientDetail from "@/components/clients/client-detail";
import { useClients, ClientWithProjects, ClientInput } from "@/hooks/use-clients";
import { Loader2 } from "lucide-react";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWithProjects | null>(null);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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

  // Filtrar clientes basados en el criterio de búsqueda
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

  // Manejar la creación de un nuevo presupuesto para un cliente
  const handleNewEstimate = (client?: ClientWithProjects) => {
    // Aquí iría la lógica para redirigir al formulario de presupuesto con el cliente seleccionado
    // Por ahora, simplemente cerramos el diálogo de detalles
    setIsClientDetailOpen(false);
    // Y mostraríamos un mensaje o redirigir a la página de nuevo presupuesto
    console.log("Crear nuevo presupuesto para cliente:", client || selectedClient);
    // window.location.href = `/estimates/new?clientId=${client?.id || selectedClient?.id}`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="page-layout">
          <PageHeader 
            title="Clientes" 
            description="Administra tu base de datos de clientes"
            actions={
              <Button className="flex items-center" onClick={handleAddClient}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar cliente
              </Button>
            }
          />

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <SearchInput 
                  placeholder="Buscar clientes por nombre, correo o teléfono..." 
                  onSearch={setSearchQuery}
                  className="w-full sm:w-80"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Exportar
                  </Button>
                  <Button variant="outline" size="sm">
                    Importar
                  </Button>
                </div>
              </div>

              {isLoadingClients ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredClients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClients.map((client) => (
                    <ClientCard 
                      key={client.id} 
                      client={client}
                      onViewDetails={handleViewClientDetails}
                      onNewEstimate={() => handleNewEstimate(client)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron clientes</h3>
                  <p className="text-sm text-gray-500">
                    Ajusta tu búsqueda o crea un nuevo cliente
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

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
              {isEditMode ? "Editar cliente" : "Agregar nuevo cliente"}
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