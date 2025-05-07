import { useState } from "react";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";

export default function AIAssistantPage() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }[]>([
    {
      role: "assistant",
      content: "Hola, soy tu asistente de AI para ContractorHub. ¿En qué puedo ayudarte hoy? Puedo ayudarte con estimados, seguimientos a clientes, análisis de costos de proyectos, y más.",
      timestamp: new Date(),
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to conversation
    setConversation((prev) => [
      ...prev,
      {
        role: "user",
        content: message,
        timestamp: new Date(),
      },
    ]);
    
    setIsSending(true);
    setMessage("");
    
    // Simulate API call to OpenAI
    try {
      // In a real implementation, this would make an API call to your backend
      // which would then call OpenAI with your API key
      setTimeout(() => {
        let responseText = "Estoy procesando tu consulta. Por favor, dame un momento...";
        
        if (message.toLowerCase().includes("estimado")) {
          responseText = "Para crear un estimado práctico, recomiendo incluir estos elementos clave: descripción detallada del trabajo, materiales requeridos con costos, mano de obra con tarifas, cronograma estimado, y términos y condiciones claros. Puedes usar la página de Estimados para crear uno nuevo.";
        } else if (message.toLowerCase().includes("cliente")) {
          responseText = "La gestión efectiva de clientes es crucial. Asegúrate de mantener actualizada la información de contacto, preferencias, historial de proyectos y comunicaciones anteriores. Esto facilita seguimientos personalizados y mejora la relación con el cliente.";
        } else if (message.toLowerCase().includes("factura") || message.toLowerCase().includes("invoice")) {
          responseText = "Para una facturación efectiva, asegúrate de incluir todos los detalles del trabajo realizado, costos de materiales, horas de mano de obra, y cualquier ajuste o descuento acordado. Sé puntual con las facturas para mantener un flujo de caja saludable.";
        } else if (message.toLowerCase().includes("proyecto")) {
          responseText = "La gestión exitosa de proyectos requiere planificación detallada, comunicación clara, y seguimiento constante. Actualiza regularmente el estado del proyecto y comunica cualquier cambio o retraso al cliente de inmediato.";
        } else {
          responseText = "Entiendo tu consulta. Te sugiero explorar las diferentes secciones de ContractorHub para gestionar eficientemente tus clientes, proyectos, estimados y facturas. Cada módulo está diseñado para facilitar tu trabajo como contratista.";
        }
        
        setConversation((prev) => [
          ...prev,
          {
            role: "assistant",
            content: responseText,
            timestamp: new Date(),
          },
        ]);
        setIsSending(false);
      }, 1500);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.",
          timestamp: new Date(),
        },
      ]);
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <PageHeader 
            title="Asistente AI" 
            description="Tu asistente AI para ContractorHub" 
          />

          <div className="grid grid-cols-1 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  Asistente AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col space-y-4">
                  <p className="text-sm text-gray-500">
                    Este asistente puede ayudarte con tareas como:
                  </p>
                  <ul className="text-sm text-gray-500 list-disc ml-5 space-y-1">
                    <li>Crear seguimientos personalizados para clientes</li>
                    <li>Analizar costos y rentabilidad de proyectos</li>
                    <li>Generar descripciones de trabajo para estimados</li>
                    <li>Sugerir mejores prácticas para gestión de proyectos</li>
                    <li>Redactar comunicaciones profesionales a clientes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Conversación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col space-y-4 h-[400px] overflow-y-auto">
                  {conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[80%] ${
                          msg.role === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className={`${msg.role === "user" ? "ml-2" : "mr-2"} h-8 w-8`}>
                          <AvatarFallback>
                            {msg.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <span className="text-xs mt-1 opacity-70 block">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="flex">
                        <Avatar className="mr-2 h-8 w-8">
                          <AvatarFallback>
                            <Bot className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg bg-muted px-4 py-2">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <Input
                    className="flex-1"
                    placeholder="Escribe tu mensaje..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSending}
                  />
                  <Button type="submit" size="icon" disabled={isSending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}