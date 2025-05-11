import { Table } from "lucide-react";
import { GoogleSheetsSyncPanel } from "@/components/google-sheets/data-sync-panel";

export default function GoogleSheetsPage() {
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
      
      {/* Panel de sincronización mejorado */}
      <GoogleSheetsSyncPanel />
      
      {/* Instrucciones */}
      <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-2">Instrucciones</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold">1. Inicialización</h4>
            <p className="mt-1 text-muted-foreground">
              Ingresa el ID de tu hoja de Google Sheets y haz clic en "Inicializar" para crear las hojas necesarias. 
              El ID se encuentra en la URL de tu hoja: https://docs.google.com/spreadsheets/d/[ID-DE-TU-HOJA]/edit
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