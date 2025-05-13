import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Home,
  FileText,
  Download,
  Save,
  Check,
  Palette,
  LayoutTemplate,
  Type,
  Info,
  Brush
} from "lucide-react";
import { motion } from "framer-motion";
import { PdfTemplateConfig } from "@/components/pdf/pdf-template-settings";

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

// Opciones de fuente
const fontOptions = [
  { value: "Inter", label: "Inter (Sans-serif)" },
  { value: "Merriweather", label: "Merriweather (Serif)" },
  { value: "Source Code Pro", label: "Source Code Pro (Monospace)" },
  { value: "Montserrat", label: "Montserrat (Modern)" },
  { value: "Playfair Display", label: "Playfair Display (Elegant)" }
];

// Opciones de estilo de encabezado
const headerStyleOptions = [
  { value: "simple", label: "Simple" },
  { value: "gradient", label: "Gradient" },
  { value: "boxed", label: "Boxed" }
];

// Opciones de estilo de tabla
const tableStyleOptions = [
  { value: "striped", label: "Striped" },
  { value: "bordered", label: "Bordered" },
  { value: "minimal", label: "Minimal" }
];

// Datos de ejemplo para la vista previa
const previewData = {
  estimateNumber: "EST-2025-001",
  status: "pending",
  issueDate: new Date().toISOString(),
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  subtotal: 3500,
  tax: 280,
  discount: 200,
  total: 3580,
  terms: "Payment must be made within 30 days of the issue date. Our standard terms and conditions apply.",
  notes: "Prices are subject to change based on material availability. A 30% deposit may be required to begin work.",
  items: [
    {
      description: "High-efficiency window installation",
      quantity: 4,
      unitPrice: 450,
      amount: 1800,
      notes: "Includes aluminum frame and double glazing"
    },
    {
      description: "Interior painting service",
      quantity: 3,
      unitPrice: 300,
      amount: 900,
      notes: "Premium stain-resistant paint"
    },
    {
      description: "Plaster repair and finishing",
      quantity: 1,
      unitPrice: 800,
      amount: 800,
      notes: "Includes materials and labor"
    }
  ],
  client: {
    firstName: "John",
    lastName: "Smith",
    email: "john@example.com",
    phone: "555-123-4567",
    address: "123 Main Street",
    city: "Sample City",
    state: "Sample State",
    zipCode: "12345"
  },
  contractor: {
    businessName: "ABC Construction Services",
    firstName: "Michael",
    lastName: "Johnson",
    email: "info@abcconstruction.com",
    phone: "555-987-6543",
    address: "456 Construction Ave",
    city: "Sample City",
    state: "Sample State",
    zipCode: "54321"
  },
  projectTitle: "Living Room Renovation",
  projectDescription: "Complete renovation project including painting, window installation, and surface repairs."
};

// Función para formatear moneda
const formatCurrency = (amount: number | string = 0) => {
  if (typeof amount === 'string') amount = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(amount);
};

// Función para formatear fecha
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Componente personalizado para los controles de color
const ColorControl = ({
  label,
  value,
  onChange,
  color
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  color: string;
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex space-x-2 items-center">
          <div 
            className="h-6 w-6 rounded border" 
            style={{ backgroundColor: value }}
          ></div>
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            className="w-24 h-8 text-xs" 
          />
        </div>
      </div>
      <div className="pt-2">
        <div className="relative h-10 rounded-md overflow-hidden">
          {/* Background gradient for the color slider */}
          <div 
            className="absolute inset-0 rounded-md" 
            style={{ 
              backgroundImage: color === "primary" 
                ? "linear-gradient(to right, #047857, #0ea5e9, #8b5cf6, #ec4899, #ef4444)" 
                : "linear-gradient(to right, #1e3a8a, #2563eb, #3b82f6, #60a5fa, #93c5fd)" 
            }}
          ></div>
          
          {/* Slider overlay */}
          <div className="absolute inset-0 flex items-center px-2">
            <div className="w-full">
              <input
                type="range"
                min="0"
                max="100"
                className="w-full appearance-none bg-transparent h-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
                onChange={(e) => {
                  // This is a simplified version - in real implementation, this would map slider position to a color
                  const position = parseInt(e.target.value);
                  // Just for demonstration - using hue rotation for color selection
                  const hue = (position * 3.6) % 360; // Convert 0-100 to 0-360 degrees hue
                  onChange(`hsl(${hue}, 70%, 50%)`);
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-8 gap-1 pt-2">
        {["#047857", "#0ea5e9", "#8b5cf6", "#ec4899", "#ef4444", "#eab308", "#3730a3", "#1e293b"].map((color) => (
          <div
            key={color}
            className="h-6 w-full rounded-sm cursor-pointer border hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default function PdfTemplateLuxury() {
  const [config, setConfig] = useState<PdfTemplateConfig>(defaultConfig);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const { toast } = useToast();
  
  // Cargar configuración guardada desde localStorage al iniciar
  useEffect(() => {
    const savedConfig = localStorage.getItem('pdfTemplateConfig');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Error loading saved configuration:", e);
      }
    }
  }, []);
  
  // Función para actualizar la configuración
  const updateConfig = (key: keyof PdfTemplateConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Función para guardar la configuración
  const saveConfig = () => {
    try {
      localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
      
      // Mostrar animación de guardado
      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 2000);
      
      toast({
        title: "Configuration Saved",
        description: "The PDF template configuration has been saved successfully",
      });
    } catch (e) {
      console.error("Error saving configuration:", e);
      toast({
        title: "Error Saving",
        description: "Could not save the configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto">
      <div className="h-full flex flex-col">
        {/* Top Navigation */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Link href="/tools-dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Tools
                </Button>
              </Link>
              <Link href="/pdf-template-gallery">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <LayoutTemplate className="h-4 w-4" />
                  Gallery
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              {saveIndicator && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Saved
                </motion.span>
              )}
              
              <Button variant="outline" onClick={saveConfig}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
              
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="grid h-full" style={{ gridTemplateColumns: '340px 1fr' }}>
            {/* Left Panel - Settings */}
            <div className="border-r border-border overflow-y-auto">
              <div className="p-4 space-y-6">
                <div>
                  <h1 className="text-xl font-bold">PDF Template Builder</h1>
                  <p className="text-sm text-muted-foreground">
                    Customize your document templates
                  </p>
                </div>
                
                <Tabs defaultValue="colors" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="colors" className="flex items-center gap-1 text-xs">
                      <Palette className="h-3.5 w-3.5" />
                      Colors & Style
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center gap-1 text-xs">
                      <FileText className="h-3.5 w-3.5" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="typography" className="flex items-center gap-1 text-xs">
                      <Type className="h-3.5 w-3.5" />
                      Typography
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 space-y-6">
                    {/* Colors & Style Tab */}
                    <TabsContent value="colors" className="space-y-6">
                      <Card className="border-none shadow-none">
                        <CardContent className="p-0 space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Color Scheme</h3>
                            
                            <ColorControl
                              label="Primary Color"
                              value={config.colorPrimary}
                              onChange={(value) => updateConfig('colorPrimary', value)}
                              color="primary"
                            />
                            
                            <ColorControl
                              label="Secondary Color"
                              value={config.colorSecondary}
                              onChange={(value) => updateConfig('colorSecondary', value)}
                              color="secondary"
                            />
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Header Style</h3>
                            <div className="grid gap-2">
                              {headerStyleOptions.map(option => (
                                <div key={option.value} className="flex items-center space-x-2">
                                  <Button
                                    type="button"
                                    variant={config.headerStyle === option.value ? "default" : "outline"}
                                    onClick={() => updateConfig('headerStyle', option.value)}
                                    className="w-full justify-start"
                                  >
                                    {config.headerStyle === option.value && (
                                      <Check className="h-4 w-4 mr-2" />
                                    )}
                                    {option.label}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Table Style</h3>
                            <div className="grid gap-2">
                              {tableStyleOptions.map(option => (
                                <div key={option.value} className="flex items-center space-x-2">
                                  <Button
                                    type="button"
                                    variant={config.tableStyle === option.value ? "default" : "outline"}
                                    onClick={() => updateConfig('tableStyle', option.value)}
                                    className="w-full justify-start"
                                  >
                                    {config.tableStyle === option.value && (
                                      <Check className="h-4 w-4 mr-2" />
                                    )}
                                    {option.label}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Content Tab */}
                    <TabsContent value="content" className="space-y-6">
                      <Card className="border-none shadow-none">
                        <CardContent className="p-0 space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold">General Elements</h3>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="logo" className="text-sm">Show Logo</Label>
                              <Switch
                                id="logo"
                                checked={config.logo}
                                onCheckedChange={(value) => updateConfig('logo', value)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="showHeader" className="text-sm">Show Header</Label>
                              <Switch
                                id="showHeader"
                                checked={config.showHeader}
                                onCheckedChange={(value) => updateConfig('showHeader', value)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="showFooter" className="text-sm">Show Footer</Label>
                              <Switch
                                id="showFooter"
                                checked={config.showFooter}
                                onCheckedChange={(value) => updateConfig('showFooter', value)}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Document Content</h3>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="showClientDetails" className="text-sm">Client Details</Label>
                              <Switch
                                id="showClientDetails"
                                checked={config.showClientDetails}
                                onCheckedChange={(value) => updateConfig('showClientDetails', value)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="showProjectDetails" className="text-sm">Project Details</Label>
                              <Switch
                                id="showProjectDetails"
                                checked={config.showProjectDetails}
                                onCheckedChange={(value) => updateConfig('showProjectDetails', value)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="showItemDetails" className="text-sm">Item Details</Label>
                              <Switch
                                id="showItemDetails"
                                checked={config.showItemDetails}
                                onCheckedChange={(value) => updateConfig('showItemDetails', value)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="showItemNotes" className="text-sm">Item Notes</Label>
                              <Switch
                                id="showItemNotes"
                                checked={config.showItemNotes}
                                onCheckedChange={(value) => updateConfig('showItemNotes', value)}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Additional Sections</h3>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="showTerms" className="text-sm">Terms & Conditions</Label>
                              <Switch
                                id="showTerms"
                                checked={config.showTerms}
                                onCheckedChange={(value) => updateConfig('showTerms', value)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="showNotes" className="text-sm">Notes Section</Label>
                              <Switch
                                id="showNotes"
                                checked={config.showNotes}
                                onCheckedChange={(value) => updateConfig('showNotes', value)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="showSignatureLine" className="text-sm">Signature Line</Label>
                              <Switch
                                id="showSignatureLine"
                                checked={config.showSignatureLine}
                                onCheckedChange={(value) => updateConfig('showSignatureLine', value)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="showDates" className="text-sm">Show Dates</Label>
                              <Switch
                                id="showDates"
                                checked={config.showDates}
                                onCheckedChange={(value) => updateConfig('showDates', value)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    {/* Typography Tab */}
                    <TabsContent value="typography" className="space-y-6">
                      <Card className="border-none shadow-none">
                        <CardContent className="p-0 space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Font Settings</h3>
                            
                            <div className="space-y-2">
                              <Label htmlFor="fontMain" className="text-sm">Main Font</Label>
                              <Select 
                                value={config.fontMain} 
                                onValueChange={(value) => updateConfig('fontMain', value)}
                              >
                                <SelectTrigger id="fontMain">
                                  <SelectValue placeholder="Select font" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fontOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <span style={{ fontFamily: option.value }}>{option.label}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2 pt-4">
                              <div className="flex justify-between">
                                <Label className="text-sm">Font Preview</Label>
                              </div>
                              <div 
                                className="p-3 border rounded-md" 
                                style={{ fontFamily: config.fontMain }}
                              >
                                <p className="text-lg font-bold mb-1">Heading Text</p>
                                <p className="text-sm">This is how your body text will appear in the document. The quick brown fox jumps over the lazy dog.</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
            
            {/* Right Panel - Preview */}
            <div className="bg-gray-50 overflow-y-auto">
              <div className="p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl mx-auto">
                  <div className="p-4 mb-4 bg-white rounded-lg shadow-sm flex justify-between items-center">
                    <h2 className="text-lg font-semibold flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      Document Preview
                    </h2>
                    <div className="flex items-center">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
                        <Brush className="h-3 w-3 mr-1 animate-pulse" />
                        Live updates
                      </span>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-200px)] w-full">
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden mx-auto">
                      {/* Document Header */}
                      {config.showHeader && (
                        <div className={`${
                          config.headerStyle === 'boxed' 
                            ? 'border-b p-6' 
                            : config.headerStyle === 'gradient'
                              ? `bg-gradient-to-r from-[${config.colorPrimary}] to-[${config.colorSecondary}] text-white p-6`
                              : 'p-6'
                        }`}>
                          <div className="flex justify-between items-start">
                            {config.logo && (
                              <div className="w-32 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                                Company Logo
                              </div>
                            )}
                            <div className="text-right">
                              <h2 className="text-2xl font-bold" style={{color: config.headerStyle === 'gradient' ? 'white' : config.colorPrimary || '#1e293b'}}>
                                ESTIMATE
                              </h2>
                              <p>{previewData.estimateNumber}</p>
                              <div className="mt-1 inline-block px-2 py-0.5 text-xs rounded-full" 
                                style={{
                                  backgroundColor: `${config.colorSecondary || '#64748b'}20`,
                                  color: config.headerStyle === 'gradient' ? 'white' : config.colorSecondary || '#64748b'
                                }}>
                                {previewData.status.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Document Content */}
                      <div className="p-6" style={{ fontFamily: config.fontMain }}>
                        {/* Client and Dates Section */}
                        {config.showClientDetails && (
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                              <h3 className="text-sm font-medium mb-1" style={{color: config.colorPrimary}}>
                                CLIENT
                              </h3>
                              <p className="font-medium">
                                {previewData.client.firstName} {previewData.client.lastName}
                              </p>
                              <p className="text-sm">{previewData.client.email}</p>
                              <p className="text-sm">{previewData.client.phone}</p>
                              <p className="text-sm">{previewData.client.address}</p>
                              <p className="text-sm">
                                {previewData.client.city}, {previewData.client.state} {previewData.client.zipCode}
                              </p>
                            </div>
                            <div>
                              {config.showDates && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <h3 className="text-xs font-medium" style={{color: config.colorPrimary}}>ISSUE DATE</h3>
                                    <p className="text-sm">{formatDate(previewData.issueDate)}</p>
                                  </div>
                                  <div>
                                    <h3 className="text-xs font-medium" style={{color: config.colorPrimary}}>EXPIRY DATE</h3>
                                    <p className="text-sm">{formatDate(previewData.expiryDate)}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Project Details */}
                        {config.showProjectDetails && previewData.projectTitle && (
                          <div className="mb-6 border-t border-b py-4">
                            <h3 className="text-md font-medium mb-1" style={{color: config.colorPrimary}}>
                              PROJECT DETAILS
                            </h3>
                            <p className="font-medium">{previewData.projectTitle}</p>
                            <p className="text-sm text-muted-foreground">{previewData.projectDescription}</p>
                          </div>
                        )}

                        {/* Items Table */}
                        <div className="mb-6">
                          <h3 className="text-md font-medium mb-2" style={{color: config.colorPrimary}}>
                            SERVICES
                          </h3>
                          <table className={`w-full text-sm ${
                            config.tableStyle === 'bordered' 
                              ? 'border border-collapse' 
                              : 'border-collapse'
                          }`}>
                            <thead>
                              <tr className={`${
                                config.tableStyle === 'striped' || config.tableStyle === 'bordered'
                                  ? 'bg-gray-50' 
                                  : ''
                              }`}>
                                <th className={`text-left p-2 ${config.tableStyle === 'bordered' ? 'border' : ''}`}>
                                  Description
                                </th>
                                <th className={`text-center p-2 ${config.tableStyle === 'bordered' ? 'border' : ''}`}>
                                  Qty
                                </th>
                                <th className={`text-right p-2 ${config.tableStyle === 'bordered' ? 'border' : ''}`}>
                                  Price
                                </th>
                                <th className={`text-right p-2 ${config.tableStyle === 'bordered' ? 'border' : ''}`}>
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.items.map((item, index) => (
                                <tr key={index} className={`${
                                  config.tableStyle === 'striped' && index % 2 === 1 
                                    ? 'bg-gray-50' 
                                    : ''
                                }`}>
                                  <td className={`p-2 ${config.tableStyle === 'bordered' ? 'border' : ''}`}>
                                    <div>{item.description}</div>
                                    {config.showItemNotes && item.notes && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {item.notes}
                                      </div>
                                    )}
                                  </td>
                                  <td className={`text-center p-2 ${config.tableStyle === 'bordered' ? 'border' : ''}`}>
                                    {item.quantity}
                                  </td>
                                  <td className={`text-right p-2 ${config.tableStyle === 'bordered' ? 'border' : ''}`}>
                                    {formatCurrency(item.unitPrice)}
                                  </td>
                                  <td className={`text-right p-2 ${config.tableStyle === 'bordered' ? 'border' : ''}`}>
                                    {formatCurrency(item.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end mb-6">
                          <div className="w-64">
                            <div className="flex justify-between py-2">
                              <span>Subtotal</span>
                              <span>{formatCurrency(previewData.subtotal)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span>Tax (8%)</span>
                              <span>{formatCurrency(previewData.tax)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span>Discount</span>
                              <span>-{formatCurrency(previewData.discount)}</span>
                            </div>
                            <div className="flex justify-between py-2 font-bold border-t">
                              <span>Total</span>
                              <span style={{color: config.colorPrimary}}>
                                {formatCurrency(previewData.total)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Terms and Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {config.showTerms && (
                            <div>
                              <h3 className="text-sm font-medium mb-2" style={{color: config.colorPrimary}}>
                                TERMS & CONDITIONS
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {previewData.terms}
                              </p>
                            </div>
                          )}
                          
                          {config.showNotes && (
                            <div>
                              <h3 className="text-sm font-medium mb-2" style={{color: config.colorPrimary}}>
                                NOTES
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {previewData.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Signature Lines */}
                        {config.showSignatureLine && (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="border-t pt-4">
                              <p className="text-sm text-center text-muted-foreground mb-1">Client Signature</p>
                              <div className="h-16 border border-dashed rounded flex items-center justify-center text-xs text-muted-foreground">
                                Signature Required
                              </div>
                            </div>
                            <div className="border-t pt-4">
                              <p className="text-sm text-center text-muted-foreground mb-1">Contractor Signature</p>
                              <div className="h-16 border rounded flex items-center justify-center text-xs text-muted-foreground">
                                Digital Signature
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        {config.showFooter && (
                          <div className="text-center text-xs text-muted-foreground mt-10 pt-6 border-t">
                            <p>Thank you for your business!</p>
                            <p>{previewData.contractor.businessName} • {previewData.contractor.address}, {previewData.contractor.city} • {previewData.contractor.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}