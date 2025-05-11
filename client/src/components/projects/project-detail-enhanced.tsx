import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Check, Edit, FileText, Loader2, MapPin, Phone, Mail, User, 
  Trash2, Building, Calendar, FilePlus, BanknoteIcon, 
  BarChart3, X, Plus, Clock, Ban, HardHat, Brain, Share2, Shield, FileWarning
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectDetail, ProjectWithClient } from "@/hooks/use-projects";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";
import { useOpenAI } from "@/hooks/use-openai";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface ProjectDetailEnhancedProps {
  project: ProjectWithClient;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: ProjectWithClient) => void;
}

// Tipo para los ajustes de compartir información
interface SharingSettings {
  installers: boolean;
  clients: boolean;
  estimators: boolean;
}

// Tipo para materiales necesarios
interface MaterialNeeded {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

// Esquema para el formulario de sección de trabajadores
const workerSectionSchema = z.object({
  workerInstructions: z.string().optional(),
  workerNotes: z.string().optional(),
  materialsNeeded: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, "El nombre es requerido"),
      quantity: z.number().min(0, "La cantidad debe ser mayor o igual a 0"),
      unit: z.string().optional()
    })
  ).optional(),
  safetyRequirements: z.string().optional(),
});

// Esquema para el formulario de sección de IA
const aiSectionSchema = z.object({
  aiGeneratedDescription: z.string().optional(),
  aiProjectSummary: z.string().optional(),
  aiSharingSettings: z.object({
    installers: z.boolean().default(false),
    clients: z.boolean().default(true),
    estimators: z.boolean().default(true),
  }),
});

export default function ProjectDetailEnhanced({ project, isOpen, onClose, onEdit }: ProjectDetailEnhancedProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { analyzeProject } = useOpenAI();
  
  // Formulario para la sección de trabajadores
  const workerForm = useForm<z.infer<typeof workerSectionSchema>>({
    resolver: zodResolver(workerSectionSchema),
    defaultValues: {
      workerInstructions: project?.workerInstructions || "",
      workerNotes: project?.workerNotes || "",
      materialsNeeded: (project?.materialsNeeded as MaterialNeeded[] || []),
      safetyRequirements: project?.safetyRequirements || "",
    }
  });

  // Formulario para la sección de IA
  const aiForm = useForm<z.infer<typeof aiSectionSchema>>({
    resolver: zodResolver(aiSectionSchema),
    defaultValues: {
      aiGeneratedDescription: project?.aiGeneratedDescription || "",
      aiProjectSummary: project?.aiProjectSummary || "",
      aiSharingSettings: project?.aiSharingSettings as SharingSettings || {
        installers: false,
        clients: true,
        estimators: true,
      },
    }
  });

  // Actualizar valores por defecto cuando cambia el proyecto
  useEffect(() => {
    if (project) {
      workerForm.reset({
        workerInstructions: project?.workerInstructions || "",
        workerNotes: project?.workerNotes || "",
        materialsNeeded: (project?.materialsNeeded as MaterialNeeded[] || []),
        safetyRequirements: project?.safetyRequirements || "",
      });
      
      aiForm.reset({
        aiGeneratedDescription: project?.aiGeneratedDescription || "",
        aiProjectSummary: project?.aiProjectSummary || "",
        aiSharingSettings: project?.aiSharingSettings as SharingSettings || {
          installers: false,
          clients: true,
          estimators: true,
        },
      });
    }
  }, [project]);

  // Mutation para actualizar la sección de trabajadores
  const updateWorkerSectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof workerSectionSchema>) => {
      const res = await apiRequest("PATCH", `/api/protected/projects/${project.id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", project.id] });
      
      toast({
        title: "Información para trabajadores actualizada",
        description: "La sección para trabajadores se ha actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para actualizar la sección de IA
  const updateAISectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof aiSectionSchema>) => {
      const res = await apiRequest("PATCH", `/api/protected/projects/${project.id}`, {
        ...data,
        lastAiUpdate: new Date().toISOString(),
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", project.id] });
      
      toast({
        title: "Información de IA actualizada",
        description: "La sección generada por IA se ha actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Función para generar el análisis de IA
  const generateAIAnalysis = async () => {
    if (!project) return;
    
    setIsGeneratingAI(true);
    try {
      // Obtener datos relacionados
      const projectData = {
        title: project.title,
        description: project.description,
        clientName: `${project.client?.firstName} ${project.client?.lastName}`,
        budget: project.budget,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        notes: project.notes,
        // Incluir cualquier otra información relevante
      };
      
      // Llamar a la API de análisis de IA
      const analysis = await analyzeProject(projectData);
      
      // Actualizar el formulario
      aiForm.setValue('aiGeneratedDescription', analysis.description);
      aiForm.setValue('aiProjectSummary', analysis.summary);
      
      // Guardar los cambios
      const formData = aiForm.getValues();
      await updateAISectionMutation.mutateAsync({
        ...formData,
        aiGeneratedDescription: analysis.description,
        aiProjectSummary: analysis.summary,
      });
      
      toast({
        title: "Análisis de IA generado",
        description: "El análisis de IA se ha generado y guardado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error al generar análisis de IA",
        description: error instanceof Error ? error.message : "Ocurrió un error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Manejar envío del formulario de trabajadores
  const onWorkerSubmit = async (data: z.infer<typeof workerSectionSchema>) => {
    await updateWorkerSectionMutation.mutateAsync(data);
  };

  // Manejar envío del formulario de IA
  const onAISubmit = async (data: z.infer<typeof aiSectionSchema>) => {
    await updateAISectionMutation.mutateAsync(data);
  };

  // Añadir un nuevo material
  const addMaterial = () => {
    const currentMaterials = workerForm.getValues("materialsNeeded") || [];
    workerForm.setValue("materialsNeeded", [
      ...currentMaterials,
      { id: `mat-${Date.now()}`, name: "", quantity: 1, unit: "unidad" }
    ]);
  };

  // Eliminar un material
  const removeMaterial = (id: string) => {
    const currentMaterials = workerForm.getValues("materialsNeeded") || [];
    workerForm.setValue(
      "materialsNeeded",
      currentMaterials.filter(material => material.id !== id)
    );
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">
                {project.title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Cliente: {project.client?.firstName} {project.client?.lastName}
              </DialogDescription>
            </div>
            <Badge className="ml-auto">
              {project.status === 'pending' && 'Pendiente'}
              {project.status === 'in_progress' && 'En Progreso'}
              {project.status === 'on_hold' && 'En Pausa'}
              {project.status === 'completed' && 'Completado'}
              {project.status === 'cancelled' && 'Cancelado'}
            </Badge>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="px-6">
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="overview">General</TabsTrigger>
              <TabsTrigger value="workers">
                <HardHat className="h-4 w-4 mr-2" />
                Trabajadores
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Brain className="h-4 w-4 mr-2" />
                IA
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-grow px-6 py-4">
            {/* Pestaña de vista general */}
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Información del Proyecto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estado:</span>
                        <span>{project.status === 'pending' && 'Pendiente'}
                          {project.status === 'in_progress' && 'En Progreso'}
                          {project.status === 'on_hold' && 'En Pausa'}
                          {project.status === 'completed' && 'Completado'}
                          {project.status === 'cancelled' && 'Cancelado'}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fecha de inicio:</span>
                        <span>{project.startDate ? format(new Date(project.startDate), "dd/MM/yyyy") : "No definida"}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fecha de finalización:</span>
                        <span>{project.endDate ? format(new Date(project.endDate), "dd/MM/yyyy") : "No definida"}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Presupuesto:</span>
                        <span>{project.budget ? formatCurrency(project.budget) : "No definido"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Información del Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{project.client?.firstName} {project.client?.lastName}</span>
                      </div>
                      
                      {project.client?.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{project.client.email}</span>
                        </div>
                      )}
                      
                      {project.client?.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{project.client.phone}</span>
                        </div>
                      )}
                      
                      {project.client?.address && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{project.client.address}, {project.client.city} {project.client.state} {project.client.zip}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.description ? (
                    <p className="text-sm whitespace-pre-line">{project.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No hay descripción para este proyecto.</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.notes ? (
                    <p className="text-sm whitespace-pre-line">{project.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No hay notas para este proyecto.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Pestaña de Trabajadores */}
            <TabsContent value="workers" className="mt-0">
              <Form {...workerForm}>
                <form onSubmit={workerForm.handleSubmit(onWorkerSubmit)} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Información para Trabajadores</h3>
                    <Button 
                      type="submit" 
                      disabled={updateWorkerSectionMutation.isPending}
                    >
                      {updateWorkerSectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar cambios
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={workerForm.control}
                      name="workerInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instrucciones para trabajadores</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Instrucciones detalladas sobre cómo realizar el trabajo" 
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Proporciona instrucciones específicas para los trabajadores que estarán en el sitio
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel>Materiales necesarios</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                          <Plus className="h-4 w-4 mr-2" />
                          Añadir Material
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {workerForm.watch("materialsNeeded")?.map((material, index) => (
                          <div key={material.id} className="flex items-start space-x-2 border p-3 rounded-md">
                            <div className="flex-1 grid grid-cols-5 gap-2">
                              <div className="col-span-3">
                                <FormField
                                  control={workerForm.control}
                                  name={`materialsNeeded.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Nombre</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Nombre del material" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <div>
                                <FormField
                                  control={workerForm.control}
                                  name={`materialsNeeded.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Cantidad</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          {...field}
                                          onChange={(e) => {
                                            const value = e.target.value === "" ? "0" : e.target.value;
                                            field.onChange(parseFloat(value));
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <div>
                                <FormField
                                  control={workerForm.control}
                                  name={`materialsNeeded.${index}.unit`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Unidad</FormLabel>
                                      <FormControl>
                                        <Input placeholder="unidad" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-6"
                              onClick={() => removeMaterial(material.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        
                        {(!workerForm.watch("materialsNeeded") || workerForm.watch("materialsNeeded").length === 0) && (
                          <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
                            No hay materiales añadidos
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <FormField
                      control={workerForm.control}
                      name="safetyRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requisitos de seguridad</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Requisitos específicos de seguridad para este proyecto" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Incluye cualquier medida de seguridad específica que deba tomarse en cuenta
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={workerForm.control}
                      name="workerNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas adicionales para trabajadores</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Información adicional relevante para los trabajadores" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            {/* Pestaña de IA */}
            <TabsContent value="ai" className="mt-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Análisis IA del Proyecto</h3>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={generateAIAnalysis}
                    disabled={isGeneratingAI}
                  >
                    {isGeneratingAI && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Brain className="h-4 w-4 mr-2" />
                    Generar análisis IA
                  </Button>
                  
                  <Button 
                    type="submit"
                    form="ai-form"
                    disabled={updateAISectionMutation.isPending}
                  >
                    {updateAISectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar cambios
                  </Button>
                </div>
              </div>
              
              <Form {...aiForm}>
                <form id="ai-form" onSubmit={aiForm.handleSubmit(onAISubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={aiForm.control}
                      name="aiProjectSummary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resumen del Proyecto (Generado por IA)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Un resumen conciso del proyecto generado por IA" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Este resumen será utilizado para compartir información con diferentes roles
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={aiForm.control}
                      name="aiGeneratedDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción completa (Generada por IA)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Una descripción detallada del proyecto generada por IA" 
                              className="min-h-[200px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Descripción detallada que incluye todos los aspectos del proyecto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
              
              {project.lastAiUpdate && (
                <div className="mt-4 text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Última actualización: {format(new Date(project.lastAiUpdate), "dd/MM/yyyy HH:mm")}
                </div>
              )}
            </TabsContent>
            
            {/* Pestaña de Configuración de Compartir */}
            <TabsContent value="settings" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuración de Compartir Información</CardTitle>
                  <CardDescription>
                    Configura qué información se compartirá con cada rol
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...aiForm}>
                    <form onSubmit={aiForm.handleSubmit(onAISubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertTitle>Políticas de compartición</AlertTitle>
                          <AlertDescription>
                            Configura qué roles pueden acceder a la información generada por IA para este proyecto.
                            Esta configuración controla quién puede ver los resúmenes y descripciones generados automáticamente.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[300px]">Rol</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right w-[100px]">Acceso</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <HardHat className="h-4 w-4 mr-2" />
                                    Instaladores
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    No verán información de precios y presupuestos
                                  </span>
                                  {aiForm.watch("aiSharingSettings.installers") && (
                                    <Alert variant="destructive" className="mt-2 py-2">
                                      <FileWarning className="h-4 w-4" />
                                      <AlertTitle className="text-xs">Advertencia</AlertTitle>
                                      <AlertDescription className="text-xs">
                                        No se recomienda compartir información completa con instaladores
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <FormField
                                    control={aiForm.control}
                                    name="aiSharingSettings.installers"
                                    render={({ field }) => (
                                      <FormItem className="flex items-center justify-end space-x-2">
                                        <FormControl>
                                          <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                              </TableRow>
                              
                              <TableRow>
                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    Clientes
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    Verán cuotas, facturas, documentos y el proceso general
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <FormField
                                    control={aiForm.control}
                                    name="aiSharingSettings.clients"
                                    render={({ field }) => (
                                      <FormItem className="flex items-center justify-end space-x-2">
                                        <FormControl>
                                          <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                              </TableRow>
                              
                              <TableRow>
                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Vendedores/Estimadores
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    Acceso completo a toda la información del proyecto
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <FormField
                                    control={aiForm.control}
                                    name="aiSharingSettings.estimators"
                                    render={({ field }) => (
                                      <FormItem className="flex items-center justify-end space-x-2">
                                        <FormControl>
                                          <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updateAISectionMutation.isPending}
                          >
                            {updateAISectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar configuración
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            
            <Button variant="default" onClick={() => onEdit(project)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Proyecto
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}