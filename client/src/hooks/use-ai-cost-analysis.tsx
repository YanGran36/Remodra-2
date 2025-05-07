import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface MaterialInput {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface AiAnalysisParams {
  serviceType: string;
  materials: MaterialInput[];
  laborHours?: number;
  propertySize?: {
    squareFeet?: number;
    linearFeet?: number;
    units?: number;
  };
  location?: string;
  difficulty?: "easy" | "medium" | "complex";
  additionalInfo?: string;
}

export interface MaterialCostItem {
  name: string;
  estimatedCost: number;
  notes?: string;
}

export interface AiAnalysisResult {
  recommendedTotal: number;
  breakdown: {
    materials: {
      total: number;
      items: MaterialCostItem[];
    };
    labor: {
      total: number;
      estimatedHours: number;
      hourlyRate: number;
      notes?: string;
    };
    overhead: {
      total: number;
      percentage: number;
      notes?: string;
    };
    profit: {
      total: number;
      percentage: number;
      notes?: string;
    };
    recommendations: string[];
    competitiveAnalysis?: {
      lowRange: number;
      highRange: number;
      notes: string;
    };
    potentialIssues: string[];
  };
  summary: string;
}

export function useAiCostAnalysis() {
  const { toast } = useToast();
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Mutation para análisis de costos
  const analysisMutation = useMutation({
    mutationFn: async (params: AiAnalysisParams) => {
      const response = await apiRequest("POST", "/api/protected/ai/analyze-job-cost", params);
      return response.json() as Promise<AiAnalysisResult>;
    },
    onError: (error) => {
      toast({
        title: "Error en el análisis de costos",
        description: error.message || "No se pudo completar el análisis",
        variant: "destructive",
      });
    },
  });

  // Mutation para generar descripción
  const descriptionMutation = useMutation({
    mutationFn: async (params: AiAnalysisParams) => {
      setIsGeneratingDescription(true);
      try {
        const response = await apiRequest("POST", "/api/protected/ai/generate-job-description", params);
        const data = await response.json();
        return data.description as string;
      } finally {
        setIsGeneratingDescription(false);
      }
    },
    onError: (error) => {
      setIsGeneratingDescription(false);
      toast({
        title: "Error al generar descripción",
        description: error.message || "No se pudo generar la descripción",
        variant: "destructive",
      });
    },
  });

  return {
    analyzeJobCost: analysisMutation.mutateAsync,
    generateJobDescription: descriptionMutation.mutateAsync,
    isAnalyzing: analysisMutation.isPending,
    isGeneratingDescription,
    analysisError: analysisMutation.error,
    descriptionError: descriptionMutation.error,
  };
}