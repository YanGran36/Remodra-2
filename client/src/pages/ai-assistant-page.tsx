import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import CostAnalysisAssistant from "@/components/ai/cost-analysis-assistant";
import { AiAnalysisResult } from "@/hooks/use-ai-cost-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  PieChart, 
  FileText, 
  Brain, 
  ChevronRight, 
  Lightbulb, 
  BarChart,
  Sparkles,
  CheckCircle2,
  DollarSign
} from "lucide-react";

export default function AiAssistantPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cost-analysis");
  const [lastAnalysisResult, setLastAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");

  const handleAnalysisComplete = (result: AiAnalysisResult) => {
    setLastAnalysisResult(result);
    toast({
      title: "Análisis completado",
      description: "El análisis de costos se ha completado con éxito",
    });
  };

  const handleDescriptionGenerated = (description: string) => {
    setJobDescription(description);
    toast({
      title: "Descripción generada",
      description: "La descripción del trabajo se ha generado con éxito",
    });
  };

  return (
    <div className="container py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Brain className="w-8 h-8 mr-2 text-primary" />
            Asistente de IA para Contratistas
          </h1>
          <p className="text-muted-foreground text-lg">
            Herramientas impulsadas por IA para optimizar tus estimaciones y servicios
          </p>
        </div>

        <Tabs defaultValue="cost-analysis" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto gap-4 bg-transparent">
            <TabsTrigger 
              value="cost-analysis" 
              className="flex items-center justify-start h-auto p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <PieChart className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Análisis de Costos</div>
                <div className="text-xs text-muted-foreground data-[state=active]:text-primary-foreground/80">
                  Optimiza tus presupuestos con precisión
                </div>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </TabsTrigger>
            
            <TabsTrigger 
              value="job-descriptions" 
              className="flex items-center justify-start h-auto p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              disabled={!jobDescription}
            >
              <FileText className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Descripción del Trabajo</div>
                <div className="text-xs text-muted-foreground data-[state=active]:text-primary-foreground/80">
                  Profesionaliza tus propuestas a clientes
                </div>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </TabsTrigger>
            
            <TabsTrigger 
              value="insights" 
              className="flex items-center justify-start h-auto p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              disabled={!lastAnalysisResult}
            >
              <Lightbulb className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Insights y Recomendaciones</div>
                <div className="text-xs text-muted-foreground data-[state=active]:text-primary-foreground/80">
                  Mejora tus decisiones de negocio
                </div>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cost-analysis" className="space-y-4">
            {/* Introducción al análisis de costos */}
            <div className="bg-primary/5 rounded-lg p-4 mb-6">
              <div className="flex gap-3 items-start">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-medium mb-2">Análisis de Costos Inteligente</h2>
                  <p className="text-muted-foreground">
                    Nuestro asistente de IA analiza los detalles de tu proyecto para generar estimaciones precisas, 
                    cálculos de margen óptimos y recomendaciones personalizadas. Completa el formulario a continuación 
                    para obtener un desglose detallado de costos.
                  </p>
                  <div className="mt-4 bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm">
                    <p className="font-medium mb-1">Para utilizar esta herramienta:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Selecciona un <span className="font-medium">tipo de servicio</span></li>
                      <li>Agrega los <span className="font-medium">materiales</span> que utilizarás</li>
                      <li>Proporciona información sobre el tamaño y complejidad del proyecto (opcional)</li>
                      <li>Haz clic en "Analizar Costos" o "Generar Descripción" según tu necesidad</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Componente principal de análisis */}
            <CostAnalysisAssistant 
              onAnalysisComplete={handleAnalysisComplete}
              onDescriptionGenerated={handleDescriptionGenerated}
            />
          </TabsContent>
          
          <TabsContent value="job-descriptions" className="space-y-4">
            {jobDescription ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Descripción Profesional del Trabajo
                  </CardTitle>
                  <CardDescription>
                    Descripción lista para compartir con tus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-muted/30 rounded-lg p-6 whitespace-pre-line border-l-4 border-primary">
                        {jobDescription}
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-4">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(jobDescription);
                            toast({
                              title: "Copiado al portapapeles",
                              description: "La descripción ha sido copiada al portapapeles"
                            });
                          }}
                          className="flex-1"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Copiar Texto
                        </Button>
                        
                        <Button 
                          variant="default"
                          onClick={() => {
                            if (lastAnalysisResult) {
                              // Preparar un mensaje de correo electrónico con la descripción y el precio
                              const subject = encodeURIComponent("Propuesta de Trabajo");
                              const body = encodeURIComponent(
                                `${jobDescription}\n\n` +
                                `Presupuesto estimado: ${new Intl.NumberFormat('es-CO', {
                                  style: 'currency',
                                  currency: 'COP',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(lastAnalysisResult.recommendedTotal)}\n\n` +
                                "Para más detalles, por favor contáctenos."
                              );
                              window.open(`mailto:?subject=${subject}&body=${body}`);
                            } else {
                              toast({
                                title: "No hay análisis de costos",
                                description: "Para incluir el presupuesto, primero debes generar un análisis de costos",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="flex-1"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Enviar por Email
                        </Button>
                      </div>
                      
                      <div className="flex flex-col mt-6 space-y-2">
                        <h3 className="text-base font-medium">Recomendaciones de uso:</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li className="flex items-start">
                            <div className="bg-green-100 text-green-800 rounded-full p-1 mr-2 mt-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <span>Utiliza esta descripción en propuestas formales</span>
                          </li>
                          <li className="flex items-start">
                            <div className="bg-green-100 text-green-800 rounded-full p-1 mr-2 mt-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <span>Inclúyela en contratos o acuerdos de trabajo</span>
                          </li>
                          <li className="flex items-start">
                            <div className="bg-green-100 text-green-800 rounded-full p-1 mr-2 mt-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <span>Compártela en comunicaciones con clientes para clarificar expectativas</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    {lastAnalysisResult && (
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-4">
                        <h3 className="text-base font-medium flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-primary" />
                          Resumen del Presupuesto
                        </h3>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-medium">Precio recomendado:</span>
                            <span className="font-bold text-lg">{new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(lastAnalysisResult.recommendedTotal)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Materiales:</span>
                            <span>{new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(lastAnalysisResult.breakdown.materials.total)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Mano de obra:</span>
                            <span>{new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(lastAnalysisResult.breakdown.labor.total)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Gastos operativos:</span>
                            <span>{new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(lastAnalysisResult.breakdown.overhead.total)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Margen de ganancia:</span>
                            <span>{new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(lastAnalysisResult.breakdown.profit.total)}</span>
                          </div>
                          
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <h4 className="font-medium mb-1">Análisis competitivo:</h4>
                            {lastAnalysisResult.breakdown.competitiveAnalysis && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Rango bajo:</span>
                                  <span>{new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(lastAnalysisResult.breakdown.competitiveAnalysis.lowRange)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span>Rango alto:</span>
                                  <span>{new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(lastAnalysisResult.breakdown.competitiveAnalysis.highRange)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button onClick={() => setActiveTab("cost-analysis")}>
                      <PieChart className="w-4 h-4 mr-2" />
                      Volver al Análisis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center p-8">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <h2 className="text-xl font-medium mb-2">No hay descripciones generadas</h2>
                <p className="text-muted-foreground mb-6">
                  Para ver este contenido, primero genera una descripción desde la pestaña de Análisis de Costos
                </p>
                <Button onClick={() => setActiveTab("cost-analysis")}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ir a Análisis de Costos
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            {lastAnalysisResult ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="w-5 h-5 mr-2" />
                    Insights y Recomendaciones
                  </CardTitle>
                  <CardDescription>
                    Análisis detallado para ayudarte a tomar mejores decisiones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Resumen */}
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Resumen del Análisis</h3>
                      <p className="text-muted-foreground">{lastAnalysisResult.summary}</p>
                    </div>
                    
                    {/* Recomendaciones */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Recomendaciones Clave</h3>
                      <ul className="space-y-2">
                        {lastAnalysisResult.breakdown.recommendations.map((rec, index) => (
                          <li key={index} className="bg-muted/30 p-3 rounded-md flex items-start">
                            <Lightbulb className="w-5 h-5 text-amber-500 mr-3 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Problemas potenciales */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Consideraciones Importantes</h3>
                      <ul className="space-y-2">
                        {lastAnalysisResult.breakdown.potentialIssues.map((issue, index) => (
                          <li key={index} className="bg-destructive/5 p-3 rounded-md flex items-start">
                            <div className="w-5 h-5 rounded-full border-2 border-destructive flex items-center justify-center mr-3 shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-destructive">{index + 1}</span>
                            </div>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button onClick={() => setActiveTab("cost-analysis")}>
                        <PieChart className="w-4 h-4 mr-2" />
                        Volver al Análisis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center p-8">
                <Lightbulb className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <h2 className="text-xl font-medium mb-2">No hay insights disponibles</h2>
                <p className="text-muted-foreground mb-6">
                  Para ver este contenido, primero realiza un análisis de costos desde la pestaña de Análisis
                </p>
                <Button onClick={() => setActiveTab("cost-analysis")}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ir a Análisis de Costos
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}