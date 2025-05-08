import { 
  useQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/hooks/use-clients";
import { ProjectInput } from "@/components/projects/project-form";

export interface ProjectDetail extends Project {
  description: string;
  notes?: string | null;
  createdAt: Date;
}

export interface ProjectWithClient extends ProjectDetail {
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string | null;
  }
}

export const useProjects = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todos los proyectos
  const { 
    data: projects = [], 
    isLoading: isLoadingProjects,
    error: projectsError
  } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/protected/projects"],
  });

  // Obtener un proyecto específico
  const useProject = (projectId: number | null) => {
    return useQuery<ProjectDetail>({
      queryKey: ["/api/protected/projects", projectId],
      enabled: !!projectId,
    });
  };

  // Crear un proyecto
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectInput & { clientId: number }) => {
      const response = await apiRequest("POST", "/api/protected/projects", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      toast({
        title: "Proyecto creado",
        description: "El proyecto ha sido creado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el proyecto: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Actualizar un proyecto
  const updateProjectMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number, 
      data: Partial<ProjectInput & { clientId: number }> 
    }) => {
      const response = await apiRequest("PATCH", `/api/protected/projects/${id}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", data.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      toast({
        title: "Proyecto actualizado",
        description: "El proyecto ha sido actualizado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el proyecto: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Eliminar un proyecto
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/projects/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el proyecto: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    // Data
    projects,
    
    // Queries
    useProject,
    
    // Loading states
    isLoadingProjects,
    
    // Errors
    projectsError,
    
    // Mutations
    createProject: createProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate,
    
    // Mutation states
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
  };
};