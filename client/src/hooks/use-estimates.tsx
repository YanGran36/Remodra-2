import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '../lib/queryClient';
import { useToast } from './use-toast';

export function useEstimates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all estimates
  const {
    data: estimates,
    isLoading: isLoadingEstimates,
    error: estimatesError,
    refetch: refetchEstimates
  } = useQuery({
    queryKey: ["/api/protected/estimates"],
  });

  // Get an estimate by ID
  const getEstimate = (id: number) => {
    return useQuery({
      queryKey: ["/api/protected/estimates", id],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/protected/estimates/${id}`);
        return await res.json();
      },
      enabled: !!id,
    });
  };

  // Create a new estimate
  const createEstimateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/protected/estimates", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      toast({
        title: "Estimate created",
        description: "The estimate has been created successfully.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating estimate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update an existing estimate
  const updateEstimateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/protected/estimates/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates", data.id] });
      toast({
        title: "Estimate updated",
        description: "The estimate has been updated successfully.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating estimate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete an estimate
  const deleteEstimateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/protected/estimates/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      toast({
        title: "Estimate deleted",
        description: "The estimate has been deleted successfully.",
      });
      return id;
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting estimate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change the status of an estimate
  const updateEstimateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/protected/estimates/${id}`, { status });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates", data.id] });
      toast({
        title: "Estado actualizado",
        description: "The estimate status has been updated successfully.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convert estimate to invoice/work order
  const convertToInvoiceMutation = useMutation({
    mutationFn: async (estimateId: number) => {
      const res = await apiRequest("POST", `/api/protected/estimates/${estimateId}/convert-to-invoice`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "Work Order Created",
        description: "The estimate has been successfully converted to a work order.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Work Order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get estimates by project
  const getEstimatesByProject = (projectId: number) => {
    return useQuery({
      queryKey: ["/api/protected/projects", projectId, "estimates"],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/protected/projects/${projectId}/estimates`);
        return await res.json();
      },
      enabled: !!projectId,
    });
  };

  return {
    estimates,
    isLoadingEstimates,
    estimatesError,
    refetchEstimates,
    getEstimate,
    createEstimateMutation,
    updateEstimateMutation,
    deleteEstimateMutation,
    updateEstimateStatusMutation,
    convertToInvoiceMutation,
    getEstimatesByProject,
  };
}