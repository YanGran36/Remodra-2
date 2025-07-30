import { useState, useRef } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { ClientWithProjects } from '../../hooks/use-clients';
import { 
  Edit, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Trash2, 
  Plus, 
  Share2, 
  Copy,
  AlertCircle, 
  ExternalLink, 
  FileSignature, 
  ClipboardCheck 
} from "lucide-react";
import { formatCurrency } from '../../lib/utils';
import ProjectForm, { ProjectInput } from '../projects/project-form';
import { useProjects } from '../../hooks/use-projects';
import { Project } from '../../hooks/use-clients';
import { ProjectInsert } from "../../../../shared/schema";


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
  const { toast } = useToast();
  const portalLinkRef = useRef<HTMLInputElement>(null);
  
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
  
  // Generar la URL del portal del cliente
  const getClientPortalUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/client-portal/${client.id}`;
  };
  
  // Function to copy portal link to clipboard
  const copyPortalLink = () => {
    navigator.clipboard.writeText(getClientPortalUrl())
      .then(() => {
        toast({
          title: "Link copied",
          description: "The portal link has been copied to clipboard.",
        });
      })
      .catch(err => {
        console.error("Error copying:", err);
        toast({
          title: "Copy failed",
          description: "Could not copy link, please try again.",
          variant: "destructive",
        });
      });
  };
  
  // Función para abrir el portal del cliente en una nueva pestaña
  const openClientPortal = () => {
    window.open(getClientPortalUrl(), '_blank');
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calcular total de ingresos de todos los proyectos
  const totalRevenue = client.projects && client.projects.length > 0
    ? client.projects.reduce((total, project) => {
        const budget = typeof project.budget === 'string' 
          ? parseFloat(project.budget.replace(/[$,]/g, ''))
          : (project.budget || 0);
        return total + budget;
      }, 0)
    : 0;

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setIsDeleteDialogOpen(false);
  };
  
  // Estado y manejo para el formulario de nuevo proyecto
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { createProject, updateProject, deleteProject, isCreating, isUpdating } = useProjects();
  
  const handleAddProject = () => {
    setSelectedProject(null);
    setIsProjectFormOpen(true);
  };
  
  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsProjectFormOpen(true);
  };
  
  const handleProjectFormSubmit = (data: ProjectInput & { clientId: number }) => {
    if (selectedProject) {
      updateProject({
        id: selectedProject.id,
        data: {
          ...data,
          contractorId: 1 // Estamos usando el ID 1 para el contratista logueado
        }
      }, {
        onSuccess: () => {
          // Cerrar el formulario después de actualizar exitosamente
          setIsProjectFormOpen(false);
          setSelectedProject(null);
        }
      });
    } else {
      // Asegurarse de que el objeto tenga todos los campos requeridos
      const projectData: ProjectInsert = {
        ...data,
        contractorId: 1, // ID del contratista logueado
        status: data.status || "pending"
      };
      createProject(projectData, {
        onSuccess: () => {
          // Cerrar el formulario después de crear exitosamente
          setIsProjectFormOpen(false);
          setSelectedProject(null);
        }
      });
    }
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-xl">
      <div className="flex items-center mb-6">
        <Avatar className="h-16 w-16 mr-4">
          <AvatarFallback className="text-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900">
            {getInitials(client.firstName, client.lastName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="text-lg font-semibold text-slate-200">{client.firstName} {client.lastName}</h4>
          <p className="text-slate-400">{client.phone}</p>
          <p className="text-slate-400">{client.email}</p>
        </div>
      </div>
      
      <Tabs defaultValue="info">
        <TabsList className="mb-4 grid w-full grid-cols-4 bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-xl p-2 gap-2">
          <TabsTrigger 
            value="info" 
            className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
          >
            Contact Information
          </TabsTrigger>
          <TabsTrigger 
            value="projects" 
            className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
          >
            Projects
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
          >
            Notes
          </TabsTrigger>
          <TabsTrigger 
            value="portal" 
            className="px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:font-semibold data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-amber-400 data-[state=inactive]:hover:bg-slate-700"
          >
            Client Portal
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="remodra-card p-6">
              <h5 className="font-medium text-amber-400 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </h5>
              <div className="space-y-3 text-sm">
                {(client.address || client.city || client.state) && (
                  <p className="flex items-center">
                    <MapPin className="text-slate-400 mr-3 h-4 w-4" />
                    <span className="text-slate-200">
                      {client.address && `${client.address}, `}
                      {client.city && `${client.city}, `}
                      {client.state && client.state} 
                      {client.zip && client.zip}
                    </span>
                  </p>
                )}
                {client.phone && (
                  <p className="flex items-center">
                    <Phone className="text-slate-400 mr-3 h-4 w-4" />
                    <span className="text-slate-200">{client.phone}</span>
                  </p>
                )}
                {client.email && (
                  <p className="flex items-center">
                    <Mail className="text-slate-400 mr-3 h-4 w-4" />
                    <span className="text-slate-200">{client.email}</span>
                  </p>
                )}
                <p className="flex items-center">
                  <User className="text-slate-400 mr-3 h-4 w-4" />
                  <span className="text-slate-200">Client since: {formatDate(client.createdAt)}</span>
                </p>
              </div>
            </div>
            
            <div className="remodra-card p-6">
              <h5 className="font-medium text-amber-400 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Summary
              </h5>
              <div className="space-y-3 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">Projects</span>
                  <span className="font-medium text-slate-200">{client.projects ? client.projects.length : 0}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">Completed</span>
                  <span className="font-medium text-slate-200">
                    {client.projects ? client.projects.filter(p => 
                      p.status === "completed" || p.status === "Completed"
                    ).length : 0}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">In Progress</span>
                  <span className="font-medium text-slate-200">
                    {client.projects ? client.projects.filter(p => 
                      p.status === "in_progress" || p.status === "In Progress"
                    ).length : 0}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-400">Total Revenue</span>
                  <span className="font-medium text-slate-200">{formatCurrency(totalRevenue)}</span>
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-medium text-amber-400 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Projects
            </h5>
            <Button 
              size="sm" 
              variant="outline" 
              className="remodra-button-outline flex items-center"
              onClick={handleAddProject}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
          
          {!client.projects || client.projects.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-600 rounded-md bg-slate-800/50">
              <p className="text-slate-400">No projects for this client.</p>
              <div className="flex justify-center space-x-3 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="remodra-button-outline flex items-center"
                  onClick={handleAddProject}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="remodra-button-outline flex items-center"
                  onClick={onNewEstimate}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Estimate
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {client.projects.map((project) => (
                <div 
                  key={project.id} 
                  className="remodra-card p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border border-slate-600"
                  onClick={() => handleEditProject(project)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h6 className="font-medium text-lg text-slate-200">{project.title}</h6>
                      {project.description && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <Badge className="remodra-badge">
                      {typeof project.budget === 'number' 
                        ? formatCurrency(project.budget)
                        : (project.budget ? formatCurrency(parseFloat(project.budget.toString())) : '-')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-sm text-slate-400">
                    <div className="flex items-center">
                      <span className="capitalize text-slate-300">
                        {project.status === "in_progress" && "In Progress"}
                        {project.status === "In Progress" && "In Progress"}
                        {project.status === "completed" && "Completed"}
                        {project.status === "Completed" && "Completed"}
                        {project.status === "on_hold" && "On Hold"}
                        {project.status === "On Hold" && "On Hold"}
                        {project.status === "cancelled" && "Cancelled"}
                        {project.status === "Cancelled" && "Cancelled"}
                        {!["in_progress", "In Progress", "completed", "Completed", "on_hold", "On Hold", "cancelled", "Cancelled"].includes(project.status) && project.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      {project.startDate && (
                        <span>Start: {formatDate(project.startDate)}</span>
                      )}
                      {project.endDate && (
                        <span>End: {formatDate(project.endDate)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        

        <TabsContent value="notes" className="mt-6">
          <div className="space-y-6">
            {/* General Notes Section */}
            <div className="remodra-card p-6">
              <h5 className="font-medium text-amber-400 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                General Notes
              </h5>
              <p className="text-sm text-slate-400 mb-4">
                General information about the client, preferences, special instructions, access details, etc.
              </p>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600 text-sm">
                {client.notes ? (
                  <p className="whitespace-pre-wrap text-slate-200">{client.notes}</p>
                ) : (
                  <p className="text-slate-400 italic">No general notes for this client.</p>
                )}
              </div>
            </div>

            {/* Cancellation History Section */}
            <div className="remodra-card p-6">
              <h5 className="font-medium text-amber-400 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                Cancellation History
              </h5>
              <p className="text-sm text-slate-400 mb-4">
                Record of cancelled appointments and events with reasons for cancellation.
              </p>
              <div className="bg-orange-600/20 border border-orange-500/30 p-4 rounded-lg text-sm">
                {client.cancellationHistory ? (
                  <div className="space-y-1">
                    {client.cancellationHistory.split('\n').map((entry, index) => (
                      <p key={index} className="text-orange-300">{entry}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-400 italic">No cancellation history for this client.</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="portal">
          <div className="space-y-6">
            <h5 className="font-medium text-gray-900 mb-4">Client Portal</h5>
            
            <Card className="remodra-card">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-lg border-b border-slate-600">
                <CardTitle className="text-base flex items-center gap-2 text-amber-400">
                  <Share2 className="h-5 w-5" />
                  Share access with client
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Provide the client with the following link so they can access their personalized portal
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Input 
                    ref={portalLinkRef}
                    value={getClientPortalUrl()}
                    readOnly
                    className="remodra-input pr-20"
                  />
                  <Button variant="outline" size="sm" onClick={copyPortalLink} className="remodra-button-outline absolute right-12">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-slate-600 pt-4 bg-slate-800/50">
                <div className="text-sm text-slate-400">
                  <p className="flex items-center gap-1">
                    <ClipboardCheck className="h-4 w-4 text-green-400" />
                    <span>Access to estimates and invoices</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <FileSignature className="h-4 w-4 text-green-400" />
                    <span>Digital document signing</span>
                  </p>
                </div>
                <Button onClick={openClientPortal} className="remodra-button flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Portal
                </Button>
              </CardFooter>
            </Card>
            
            <div className="text-sm text-slate-400 p-4 border border-blue-500/30 bg-blue-600/20 rounded-lg">
              <p className="font-medium text-blue-400 mb-2">Tip:</p>
              <p>Share this link with your client so they can access their project information, view and approve estimates, sign invoices, and track their work in progress.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex space-x-3 mt-6">
        <Button className="remodra-button flex items-center" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Client
        </Button>
        <Button variant="outline" className="remodra-button-outline flex items-center" onClick={onNewEstimate}>
          <FileText className="h-4 w-4 mr-2" />
          New Estimate
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center text-red-400 hover:text-red-300 hover:bg-red-600/20 border-red-500/50"
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {client.firstName} {client.lastName}? 
              This action cannot be undone and will remove all data associated with this client.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Project Form Dialog */}
      <Dialog open={isProjectFormOpen} onOpenChange={setIsProjectFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProject ? "Edit Project" : "New Project"}
            </DialogTitle>
            <DialogDescription>
              {selectedProject 
                ? "Update the project information"
                : "Enter the details for the new project"}
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            project={selectedProject || undefined}
            clientId={client.id}
            onSubmit={handleProjectFormSubmit}
            isSubmitting={isCreating || isUpdating}
            onCancel={() => setIsProjectFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}