import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";

// Tipos para los eventos
export interface Event {
  id: number;
  contractorId: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: "meeting" | "site-visit" | "delivery" | "estimate" | "invoice" | "other";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  clientId?: number;
  projectId?: number;
  notes?: string;
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  project?: {
    id: number;
    title: string;
  };
}

export interface EventInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: "meeting" | "site-visit" | "delivery" | "estimate" | "invoice" | "other";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  clientId?: number;
  projectId?: number;
  notes?: string;
}

export function useEvents() {
  // Obtener todos los eventos
  const getEvents = () => {
    return useQuery<Event[]>({
      queryKey: ["/api/protected/events"],
    });
  };

  // Obtener un evento específico
  const getEvent = (id: number) => {
    return useQuery<Event>({
      queryKey: ["/api/protected/events", id],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/protected/events/${id}`);
        return await res.json();
      },
      enabled: !!id,
    });
  };

  // Crear un nuevo evento
  const createEventMutation = useMutation({
    mutationFn: async (data: EventInput) => {
      const res = await apiRequest("POST", "/api/protected/events", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear el evento");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Evento creado",
        description: "El evento ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/events"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el evento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Actualizar un evento existente
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EventInput> }) => {
      const res = await apiRequest("PATCH", `/api/protected/events/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar el evento");
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Evento actualizado",
        description: "El evento ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/events", variables.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el evento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Eliminar un evento
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/protected/events/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar el evento");
      }
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/events"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el evento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Buscar eventos para el día actual
  const getTodayEvents = () => {
    const { data: events = [] } = getEvents();
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return events.filter(event => {
      const eventDate = parseISO(event.startTime);
      return eventDate >= todayStart && eventDate <= todayEnd;
    });
  };

  // Formatear un evento para la visualización
  const formatEvent = (event: Event) => {
    const startTime = parseISO(event.startTime);
    const formattedTime = format(startTime, "h:mm a");
    
    let timeColor = "bg-blue-100 text-blue-800";
    switch (event.type) {
      case "site-visit":
        timeColor = "bg-blue-100 text-blue-800";
        break;
      case "delivery":
        timeColor = "bg-green-100 text-green-800";
        break;
      case "estimate":
        timeColor = "bg-purple-100 text-purple-800";
        break;
      case "invoice":
        timeColor = "bg-yellow-100 text-yellow-800";
        break;
      case "meeting":
        timeColor = "bg-indigo-100 text-indigo-800";
        break;
      default:
        timeColor = "bg-gray-100 text-gray-800";
    }
    
    return {
      id: String(event.id),
      title: event.title,
      date: startTime,
      time: formattedTime,
      timeColor,
      location: event.location || "No especificado",
      type: event.type,
      status: event.status,
      contact: event.client ? {
        name: `${event.client.firstName} ${event.client.lastName}`,
        initials: `${event.client.firstName[0]}${event.client.lastName[0]}`,
        id: event.client.id
      } : undefined,
      clientId: event.clientId,
      projectId: event.projectId,
      description: event.description
    };
  };

  return {
    getEvents,
    getEvent,
    createEventMutation,
    updateEventMutation,
    deleteEventMutation,
    getTodayEvents,
    formatEvent
  };
}