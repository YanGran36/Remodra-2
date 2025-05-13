import { useState, useEffect } from "react";
import { useAiCostAnalysis, AiAnalysisParams, AiAnalysisResult } from "@/hooks/use-ai-cost-analysis";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertCircle, 
  ArrowRight, 
  BarChart3,
  CheckCircle2, 
  ChevronsUpDown, 
  DollarSign, 
  FileText, 
  Lightbulb, 
  Loader2, 
  Package,
  PieChart, 
  ShoppingCart, 
  Triangle, 
  Wrench
} from "lucide-react";

interface CostAnalysisAssistantProps {
  initialParams?: Partial<AiAnalysisParams>;
  onAnalysisComplete?: (result: AiAnalysisResult) => void;
  onDescriptionGenerated?: (description: string) => void;
}

export default function CostAnalysisAssistant({
  initialParams,
  onAnalysisComplete,
  onDescriptionGenerated
}: CostAnalysisAssistantProps) {
  const { toast } = useToast();
  const [params, setParams] = useState<AiAnalysisParams>({
    serviceType: initialParams?.serviceType || "",
    materials: initialParams?.materials || [],
    laborHours: initialParams?.laborHours,
    propertySize: initialParams?.propertySize || {},
    location: initialParams?.location || "",
    difficulty: initialParams?.difficulty || "medium",
    additionalInfo: initialParams?.additionalInfo || ""
  });

  const [currentMaterial, setCurrentMaterial] = useState({
    name: "",
    quantity: 1,
    unit: "unidad",
    unitPrice: 0
  });

  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [activeTab, setActiveTab] = useState("analysis");

  const { 
    analyzeJobCost, 
    generateJobDescription, 
    isAnalyzing, 
    isGeneratingDescription,
    analysisError,
    descriptionError
  } = useAiCostAnalysis();

  // Función para agregar un material
  const addMaterial = () => {
    if (!currentMaterial.name || currentMaterial.quantity <= 0 || currentMaterial.unitPrice <= 0) {
      return;
    }
    
    setParams(prev => ({
      ...prev,
      materials: [...prev.materials, { ...currentMaterial }]
    }));
    
    // Reiniciar el formulario de material
    setCurrentMaterial({
      name: "",
      quantity: 1,
      unit: "unidad",
      unitPrice: 0
    });
  };

  // Eliminar un material
  const removeMaterial = (index: number) => {
    setParams(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  // Realizar el análisis
  const runAnalysis = async () => {
    try {
      // Validar que se haya agregado al menos un material
      if (params.materials.length === 0) {
        toast({
          title: "Error en el análisis de costos",
          description: "Debe agregar al menos un material",
          variant: "destructive"
        });
        return;
      }
      
      // Validar que se haya seleccionado un tipo de servicio
      if (!params.serviceType) {
        toast({
          title: "Error en el análisis de costos",
          description: "Debe seleccionar un tipo de servicio",
          variant: "destructive"
        });
        return;
      }

      const result = await analyzeJobCost(params);
      setAnalysisResult(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
      
      // Mostrar feedback positivo
      toast({
        title: "Análisis completado",
        description: "Se ha generado el análisis de costos exitosamente"
      });
    } catch (error) {
      console.error("Error en el análisis:", error);
      toast({
        title: "Error en el análisis de costos",
        description: "Ocurrió un error al procesar la solicitud. Intente nuevamente.",
        variant: "destructive"
      });
    }
  };

  // Generar descripción del trabajo
  const generateDescription = async () => {
    try {
      // Validar que se haya agregado al menos un material
      if (params.materials.length === 0) {
        toast({
          title: "Error al generar descripción",
          description: "Debe agregar al menos un material",
          variant: "destructive"
        });
        return;
      }
      
      // Validar que se haya seleccionado un tipo de servicio
      if (!params.serviceType) {
        toast({
          title: "Error al generar descripción",
          description: "Debe seleccionar un tipo de servicio",
          variant: "destructive"
        });
        return;
      }

      // Mostrar análisis automáticamente si no existe
      if (!analysisResult) {
        try {
          const result = await analyzeJobCost(params);
          setAnalysisResult(result);
          if (onAnalysisComplete) {
            onAnalysisComplete(result);
          }
        } catch (analyzeError) {
          console.error("Error en el análisis previo:", analyzeError);
          // Continuar con la generación de descripción incluso si el análisis falla
        }
      }

      const description = await generateJobDescription(params);
      setJobDescription(description);
      if (onDescriptionGenerated) {
        onDescriptionGenerated(description);
      }
      
      // Ir automáticamente a la pestaña de descripción
      setActiveTab("description");
      
      // Mostrar feedback positivo
      toast({
        title: "Descripción generada",
        description: "Se ha creado la descripción del trabajo exitosamente"
      });
    } catch (error) {
      console.error("Error al generar descripción:", error);
      toast({
        title: "Error al generar descripción",
        description: "Ocurrió un error al procesar la solicitud. Intente nuevamente.",
        variant: "destructive"
      });
    }
  };

  // Formatear número como moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calcular el subtotal de materiales
  const materialSubtotal = params.materials.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice), 
    0
  );

  return (
    <Card className="w-full shadow-md border-t-4 border-primary/60">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="flex items-center text-lg md:text-xl">
          <PieChart className="w-6 h-6 mr-2 text-primary" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold">
            Asistente de Análisis de Costos con IA
          </span>
        </CardTitle>
        <CardDescription className="text-base">
          Ingresa los detalles del proyecto para recibir un análisis de costos y recomendaciones basadas en inteligencia artificial
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 pt-2">
          <TabsList className="w-full grid grid-cols-3 p-1 rounded-lg bg-muted/50">
            <TabsTrigger value="analysis" className="flex items-center justify-center rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/80 data-[state=active]:to-secondary/80 data-[state=active]:text-white">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Datos del Proyecto
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center justify-center rounded-md" disabled={!analysisResult}>
              <PieChart className="w-4 h-4 mr-2" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="description" className="flex items-center justify-center rounded-md" disabled={!jobDescription}>
              <FileText className="w-4 h-4 mr-2" />
              Descripción
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="analysis" className="m-0">
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de servicio */}
              <div className="space-y-2">
                <Label htmlFor="serviceType">Tipo de Servicio*</Label>
                <Select 
                  value={params.serviceType} 
                  onValueChange={(value) => setParams(prev => ({ ...prev, serviceType: value }))}
                >
                  <SelectTrigger id="serviceType">
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deck">Construcción de Deck</SelectItem>
                    <SelectItem value="fence">Cercado / Valla</SelectItem>
                    <SelectItem value="roof">Techado</SelectItem>
                    <SelectItem value="siding">Revestimiento exterior</SelectItem>
                    <SelectItem value="windows">Ventanas</SelectItem>
                    <SelectItem value="gutters">Canaletas</SelectItem>
                    <SelectItem value="painting">Pintura</SelectItem>
                    <SelectItem value="flooring">Pisos</SelectItem>
                    <SelectItem value="plumbing">Plomería</SelectItem>
                    <SelectItem value="electrical">Electricidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Horas de trabajo estimadas */}
              <div className="space-y-2">
                <Label htmlFor="laborHours">Horas de Trabajo Estimadas</Label>
                <Input 
                  id="laborHours" 
                  type="number"
                  min="0"
                  value={params.laborHours || ''}
                  onChange={(e) => setParams(prev => ({ 
                    ...prev, 
                    laborHours: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tamaño propiedad: pies cuadrados */}
              <div className="space-y-2">
                <Label htmlFor="squareFeet">Pies Cuadrados</Label>
                <Input 
                  id="squareFeet" 
                  type="number"
                  min="0"
                  value={params.propertySize?.squareFeet || ''}
                  onChange={(e) => setParams(prev => ({ 
                    ...prev, 
                    propertySize: {
                      ...prev.propertySize,
                      squareFeet: e.target.value ? Number(e.target.value) : undefined
                    }
                  }))}
                />
              </div>
              
              {/* Tamaño propiedad: pies lineales */}
              <div className="space-y-2">
                <Label htmlFor="linearFeet">Pies Lineales</Label>
                <Input 
                  id="linearFeet" 
                  type="number"
                  min="0"
                  value={params.propertySize?.linearFeet || ''}
                  onChange={(e) => setParams(prev => ({ 
                    ...prev, 
                    propertySize: {
                      ...prev.propertySize,
                      linearFeet: e.target.value ? Number(e.target.value) : undefined
                    }
                  }))}
                />
              </div>
              
              {/* Tamaño propiedad: unidades */}
              <div className="space-y-2">
                <Label htmlFor="units">Unidades</Label>
                <Input 
                  id="units" 
                  type="number"
                  min="0"
                  value={params.propertySize?.units || ''}
                  onChange={(e) => setParams(prev => ({ 
                    ...prev, 
                    propertySize: {
                      ...prev.propertySize,
                      units: e.target.value ? Number(e.target.value) : undefined
                    }
                  }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ubicación */}
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input 
                  id="location" 
                  placeholder="Ciudad o región"
                  value={params.location || ''}
                  onChange={(e) => setParams(prev => ({ 
                    ...prev, 
                    location: e.target.value 
                  }))}
                />
              </div>
              
              {/* Dificultad */}
              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificultad del Trabajo</Label>
                <Select 
                  value={params.difficulty || 'medium'} 
                  onValueChange={(value: "easy" | "medium" | "complex") => 
                    setParams(prev => ({ ...prev, difficulty: value }))
                  }
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Nivel de dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Medio</SelectItem>
                    <SelectItem value="complex">Complejo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Información adicional */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Información Adicional</Label>
              <Textarea 
                id="additionalInfo" 
                placeholder="Detalles específicos del proyecto..."
                value={params.additionalInfo || ''}
                onChange={(e) => setParams(prev => ({ 
                  ...prev, 
                  additionalInfo: e.target.value 
                }))}
                rows={3}
              />
            </div>
            
            <Separator className="my-4" />
            
            {/* Sección de materiales */}
            <div>
              <h3 className="text-base font-medium mb-2 flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Materiales*
              </h3>
              
              {/* Lista de materiales agregados */}
              {params.materials.length > 0 && (
                <div className="border rounded-md p-3 mb-4 bg-muted/40">
                  <div className="text-sm font-medium mb-2 text-muted-foreground flex justify-between">
                    <span>Material</span>
                    <span>Cantidad</span>
                    <span>Precio</span>
                    <span>Total</span>
                    <span></span>
                  </div>
                  <div className="space-y-2">
                    {params.materials.map((material, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="w-1/4 truncate">{material.name}</span>
                        <span className="w-1/5 text-center">{material.quantity} {material.unit}</span>
                        <span className="w-1/5 text-center">{formatCurrency(material.unitPrice)}</span>
                        <span className="w-1/5 text-center">{formatCurrency(material.quantity * material.unitPrice)}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => removeMaterial(index)}
                        >
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center border-t pt-2 mt-2">
                      <span className="font-medium">Subtotal Materiales:</span>
                      <span className="font-medium">{formatCurrency(materialSubtotal)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Formulario para agregar materiales */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2">
                <div className="md:col-span-2">
                  <Input 
                    placeholder="Nombre del material"
                    value={currentMaterial.name}
                    onChange={(e) => setCurrentMaterial(prev => ({ 
                      ...prev, 
                      name: e.target.value 
                    }))}
                  />
                </div>
                <div>
                  <Input 
                    type="number"
                    min="1"
                    placeholder="Cantidad"
                    value={currentMaterial.quantity || ''}
                    onChange={(e) => setCurrentMaterial(prev => ({ 
                      ...prev, 
                      quantity: e.target.value ? Number(e.target.value) : 0
                    }))}
                  />
                </div>
                <div>
                  <Select 
                    value={currentMaterial.unit} 
                    onValueChange={(value) => setCurrentMaterial(prev => ({ 
                      ...prev, 
                      unit: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidad">Unidad</SelectItem>
                      <SelectItem value="metro">Metro</SelectItem>
                      <SelectItem value="m2">Metro²</SelectItem>
                      <SelectItem value="pie">Pie</SelectItem>
                      <SelectItem value="pie2">Pie²</SelectItem>
                      <SelectItem value="galón">Galón</SelectItem>
                      <SelectItem value="kg">Kilogramo</SelectItem>
                      <SelectItem value="lb">Libra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="Precio unitario"
                    value={currentMaterial.unitPrice || ''}
                    onChange={(e) => setCurrentMaterial(prev => ({ 
                      ...prev, 
                      unitPrice: e.target.value ? Number(e.target.value) : 0
                    }))}
                  />
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={addMaterial}
                disabled={!currentMaterial.name || currentMaterial.quantity <= 0 || currentMaterial.unitPrice <= 0}
                className="w-full"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Agregar Material
              </Button>
            </div>
            
            {analysisError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                <div className="font-medium flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Error en el análisis
                </div>
                <p>{analysisError.message}</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-6 bg-muted/30">
            <Button
              variant="secondary"
              disabled={isAnalyzing || isGeneratingDescription}
              onClick={generateDescription}
            >
              {isGeneratingDescription ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generar Descripción
                </>
              )}
            </Button>
            
            <Button
              disabled={!params.serviceType || params.materials.length === 0 || isAnalyzing}
              onClick={runAnalysis}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <PieChart className="w-4 h-4 mr-2" />
                  Analizar Costos
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="results" className="m-0">
          {analysisResult && (
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Resumen general */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border border-primary/20 shadow-sm">
                  <h3 className="text-xl font-bold flex items-center mb-3 text-primary">
                    <DollarSign className="w-6 h-6 mr-2 text-primary" />
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Precio Recomendado: {formatCurrency(analysisResult.recommendedTotal)}
                    </span>
                  </h3>
                  <p className="text-base italic">{analysisResult.summary}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Desglose de costos */}
                  <div className="space-y-3">
                    <h3 className="text-base font-medium">Desglose de Costos</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Materiales:</span>
                        <span className="font-medium">{formatCurrency(analysisResult.breakdown.materials.total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Mano de Obra:</span>
                        <span className="font-medium">{formatCurrency(analysisResult.breakdown.labor.total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Gastos Generales:</span>
                        <span className="font-medium">{formatCurrency(analysisResult.breakdown.overhead.total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Ganancia:</span>
                        <span className="font-medium">{formatCurrency(analysisResult.breakdown.profit.total)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total:</span>
                        <span className="font-semibold">{formatCurrency(analysisResult.recommendedTotal)}</span>
                      </div>
                    </div>
                    
                    {/* Análisis competitivo si existe */}
                    {analysisResult.breakdown.competitiveAnalysis && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2 flex items-center text-primary">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Análisis Competitivo
                        </h4>
                        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-md border border-muted">
                          <div className="flex justify-between mb-2 text-sm">
                            <span className="font-medium">Rango bajo: {formatCurrency(analysisResult.breakdown.competitiveAnalysis.lowRange)}</span>
                            <span className="font-medium">Rango alto: {formatCurrency(analysisResult.breakdown.competitiveAnalysis.highRange)}</span>
                          </div>
                          
                          <div className="relative h-6 bg-muted rounded-full overflow-hidden mb-3">
                            <div className="absolute inset-0 flex">
                              <div className="h-full bg-red-400/20 flex-1" />
                              <div className="h-full bg-yellow-400/20 flex-1" />
                              <div className="h-full bg-green-400/20 flex-1" />
                              <div className="h-full bg-blue-400/20 flex-1" />
                            </div>
                            
                            {/* Marcador de precio recomendado */}
                            <div 
                              className="absolute top-0 h-full w-4 bg-primary rounded-full shadow-md"
                              style={{ 
                                left: `calc(${((analysisResult.recommendedTotal - analysisResult.breakdown.competitiveAnalysis.lowRange) / 
                                  (analysisResult.breakdown.competitiveAnalysis.highRange - analysisResult.breakdown.competitiveAnalysis.lowRange)) * 100}% - 8px)`,
                                transition: "left 0.5s ease-in-out"
                              }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs mb-2">
                            <span>Muy Económico</span>
                            <span>Económico</span>
                            <span>Estándar</span>
                            <span>Premium</span>
                          </div>
                          
                          <div className="mt-3 text-sm bg-white/80 p-2 rounded border">
                            <p className="text-sm">
                              <span className="font-semibold">Tu precio recomendado: </span>
                              <span className="font-bold text-primary">{formatCurrency(analysisResult.recommendedTotal)}</span>
                            </p>
                            <p className="text-xs mt-1 text-muted-foreground">{analysisResult.breakdown.competitiveAnalysis.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Detalles adicionales */}
                  <div className="space-y-4">
                    {/* Detalles de la mano de obra */}
                    <div className="border rounded-lg p-4 shadow-sm bg-card overflow-hidden">
                      <h4 className="text-sm font-medium mb-3 flex items-center text-primary">
                        <Wrench className="w-4 h-4 mr-2" />
                        Mano de Obra
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="bg-muted/30 p-3 rounded-md flex justify-between items-center">
                          <div>
                            <span className="text-muted-foreground block">Horas estimadas:</span>
                            <span className="text-xl font-bold">{analysisResult.breakdown.labor.estimatedHours}</span>
                            <span className="text-xs ml-1">horas</span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground block">Tarifa por hora:</span>
                            <span className="text-xl font-bold">{formatCurrency(analysisResult.breakdown.labor.hourlyRate)}</span>
                            <span className="text-xs ml-1">/hr</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center bg-primary/5 p-3 rounded-md">
                          <span className="font-medium">Total Mano de Obra:</span>
                          <span className="font-bold text-primary">{formatCurrency(analysisResult.breakdown.labor.total)}</span>
                        </div>
                        
                        {analysisResult.breakdown.labor.notes && (
                          <div className="p-2 border-l-2 border-primary/30 bg-muted/10 rounded-r-md">
                            <p className="text-xs text-muted-foreground italic">{analysisResult.breakdown.labor.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Porcentajes de gastos generales y ganancias */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 shadow-sm bg-gradient-to-br from-transparent to-muted/10">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <PieChart className="w-4 h-4 mr-2 text-primary" />
                          Gastos Generales
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center">
                            <div className="text-2xl font-bold text-center">
                              {analysisResult.breakdown.overhead.percentage}%
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-muted-foreground">Total:</span>
                            <div className="text-lg font-bold">{formatCurrency(analysisResult.breakdown.overhead.total)}</div>
                          </div>
                        </div>
                        {analysisResult.breakdown.overhead.notes && (
                          <div className="mt-2 p-2 border-t text-xs text-muted-foreground">
                            {analysisResult.breakdown.overhead.notes}
                          </div>
                        )}
                      </div>

                      <div className="border rounded-lg p-4 shadow-sm bg-gradient-to-br from-transparent to-primary/5">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <ShoppingCart className="w-4 h-4 mr-2 text-primary" />
                          Margen de Ganancia
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="bg-primary/20 h-16 w-16 rounded-full flex items-center justify-center">
                            <div className="text-2xl font-bold text-center text-primary">
                              {analysisResult.breakdown.profit.percentage}%
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-muted-foreground">Total:</span>
                            <div className="text-lg font-bold text-primary">{formatCurrency(analysisResult.breakdown.profit.total)}</div>
                          </div>
                        </div>
                        {analysisResult.breakdown.profit.notes && (
                          <div className="mt-2 p-2 border-t text-xs text-muted-foreground">
                            {analysisResult.breakdown.profit.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recomendaciones y problemas potenciales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Recomendaciones */}
                  <div className="border rounded-lg p-5 shadow-sm bg-gradient-to-br from-transparent to-green-50/30">
                    <h3 className="text-base font-semibold flex items-center mb-4 text-primary">
                      <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                      Recomendaciones
                    </h3>
                    <ul className="space-y-3">
                      {analysisResult.breakdown.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start text-sm bg-white/80 p-3 rounded-md border border-green-100/50 shadow-sm hover:shadow-md transition-shadow">
                          <CheckCircle2 className="w-5 h-5 mr-3 text-green-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Problemas potenciales */}
                  <div className="border rounded-lg p-5 shadow-sm bg-gradient-to-br from-transparent to-amber-50/30">
                    <h3 className="text-base font-semibold flex items-center mb-4 text-primary">
                      <Triangle className="w-5 h-5 mr-2 text-destructive" />
                      Problemas Potenciales
                    </h3>
                    <ul className="space-y-3">
                      {analysisResult.breakdown.potentialIssues.map((issue, index) => (
                        <li key={index} className="flex items-start text-sm bg-white/80 p-3 rounded-md border border-amber-100/50 shadow-sm hover:shadow-md transition-shadow">
                          <AlertCircle className="w-5 h-5 mr-3 text-amber-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-700">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </TabsContent>
        
        <TabsContent value="description" className="m-0">
          {jobDescription ? (
            <CardContent className="p-6">
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  Descripción del Trabajo
                </h3>
                <ScrollArea className="max-h-[400px]">
                  <div className="whitespace-pre-line text-muted-foreground">
                    {jobDescription}
                  </div>
                </ScrollArea>
              </div>
              <div className="mt-4 text-sm text-muted-foreground flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-amber-500" />
                Esta descripción fue generada por IA y puede ser editada o personalizada según tus necesidades.
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-6 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Genera una descripción del trabajo para ver los resultados aquí.</p>
            </CardContent>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}