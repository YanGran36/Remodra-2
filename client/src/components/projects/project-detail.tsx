import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Edit, FileText, Loader2, MapPin, Phone, Mail, User, Trash2, Building, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectDetail, ProjectWithClient } from "@/hooks/use-projects";
import { formatCurrency } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface ProjectDetailProps {
  project: ProjectWithClient;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: ProjectWithClient) => void;
}

export default function ProjectDetailView({ project, isOpen, onClose, onEdit }: ProjectDetailProps) {
  const [isConfirmComplete, setIsConfirmComplete] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  if (!project) return null;
  
  // Update project status mutation
  const updateProjectStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/protected/projects/${project.id}`, { 
        status 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", project.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      
      toast({
        title: "Estado actualizado",
        description: "El estado del proyecto ha sido actualizado correctamente.",
      });
      
      if (isConfirmComplete) {
        setIsConfirmComplete(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
      
      if (isConfirmComplete) {
        setIsConfirmComplete(false);
      }
    },
  });

  // Función para formatear fechas
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "No especificada";
    return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
  };

  // Obtener clase para badge según el estado del proyecto
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "completado":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
      case "en progreso":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on_hold":
      case "en espera":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Texto legible para el estado
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Completado";
      case "in_progress":
        return "En progreso";
      case "on_hold":
        return "En espera";
      case "cancelled":
        return "Cancelado";
      case "pending":
        return "Pendiente";
      default:
        return status;
    }
  };

  // Completar proyecto
  const handleCompleteProject = () => {
    if (project.status === "completed") {
      toast({
        title: "Proyecto ya completado",
        description: "Este proyecto ya se encuentra en estado completado.",
      });
      return;
    }
    
    setIsConfirmComplete(true);
  };

  // Confirmar completar proyecto
  const confirmCompleteProject = () => {
    updateProjectStatusMutation.mutate("completed");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{project.title}</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusClass(project.status)}>
                {getStatusText(project.status)}
              </Badge>
              {project.budget && (
                <Badge variant="outline">
                  {formatCurrency(Number(project.budget))}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="client">Cliente</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="space-y-4">
              {project.description && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Descripción</h3>
                  <p className="text-sm text-gray-700">{project.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Fechas</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de inicio:</span>
                      <span>{formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de finalización:</span>
                      <span>{formatDate(project.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Creado:</span>
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Financiero</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Presupuesto:</span>
                      <span>{formatCurrency(Number(project.budget) || 0)}</span>
                    </div>
                    {/* Aquí se podrían agregar más detalles financieros como costos reales, facturas, etc. */}
                  </CardContent>
                </Card>
              </div>

              {project.status !== "completed" && project.status !== "cancelled" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Acciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => onEdit(project)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar proyecto
                        </Button>
                        
                        {project.status !== "completed" && (
                          <Button 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleCompleteProject}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Marcar como completado
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {isConfirmComplete && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertTitle className="text-green-800">¿Marcar como completado?</AlertTitle>
                  <AlertDescription className="text-green-700 mt-2">
                    <p>¿Está seguro de que desea marcar este proyecto como completado? Esta acción indicará que todos los trabajos han sido finalizados y el proyecto está cerrado.</p>
                    <div className="flex gap-3 mt-3">
                      <Button 
                        onClick={confirmCompleteProject}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={updateProjectStatusMutation.isPending}
                      >
                        {updateProjectStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirmar
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsConfirmComplete(false)}
                        disabled={updateProjectStatusMutation.isPending}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="client">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Información del cliente</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">{project.client.firstName} {project.client.lastName}</span>
                  </div>
                  
                  {project.client.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{project.client.email}</span>
                    </div>
                  )}
                  
                  {/* Aquí podrían agregarse más detalles del cliente si se necesitan */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.notes ? (
                    <p className="text-sm whitespace-pre-line">{project.notes}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No hay notas para este proyecto.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-wrap gap-2 sm:space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}