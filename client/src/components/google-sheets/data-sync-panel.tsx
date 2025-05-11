import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CloudSun, Upload, Download, AlertCircle, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export function GoogleSheetsSyncPanel() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [spreadsheetName, setSpreadsheetName] = useState("");
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "info" | null }>({ 
    message: "", 
    type: null 
  });
  const { toast } = useToast();
  
  // Consulta para obtener la configuración actual de Google Sheets
  const { data: sheetsConfig, isLoading: isLoadingConfig, refetch: refetchConfig } = useQuery({
    queryKey: ["/api/protected/google-sheets/config"],
    queryFn: async () => {
      const response = await fetch("/api/protected/google-sheets/config");
      if (!response.ok) {
        throw new Error("Error al obtener la configuración de Google Sheets");
      }
      return response.json();
    }
  });
  
  // Actualizar los campos cuando se carga la configuración
  useEffect(() => {
    if (sheetsConfig?.configured && sheetsConfig?.config) {
      setSpreadsheetId(sheetsConfig.config.spreadsheetId || "");
      setSpreadsheetName(sheetsConfig.config.spreadsheetName || "");
    }
  }, [sheetsConfig]);

  const handleInitialize = async () => {
    // Validación básica
    if (!spreadsheetId) {
      toast({
        title: "Error de validación",
        description: "El ID de la hoja de cálculo es obligatorio",
        variant: "destructive",
      });
      return;
    }
    
    setIsInitializing(true);
    setStatus({ message: "Inicializando Google Sheets...", type: "info" });
    
    try {
      const response = await apiRequest("POST", "/api/protected/google-sheets/initialize", {
        spreadsheetId,
        spreadsheetName: spreadsheetName || undefined
      });
      const data = await response.json();
      
      setStatus({ message: data.message, type: "success" });
      toast({
        title: "Inicialización exitosa",
        description: data.message,
      });
      
      // Recargar la configuración después de inicializar
      refetchConfig();
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
    <Card className="w-full max-w-3xl mx-auto shadow-md">
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
        
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Configuración de Google Sheets</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Antes de comenzar a exportar o importar datos, debes inicializar la conexión con Google Sheets.
              Esto creará las hojas necesarias para almacenar los datos de tus clientes, proyectos y más.
            </p>
            
            {sheetsConfig?.configured ? (
              <div className="bg-muted/50 p-4 rounded-md mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Hoja de cálculo configurada</h4>
                  <Badge variant="outline" className="ml-2">
                    {sheetsConfig.config.lastSync ? 
                      `Última sincronización: ${new Date(sheetsConfig.config.lastSync).toLocaleString()}` : 
                      'No sincronizado aún'}
                  </Badge>
                </div>
                <p className="text-sm"><strong>ID:</strong> {sheetsConfig.config.spreadsheetId}</p>
                {sheetsConfig.config.spreadsheetName && (
                  <p className="text-sm"><strong>Nombre:</strong> {sheetsConfig.config.spreadsheetName}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spreadsheetId">ID de Google Sheets</Label>
                    <Input
                      id="spreadsheetId"
                      placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Puedes encontrar el ID en la URL de tu hoja de cálculo: 
                      https://docs.google.com/spreadsheets/d/<strong>ID-DE-TU-HOJA</strong>/edit
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="spreadsheetName">Nombre (opcional)</Label>
                    <Input
                      id="spreadsheetName"
                      placeholder="Ej: Datos de Clientes"
                      value={spreadsheetName}
                      onChange={(e) => setSpreadsheetName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2">
        {isLoadingConfig ? (
          <div className="w-full flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : sheetsConfig?.configured ? (
          <>
            <Button 
              onClick={handleInitialize} 
              disabled={isInitializing || isExporting || isImporting || isSyncing}
              variant="outline"
              className="min-w-[120px]"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Reconfigurar
                </>
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
          </>
        ) : (
          <Button 
            onClick={handleInitialize} 
            disabled={isInitializing || !spreadsheetId}
            className="mx-auto min-w-[140px]"
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
        )}
      </CardFooter>
    </Card>
  );
}