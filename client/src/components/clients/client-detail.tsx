import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientWithProjects } from "@/hooks/use-clients";
import { Edit, FileText, Phone, Mail, MapPin, User, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ClientDetailProps = {
  client: ClientWithProjects;
  onEdit: () => void;
  onDelete: () => void;
  onNewEstimate: () => void;
};

export default function ClientDetail({ 
  client, 
  onEdit, 
  onDelete, 
  onNewEstimate 
}: ClientDetailProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const getProjectStatusClass = (status: string) => {
    switch (status) {
      case "completed":
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "in_progress":
      case "In Progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "on_hold":
      case "On Hold":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "cancelled":
      case "Cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calcular total de ingresos de todos los proyectos
  const totalRevenue = client.projects.reduce((total, project) => {
    const budget = typeof project.budget === 'string' 
      ? parseFloat(project.budget.replace(/[$,]/g, ''))
      : (project.budget || 0);
    return total + budget;
  }, 0);

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setIsDeleteDialogOpen(false);
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Avatar className="h-16 w-16 mr-4">
          <AvatarFallback className="text-lg bg-primary text-white">
            {getInitials(client.firstName, client.lastName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="text-lg font-semibold">{client.firstName} {client.lastName}</h4>
          <p className="text-gray-600">{client.phone}</p>
          <p className="text-gray-600">{client.email}</p>
        </div>
      </div>
      
      <Tabs defaultValue="info">
        <TabsList className="mb-4">
          <TabsTrigger value="info">Información de contacto</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Información de contacto</h5>
              <div className="space-y-2 text-sm">
                {(client.address || client.city || client.state) && (
                  <p className="flex items-center">
                    <MapPin className="text-gray-400 mr-2 h-4 w-4" />
                    <span>
                      {client.address && `${client.address}, `}
                      {client.city && `${client.city}, `}
                      {client.state && client.state} 
                      {client.zip && client.zip}
                    </span>
                  </p>
                )}
                {client.phone && (
                  <p className="flex items-center">
                    <Phone className="text-gray-400 mr-2 h-4 w-4" />
                    <span>{client.phone}</span>
                  </p>
                )}
                {client.email && (
                  <p className="flex items-center">
                    <Mail className="text-gray-400 mr-2 h-4 w-4" />
                    <span>{client.email}</span>
                  </p>
                )}
                <p className="flex items-center">
                  <User className="text-gray-400 mr-2 h-4 w-4" />
                  <span>Cliente desde: {formatDate(client.createdAt)}</span>
                </p>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Resumen</h5>
              <div className="space-y-2 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">Proyectos</span>
                  <span className="font-medium">{client.projects.length}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">Completados</span>
                  <span className="font-medium">
                    {client.projects.filter(p => 
                      p.status === "completed" || p.status === "Completed"
                    ).length}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">En progreso</span>
                  <span className="font-medium">
                    {client.projects.filter(p => 
                      p.status === "in_progress" || p.status === "In Progress"
                    ).length}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">Ingresos totales</span>
                  <span className="font-medium">{formatCurrency(totalRevenue)}</span>
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="projects">
          <h5 className="font-medium text-gray-900 mb-2">Proyectos</h5>
          {client.projects.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-md">
              <p className="text-gray-500">No hay proyectos para este cliente.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={onNewEstimate}
              >
                <FileText className="h-4 w-4 mr-2" />
                Crear nuevo presupuesto
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
              {client.projects.map((project) => (
                <div key={project.id} className="p-3 flex justify-between items-center">
                  <div>
                    <h6 className="font-medium">{project.title}</h6>
                    <p className="text-sm text-gray-600">
                      {project.status === "in_progress" && "En progreso"}
                      {project.status === "In Progress" && "En progreso"}
                      {project.status === "completed" && "Completado"}
                      {project.status === "Completed" && "Completado"}
                      {project.status === "on_hold" && "En espera"}
                      {project.status === "On Hold" && "En espera"}
                      {project.status === "cancelled" && "Cancelado"}
                      {project.status === "Cancelled" && "Cancelado"}
                      {!["in_progress", "In Progress", "completed", "Completed", "on_hold", "On Hold", "cancelled", "Cancelled"].includes(project.status) && project.status}
                    </p>
                  </div>
                  <Badge className={getProjectStatusClass(project.status)}>
                    {typeof project.budget === 'number' 
                      ? formatCurrency(project.budget)
                      : project.budget}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="notes">
          <h5 className="font-medium text-gray-900 mb-2">Notas</h5>
          <div className="bg-gray-50 p-3 rounded-md text-sm">
            {client.notes ? (
              <p>{client.notes}</p>
            ) : (
              <p className="text-gray-500 italic">No hay notas para este cliente.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex space-x-3 mt-6">
        <Button className="flex items-center" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar cliente
        </Button>
        <Button variant="outline" className="flex items-center" onClick={onNewEstimate}>
          <FileText className="h-4 w-4 mr-2" />
          Nuevo presupuesto
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center text-red-600 hover:text-red-600 hover:bg-red-50"
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a {client.firstName} {client.lastName}? 
              Esta acción no se puede deshacer y eliminará todos los datos asociados a este cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}