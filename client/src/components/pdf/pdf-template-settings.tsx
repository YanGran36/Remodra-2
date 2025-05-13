import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ColorPicker } from "../ui/color-picker";
import { useToast } from "@/hooks/use-toast";
import { Check, Save, Image, FileText, Layout, Palette, Type, Info } from "lucide-react";

export interface PdfTemplateConfig {
  // Opciones generales
  logo: boolean;
  showHeader: boolean;
  showFooter: boolean;
  // Opciones de contenido
  showItemDetails: boolean;
  showItemNotes: boolean;
  showProjectDetails: boolean;
  showClientDetails: boolean;
  // Opciones de estilo
  colorPrimary: string;
  colorSecondary: string;
  fontMain: string;
  headerStyle: 'simple' | 'gradient' | 'boxed';
  tableStyle: 'striped' | 'bordered' | 'minimal';
  // Metadatos
  showTerms: boolean;
  showNotes: boolean;
  showSignatureLine: boolean;
  showDates: boolean;
}

// Configuración predeterminada
const defaultConfig: PdfTemplateConfig = {
  logo: true,
  showHeader: true,
  showFooter: true,
  showItemDetails: true,
  showItemNotes: true,
  showProjectDetails: true,
  showClientDetails: true,
  colorPrimary: "#0f766e",
  colorSecondary: "#2563eb",
  fontMain: "Inter",
  headerStyle: 'gradient',
  tableStyle: 'bordered',
  showTerms: true,
  showNotes: true,
  showSignatureLine: true,
  showDates: true,
};

// Plantillas predefinidas
const templates = {
  professional: {
    ...defaultConfig,
    headerStyle: 'gradient',
    tableStyle: 'bordered',
    colorPrimary: "#0f766e",
    colorSecondary: "#2563eb",
  },
  minimal: {
    ...defaultConfig,
    headerStyle: 'simple',
    showFooter: false,
    tableStyle: 'minimal',
    showItemNotes: false,
    colorPrimary: "#1e293b",
    colorSecondary: "#64748b",
  },
  elegant: {
    ...defaultConfig,
    headerStyle: 'boxed',
    tableStyle: 'striped',
    colorPrimary: "#6d28d9",
    colorSecondary: "#4f46e5",
  },
};

interface PdfTemplateSettingsProps {
  initialConfig?: Partial<PdfTemplateConfig>;
  onChange?: (config: PdfTemplateConfig) => void;
  onSave?: (config: PdfTemplateConfig) => void;
}

export default function PdfTemplateSettings({ 
  initialConfig, 
  onChange,
  onSave
}: PdfTemplateSettingsProps) {
  const [config, setConfig] = useState<PdfTemplateConfig>({
    ...defaultConfig,
    ...initialConfig
  });
  const [activeTab, setActiveTab] = useState("content");
  const { toast } = useToast();

  // Efecto para notificar cambios
  useEffect(() => {
    if (onChange) {
      onChange(config);
    }
  }, [config, onChange]);

  // Función para actualizar configuración
  const updateConfig = (key: keyof PdfTemplateConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Función para aplicar plantilla predefinida
  const applyTemplate = (template: 'professional' | 'minimal' | 'elegant') => {
    const templateConfig = templates[template] as PdfTemplateConfig;
    setConfig(templateConfig);
    toast({
      title: "Plantilla aplicada",
      description: `Se ha aplicado la plantilla ${template}`,
    });
  };

  // Función para guardar configuración
  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
    toast({
      title: "Configuración guardada",
      description: "La configuración de la plantilla ha sido guardada",
      action: (
        <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
          <Check className="h-4 w-4" />
        </div>
      ),
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Configuración de Plantilla PDF</CardTitle>
        <CardDescription>
          Personaliza el aspecto y contenido de tus documentos PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Plantillas</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Contenido</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Estilo</span>
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Metadatos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer hover:border-primary/50 transition-colors ${
                  JSON.stringify(config) === JSON.stringify(templates.professional) ? 'border-primary' : ''
                }`}
                onClick={() => applyTemplate('professional')}
              >
                <CardHeader className="py-3">
                  <CardTitle className="text-md">Profesional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gradient-to-r from-teal-600 to-blue-600 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold">Vista previa</div>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Diseño profesional con colores vibrantes y detalles completos.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:border-primary/50 transition-colors ${
                  JSON.stringify(config) === JSON.stringify(templates.minimal) ? 'border-primary' : ''
                }`}
                onClick={() => applyTemplate('minimal')}
              >
                <CardHeader className="py-3">
                  <CardTitle className="text-md">Minimalista</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-slate-800 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold">Vista previa</div>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Diseño limpio y simple, sin elementos distractores.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:border-primary/50 transition-colors ${
                  JSON.stringify(config) === JSON.stringify(templates.elegant) ? 'border-primary' : ''
                }`}
                onClick={() => applyTemplate('elegant')}
              >
                <CardHeader className="py-3">
                  <CardTitle className="text-md">Elegante</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold">Vista previa</div>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Diseño elegante con tonos sofisticados y estilo refinado.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Elementos principales</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="logo" className="cursor-pointer flex items-center">
                      <Image className="h-4 w-4 mr-2 text-muted-foreground" />
                      Mostrar logo
                    </Label>
                    <Switch 
                      id="logo" 
                      checked={config.logo} 
                      onCheckedChange={value => updateConfig('logo', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showHeader" className="cursor-pointer">
                      Mostrar encabezado
                    </Label>
                    <Switch 
                      id="showHeader" 
                      checked={config.showHeader} 
                      onCheckedChange={value => updateConfig('showHeader', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showFooter" className="cursor-pointer">
                      Mostrar pie de página
                    </Label>
                    <Switch 
                      id="showFooter" 
                      checked={config.showFooter} 
                      onCheckedChange={value => updateConfig('showFooter', value)} 
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Información detallada</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showItemDetails" className="cursor-pointer">
                      Mostrar detalles de ítems
                    </Label>
                    <Switch 
                      id="showItemDetails" 
                      checked={config.showItemDetails} 
                      onCheckedChange={value => updateConfig('showItemDetails', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showItemNotes" className="cursor-pointer">
                      Mostrar notas de ítems
                    </Label>
                    <Switch 
                      id="showItemNotes" 
                      checked={config.showItemNotes} 
                      onCheckedChange={value => updateConfig('showItemNotes', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showProjectDetails" className="cursor-pointer">
                      Mostrar detalles del proyecto
                    </Label>
                    <Switch 
                      id="showProjectDetails" 
                      checked={config.showProjectDetails} 
                      onCheckedChange={value => updateConfig('showProjectDetails', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showClientDetails" className="cursor-pointer">
                      Mostrar detalles del cliente
                    </Label>
                    <Switch 
                      id="showClientDetails" 
                      checked={config.showClientDetails} 
                      onCheckedChange={value => updateConfig('showClientDetails', value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Colores</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="colorPrimary">Color primario</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-8 w-8 rounded-md border" 
                          style={{ backgroundColor: config.colorPrimary }}
                        />
                        <Input 
                          id="colorPrimary" 
                          value={config.colorPrimary} 
                          onChange={e => updateConfig('colorPrimary', e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="colorSecondary">Color secundario</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-8 w-8 rounded-md border" 
                          style={{ backgroundColor: config.colorSecondary }}
                        />
                        <Input 
                          id="colorSecondary" 
                          value={config.colorSecondary} 
                          onChange={e => updateConfig('colorSecondary', e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fontMain">Fuente principal</Label>
                    <Select 
                      value={config.fontMain} 
                      onValueChange={value => updateConfig('fontMain', value)}
                    >
                      <SelectTrigger id="fontMain">
                        <SelectValue placeholder="Seleccionar fuente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Courier">Courier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Estilos de elementos</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="headerStyle">Estilo de encabezado</Label>
                    <Select 
                      value={config.headerStyle} 
                      onValueChange={value => updateConfig('headerStyle', value as 'simple' | 'gradient' | 'boxed')}
                    >
                      <SelectTrigger id="headerStyle">
                        <SelectValue placeholder="Seleccionar estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="gradient">Gradiente</SelectItem>
                        <SelectItem value="boxed">Con borde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tableStyle">Estilo de tabla</Label>
                    <Select 
                      value={config.tableStyle} 
                      onValueChange={value => updateConfig('tableStyle', value as 'striped' | 'bordered' | 'minimal')}
                    >
                      <SelectTrigger id="tableStyle">
                        <SelectValue placeholder="Seleccionar estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="striped">Alternando filas</SelectItem>
                        <SelectItem value="bordered">Con bordes</SelectItem>
                        <SelectItem value="minimal">Minimalista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metadata">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Información adicional</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTerms" className="cursor-pointer">
                      Mostrar términos y condiciones
                    </Label>
                    <Switch 
                      id="showTerms" 
                      checked={config.showTerms} 
                      onCheckedChange={value => updateConfig('showTerms', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showNotes" className="cursor-pointer">
                      Mostrar notas generales
                    </Label>
                    <Switch 
                      id="showNotes" 
                      checked={config.showNotes} 
                      onCheckedChange={value => updateConfig('showNotes', value)} 
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Elementos legales</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showSignatureLine" className="cursor-pointer">
                      Mostrar línea de firma
                    </Label>
                    <Switch 
                      id="showSignatureLine" 
                      checked={config.showSignatureLine} 
                      onCheckedChange={value => updateConfig('showSignatureLine', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showDates" className="cursor-pointer">
                      Mostrar fechas (emisión/expiración)
                    </Label>
                    <Switch 
                      id="showDates" 
                      checked={config.showDates} 
                      onCheckedChange={value => updateConfig('showDates', value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Guardar configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}