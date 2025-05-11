import { useState } from "react";
import { useParams } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  FileText, 
  ClipboardCheck, 
  Calendar, 
  MessageCircle,
  Clock,
  DollarSign
} from "lucide-react";

// Componente para la vista de portal del cliente
export default function ClientPortal() {
  const { clientId } = useParams<{ clientId: string }>();
  // Estado para almacenar datos del cliente
  const [activeTab, setActiveTab] = useState("estimates");
  // En una implementación real, estos datos vendrían de una API
  
  // Información del cliente de muestra
  const clientInfo = {
    id: Number(clientId),
    name: "John Smith",
    email: "john@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, CA 12345"
  };

  // Componente de estimaciones
  const EstimatesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Mis Presupuestos</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estimado pendiente */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Presupuesto #1001</CardTitle>
                <CardDescription>Emitido: {format(new Date(), "PP", { locale: es })}</CardDescription>
              </div>
              <Badge className="bg-amber-500 hover:bg-amber-600">Pendiente</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="font-medium mb-1">Reparación de Techo</p>
            <p className="text-gray-600 text-sm mb-3">Reparación y reemplazo de tejas en área de 200m²</p>
            <p className="font-semibold text-lg">Total: $5,840.00</p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-0">
            <Button variant="outline" size="sm">Ver Detalles</Button>
            <Button size="sm">Aprobar</Button>
          </CardFooter>
        </Card>
        
        {/* Estimado aprobado */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Presupuesto #982</CardTitle>
                <CardDescription>Emitido: {format(new Date(2023, 3, 15), "PP", { locale: es })}</CardDescription>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">Aprobado</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="font-medium mb-1">Instalación de Ventanas</p>
            <p className="text-gray-600 text-sm mb-3">Instalación de 5 ventanas de doble panel</p>
            <p className="font-semibold text-lg">Total: $3,250.00</p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-0">
            <Button variant="outline" size="sm">Ver Detalles</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  // Componente de facturas
  const InvoicesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Mis Facturas</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Factura pendiente */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Factura #INV-1235</CardTitle>
                <CardDescription>Vence: {format(new Date(2023, 6, 30), "PP", { locale: es })}</CardDescription>
              </div>
              <Badge className="bg-amber-500 hover:bg-amber-600">Pendiente Firma</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="font-medium mb-1">Instalación de Ventanas</p>
            <p className="text-gray-600 text-sm mb-3">Primer pago por instalación</p>
            <p className="font-semibold text-lg">Monto: $1,625.00</p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-0">
            <Button variant="outline" size="sm">Ver Detalles</Button>
            <Button size="sm">Firmar Factura</Button>
          </CardFooter>
        </Card>
        
        {/* Factura pagada */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Factura #INV-1180</CardTitle>
                <CardDescription>Pagada: {format(new Date(2023, 3, 20), "PP", { locale: es })}</CardDescription>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">Pagada</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="font-medium mb-1">Reparación de Baño</p>
            <p className="text-gray-600 text-sm mb-3">Servicios completos de plomería y cerámica</p>
            <p className="font-semibold text-lg">Monto: $2,750.00</p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-0">
            <Button variant="outline" size="sm">Ver Detalles</Button>
            <Button variant="outline" size="sm">Descargar PDF</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  // Componente de proyectos
  const ProjectsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Mis Proyectos</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Proyecto en progreso */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Instalación de Ventanas</CardTitle>
                <CardDescription>Iniciado: {format(new Date(2023, 3, 18), "PP", { locale: es })}</CardDescription>
              </div>
              <Badge className="bg-blue-600 hover:bg-blue-700">En Progreso</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Fecha estimada de finalización: {format(new Date(2023, 7, 15), "PP", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Presupuesto: $3,250.00</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-right text-sm text-gray-600">65% Completado</p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-0">
            <Button variant="outline" size="sm">Ver Detalles</Button>
          </CardFooter>
        </Card>
        
        {/* Proyecto completado */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>Reparación de Baño</CardTitle>
                <CardDescription>Completado: {format(new Date(2023, 2, 28), "PP", { locale: es })}</CardDescription>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">Completado</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Duración: 14 días</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Costo final: $2,750.00</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <p className="text-right text-sm text-gray-600">100% Completado</p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-0">
            <Button variant="outline" size="sm">Ver Detalles</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  // Componente de programación
  const ScheduleTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Mi Calendario</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>Citas y visitas programadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Evento próximo */}
            <div className="flex items-start gap-4 p-3 rounded-lg border">
              <Calendar className="h-10 w-10 text-blue-600 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">Visita para medición - Ventanas</h4>
                  <Badge>Pendiente</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Fecha:</span> {format(new Date(2023, 6, 20, 10, 0), "PPpp", { locale: es })}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Dirección:</span> 123 Main St, Anytown, CA 12345
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notas:</span> Primera visita para tomar medidas de ventanas a reemplazar.
                </p>
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="outline" size="sm">Reprogramar</Button>
                  <Button variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            </div>
            
            {/* Evento pasado */}
            <div className="flex items-start gap-4 p-3 rounded-lg border bg-gray-50">
              <Calendar className="h-10 w-10 text-gray-500 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">Consulta inicial - Reparación de Techo</h4>
                  <Badge variant="outline">Completado</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Fecha:</span> {format(new Date(2023, 6, 10, 14, 0), "PPpp", { locale: es })}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Dirección:</span> 123 Main St, Anytown, CA 12345
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notas:</span> Evaluación inicial de daños en el techo.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">Ver Calendario Completo</Button>
        </CardFooter>
      </Card>
    </div>
  );

  // Componente de comunicaciones
  const MessagesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Mensajes</h2>
        <Button>Nuevo Mensaje</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Bandeja de Entrada</CardTitle>
          <CardDescription>Comunicaciones con el contratista</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mensaje no leído */}
            <div className="flex items-start gap-4 p-3 rounded-lg border border-blue-200 bg-blue-50">
              <MessageCircle className="h-10 w-10 text-blue-600 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">Actualización sobre su proyecto</h4>
                  <Badge>Nuevo</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">De:</span> ABC Construction
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Fecha:</span> {format(new Date(2023, 6, 18, 15, 30), "PPpp", { locale: es })}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  Buenos días Sr. Smith, le escribo para informarle que hemos recibido los materiales para su proyecto de ventanas y...
                </p>
                <div className="flex justify-end mt-2">
                  <Button size="sm">Leer Mensaje</Button>
                </div>
              </div>
            </div>
            
            {/* Mensaje leído */}
            <div className="flex items-start gap-4 p-3 rounded-lg border">
              <MessageCircle className="h-10 w-10 text-gray-500 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">Re: Consulta sobre presupuesto</h4>
                  <span className="text-xs text-gray-500">Leído</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">De:</span> ABC Construction
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Fecha:</span> {format(new Date(2023, 6, 15, 11, 45), "PPpp", { locale: es })}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  Estimado Sr. Smith, en respuesta a su consulta sobre el desglose del presupuesto, adjunto encontrará el detalle...
                </p>
                <div className="flex justify-end mt-2">
                  <Button variant="outline" size="sm">Ver Mensaje</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">Ver Todos los Mensajes</Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Portal del Cliente</CardTitle>
          <CardDescription>
            Bienvenido, {clientInfo.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p>{clientInfo.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Teléfono</p>
              <p>{clientInfo.phone}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 mb-1">Dirección</p>
              <p>{clientInfo.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="estimates" className="flex gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Presupuestos</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Facturas</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Proyectos</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendario</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Mensajes</span>
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="estimates"><EstimatesTab /></TabsContent>
          <TabsContent value="invoices"><InvoicesTab /></TabsContent>
          <TabsContent value="projects"><ProjectsTab /></TabsContent>
          <TabsContent value="schedule"><ScheduleTab /></TabsContent>
          <TabsContent value="messages"><MessagesTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}