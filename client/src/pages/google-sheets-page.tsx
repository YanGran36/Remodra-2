import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Table, CloudSun, Upload, Download, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function GoogleSheetsPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "info" | null }>({ 
    message: "", 
    type: null 
  });
  const { toast } = useToast();

  const handleInitialize = async () => {
    setIsInitializing(true);
    setStatus({ message: "Inicializando Google Sheets...", type: "info" });
    
    try {
      const response = await apiRequest("POST", "/api/protected/google-sheets/initialize");
      const data = await response.json();
      
      setStatus({ message: data.message, type: "success" });
      toast({
        title: "Inicialización exitosa",
        description: data.message,
      });
    } catch (error: any) {
      setStatus({ 
        message: `Error al inicializar: ${error.message || "Error desconocido"}`, 
        type: "error" 
      });
      toast({
        title: "Error de inicialización",
        description: `No se pudo inicializar Google Sheets: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setStatus({ message: "Exportando clientes a Google Sheets...", type: "info" });
    
    try {
      const response = await apiRequest("POST", "/api/protected/google-sheets/export-clients");
      const data = await response.json();
      
      setStatus({ message: data.message, type: "success" });
      toast({
        title: "Exportación exitosa",
        description: data.message,
      });
    } catch (error: any) {
      setStatus({ 
        message: `Error al exportar: ${error.message || "Error desconocido"}`, 
        type: "error" 
      });
      toast({
        title: "Error de exportación",
        description: `No se pudieron exportar los clientes: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setStatus({ message: "Importando clientes desde Google Sheets...", type: "info" });
    
    try {
      const response = await apiRequest("POST", "/api/protected/google-sheets/import-clients");
      const data = await response.json();
      
      setStatus({ message: data.message, type: "success" });
      toast({
        title: "Importación exitosa",
        description: data.message,
      });
    } catch (error: any) {
      setStatus({ 
        message: `Error al importar: ${error.message || "Error desconocido"}`, 
        type: "error" 
      });
      toast({
        title: "Error de importación",
        description: `No se pudieron importar los clientes: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setStatus({ message: "Sincronizando clientes con Google Sheets...", type: "info" });
    
    try {
      const response = await apiRequest("POST", "/api/protected/google-sheets/sync-clients");
      const data = await response.json();
      
      setStatus({ message: data.message, type: "success" });
      toast({
        title: "Sincronización exitosa",
        description: data.message,
      });
    } catch (error: any) {
      setStatus({ 
        message: `Error al sincronizar: ${error.message || "Error desconocido"}`, 
        type: "error" 
      });
      toast({
        title: "Error de sincronización",
        description: `No se pudieron sincronizar los clientes: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Encabezado de la página */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            <Table className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Integración con Google Sheets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administra y sincroniza tus datos con Google Sheets
            </p>
          </div>
        </div>
      </div>
      
      {/* Panel de sincronización */}
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudSun className="h-5 w-5" />
            Sincronización con Google Sheets
          </CardTitle>
          <CardDescription>
            Gestiona los datos de tus clientes entre ContractorHub y Google Sheets.
            Esto facilita el trabajo colaborativo y la migración de datos a otras plataformas como Airtable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.message && status.type && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {status.type === "success" ? "Operación exitosa" : 
                 status.type === "error" ? "Error" : "Información"}
              </AlertTitle>
              <AlertDescription>
                {status.message}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Antes de comenzar a exportar o importar datos, debes inicializar la conexión con Google Sheets.
              Esto creará las hojas necesarias para almacenar los datos de tus clientes, proyectos y más.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2">
          <Button 
            onClick={handleInitialize} 
            disabled={isInitializing || isExporting || isImporting || isSyncing}
            className="min-w-[120px]"
          >
            {isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inicializando...
              </>
            ) : (
              "Inicializar"
            )}
          </Button>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleExport} 
              disabled={isInitializing || isExporting || isImporting || isSyncing}
              variant="outline"
              className="min-w-[120px]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleImport} 
              disabled={isInitializing || isExporting || isImporting || isSyncing}
              variant="outline"
              className="min-w-[120px]"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleSync} 
              disabled={isInitializing || isExporting || isImporting || isSyncing}
              className="min-w-[120px]"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <CloudSun className="mr-2 h-4 w-4" />
                  Sincronizar
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Instrucciones */}
      <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-2">Instrucciones</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold">1. Inicialización</h4>
            <p className="mt-1 text-muted-foreground">
              Haz clic en "Inicializar" para crear las hojas necesarias en tu Google Sheets. 
              Esto configurará las columnas y ajustes adecuados para sincronizar tus datos.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">2. Exportar Datos</h4>
            <p className="mt-1 text-muted-foreground">
              La opción "Exportar" enviará los datos de tus clientes desde ContractorHub a Google Sheets. 
              Esto es útil para análisis, respaldos o cuando necesitas trabajar con los datos fuera de la plataforma.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">3. Importar Datos</h4>
            <p className="mt-1 text-muted-foreground">
              La opción "Importar" traerá los datos de clientes desde Google Sheets a ContractorHub. 
              Úsala cuando hayas añadido o modificado información en las hojas de cálculo.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">4. Sincronización Bidireccional</h4>
            <p className="mt-1 text-muted-foreground">
              La opción "Sincronizar" combina exportación e importación en un solo paso, asegurando 
              que los datos estén actualizados en ambos sistemas.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">5. Migración a Airtable</h4>
            <p className="mt-1 text-muted-foreground">
              Los datos en Google Sheets pueden ser fácilmente importados a Airtable usando la función 
              de importación de Airtable. Una vez que tus datos estén en Google Sheets, ve a Airtable, 
              crea una base y selecciona "Importar desde Google Sheets".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}