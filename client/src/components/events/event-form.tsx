import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, addHours } from "date-fns";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents, EventInput } from "@/hooks/use-events";

// Esquema de validación para el formulario
const formSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  date: z.date(),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Ingrese una hora válida (HH:MM)"),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Ingrese una hora válida (HH:MM)"),
  location: z.string().optional(),
  type: z.enum(["meeting", "site-visit", "delivery", "estimate", "invoice", "other"]),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Interfaz para las propiedades del componente
interface EventFormProps {
  eventId?: number;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultType?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EventForm({
  eventId,
  defaultClientId,
  defaultProjectId,
  defaultType = "estimate",
  onSuccess,
  onCancel,
}: EventFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const { getEvent, createEventMutation, updateEventMutation } = useEvents();
  
  // Consultar el evento si se está editando uno existente
  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["/api/protected/events", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const response = await fetch(`/api/protected/events/${eventId}`);
      return response.json();
    },
    enabled: !!eventId,
  });
  
  // Consultar clientes
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/protected/clients"],
  });

  // Consultar proyectos
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/protected/projects"],
  });

  // Filtrar proyectos por cliente seleccionado
  const getFilteredProjects = (clientId: string) => {
    if (!clientId) return [];
    return projects.filter((project: any) => project.clientId === Number(clientId));
  };

  // Configurar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      startTime: format(new Date(), "HH:mm"),
      endTime: format(addHours(new Date(), 1), "HH:mm"),
      location: "",
      type: defaultType as any,
      status: "pending",
      clientId: defaultClientId || "",
      projectId: defaultProjectId || "",
      notes: "",
    },
  });

  // Actualizar valores del formulario cuando se carga un evento existente
  useEffect(() => {
    if (eventData && !isLoadingEvent) {
      const startDate = parseISO(eventData.startTime);
      const endDate = parseISO(eventData.endTime);
      
      form.reset({
        title: eventData.title,
        description: eventData.description || "",
        date: startDate,
        startTime: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        location: eventData.location || "",
        type: eventData.type,
        status: eventData.status,
        clientId: eventData.clientId ? String(eventData.clientId) : "",
        projectId: eventData.projectId ? String(eventData.projectId) : "",
        notes: eventData.notes || "",
      });
      
      setDate(startDate);
    }
  }, [eventData, isLoadingEvent, form]);

  // Observar cambios en el clientId para actualizar proyectos
  const watchClientId = form.watch("clientId");
  const filteredProjects = getFilteredProjects(watchClientId);

  // Manejar envío del formulario
  const onSubmit = async (values: FormValues) => {
    const { date, startTime, endTime, ...rest } = values;
    
    // Formatear fechas y horas
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    
    const startDate = new Date(date);
    startDate.setHours(startHour, startMinute, 0);
    
    const endDate = new Date(date);
    endDate.setHours(endHour, endMinute, 0);
    
    const eventData: EventInput = {
      ...rest,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      clientId: values.clientId ? Number(values.clientId) : undefined,
      projectId: values.projectId ? Number(values.projectId) : undefined,
    };
    
    if (eventId) {
      // Actualizar evento existente
      await updateEventMutation.mutateAsync({
        id: eventId,
        data: eventData,
      });
    } else {
      // Crear nuevo evento
      await createEventMutation.mutateAsync(eventData);
    }
    
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título del evento</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Visita para tomar medidas" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detalles sobre el evento" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Seleccione una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setDate(date);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora inicio</FormLabel>
                <FormControl>
                  <Input 
                    type="time" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora fin</FormLabel>
                <FormControl>
                  <Input 
                    type="time" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Dirección o lugar del evento" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de evento</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="meeting">Reunión</SelectItem>
                    <SelectItem value="site-visit">Visita al sitio</SelectItem>
                    <SelectItem value="delivery">Entrega de materiales</SelectItem>
                    <SelectItem value="estimate">Estimado</SelectItem>
                    <SelectItem value="invoice">Factura</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proyecto</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                  disabled={!watchClientId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={watchClientId ? "Seleccione un proyecto" : "Primero seleccione un cliente"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {filteredProjects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas adicionales</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Notas adicionales sobre el evento" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={createEventMutation.isPending || updateEventMutation.isPending}
          >
            {(createEventMutation.isPending || updateEventMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {eventId ? "Actualizar" : "Crear"} Evento
          </Button>
        </div>
      </form>
    </Form>
  );
}