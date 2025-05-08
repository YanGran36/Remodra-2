import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Loader2, ChevronLeft } from "lucide-react";
import { useEstimates } from "@/hooks/use-estimates";
import EstimateDetail from "@/components/estimates/estimate-detail";
import { Button } from "@/components/ui/button";

export default function EstimateDetailPage() {
  const [, params] = useRoute("/estimates/:id");
  const estimateId = params?.id ? parseInt(params.id) : 0;
  const [isModalOpen, setIsModalOpen] = useState(true);
  
  const { getEstimate } = useEstimates();
  const { data: estimate, isLoading, error } = getEstimate(estimateId);

  // Función para manejar el cierre del modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Usar setTimeout para esperar que la animación del modal se complete antes de navegar
    setTimeout(() => {
      window.history.back();
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/estimates">
            <Button variant="ghost" className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver a estimados
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="text-gray-600 mt-2">
            {error 
              ? `Ocurrió un error: ${error.message}` 
              : "No se pudo encontrar el estimado solicitado."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/estimates">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a estimados
          </Button>
        </Link>
        
        <h1 className="text-2xl font-bold">
          Estimado {estimate.estimateNumber || `#${estimate.id}`}
        </h1>
        
        <p className="text-gray-600 mt-2">
          Cliente: {estimate.client?.firstName} {estimate.client?.lastName}
          {estimate.project?.title && ` | Proyecto: ${estimate.project.title}`}
        </p>
      </div>
      
      <EstimateDetail 
        estimateId={estimateId} 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}