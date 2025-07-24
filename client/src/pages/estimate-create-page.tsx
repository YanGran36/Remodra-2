import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Loader2 } from "lucide-react";
import EstimateForm from '../components/estimates/estimate-form';
import { useProjects } from '../hooks/use-projects';
import { useClients } from '../hooks/use-clients';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

export default function EstimateCreatePage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const projectId = params.get("projectId") ? Number(params.get("projectId")) : undefined;
  const clientId = params.get("clientId") ? Number(params.get("clientId")) : undefined;
  
  const [project, setProject] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { useProject } = useProjects();
  const { useClient } = useClients();
  
  // Usando los hooks para obtener datos del proyecto y cliente
  const { data: projectData, isLoading: isLoadingProject } = useProject(projectId || null);
  
  // Extraer el clientId del proyecto si está disponible usando una aserción segura
  let projectClientId: number | undefined;
  if (projectData && typeof projectData === 'object' && projectData !== null && 'clientId' in projectData) {
    projectClientId = Number(projectData.clientId);
  }
  
  const { data: clientData, isLoading: isLoadingClient } = useClient(
    projectClientId || clientId || null
  );

  // Actualiza el estado cuando los datos estén disponibles
  useEffect(() => {
    if (projectData && !isLoadingProject) {
      setProject(projectData);
    }
    
    if (clientData && !isLoadingClient) {
      setClient(clientData);
    }
    
    // Una vez que tenemos todos los datos o confirmamos que no hay datos para cargar
    if (
      (!isLoadingProject && (projectData || !projectId)) &&
      (!isLoadingClient && (clientData || (!clientId && !projectClientId)))
    ) {
      setIsLoading(false);
    }
  }, [projectData, clientData, isLoadingProject, isLoadingClient, projectId, clientId]);

  // Manejar la creación exitosa del estimado
  const handleSuccess = (estimate: any) => {
    if (!estimate || !estimate.id) {
      setError('Failed to create estimate. Please try again or contact support.');
      setIsLoading(false);
      return;
    }
    window.location.href = `/estimates/${estimate.id}`;
  };

  // Cancelar y volver a la página anterior
  const handleCancel = () => {
    setIsLoading(false);
    window.history.back();
  };

  // Add error state
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        {error && <div className="text-red-600 ml-4">{error}</div>}
      </div>
    );
  }

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <div className="container py-8">
            {project && (
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">New estimate for project: {project.title}</h1>
                {client && (
                  <p className="text-muted-foreground">
                    Cliente: {client.firstName} {client.lastName}
                  </p>
                )}
              </div>
            )}

            {!project && client && (
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">New estimate</h1>
                <p className="text-muted-foreground">
                  Cliente: {client.firstName} {client.lastName}
                </p>
              </div>
            )}

            {!project && !client && (
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">New estimate</h1>
                <p className="text-muted-foreground mt-1">Create a new estimate. Select a client and project first.</p>
              </div>
            )}

            <EstimateForm
              projectId={projectId}
              clientId={client?.id}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}