import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EnhancedColorPicker } from "@/components/ui/enhanced-color-picker";
import { ColorPicker } from "@/components/ui/color-picker";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Save, Image, FileText, Layout, Palette, Columns, Type, Info, LayoutTemplate, Eye, ArrowLeft, Home, Loader2, Settings } from "lucide-react";
import ServicesConfig from "./services-config";

import { PdfTemplateConfig } from "./pdf-template-settings";

// Tipos para PDFs
interface EstimateData {
  estimateNumber: string;
  date?: string | Date;
  issueDate?: Date;
  expiryDate?: Date;
  client: Record<string, any>;
  contractor: Record<string, any>;
  items?: any[]; // La estructura actual usa 'items' en lugar de 'services'
  services?: any[]; // Para compatibilidad con versiones anteriores
  subtotal?: number;
  tax?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  notes?: string;
  status?: string;
  terms?: string;
  [key: string]: any;
}

interface InvoiceData {
  invoiceNumber: string;
  date?: string | Date;
  issueDate?: Date;
  dueDate?: Date;
  client: Record<string, any>;
  contractor: Record<string, any>;
  items?: any[]; // La estructura actual usa 'items' en lugar de 'services'
  services?: any[]; // Para compatibilidad con versiones anteriores
  subtotal?: number;
  tax?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  notes?: string;
  status?: string;
  terms?: string;
  amountPaid?: number;
  [key: string]: any;
}

// Importación dinámica de funciones PDF para vista previa (no descarga)
async function getGenerateEstimatePDF() {
  const pdfModule = await import('@/lib/pdf-generator');
  return pdfModule.generateEstimatePDF;
}

async function getGenerateInvoicePDF() {
  const pdfModule = await import('@/lib/pdf-generator');
  return pdfModule.generateInvoicePDF;
}

// Sample data for previews
const sampleEstimate = {
  estimateNumber: "EST-12345",
  status: "draft",
  issueDate: new Date(),
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  subtotal: 750,
  tax: 60,
  discount: 50,
  total: 760,
  terms: "Payment due within 30 days of acceptance. This estimate is valid for 30 days.",
  notes: "Please contact us if you have any questions about this estimate.",
  items: [
    {
      service: "Basic Package",
      description: "Professional consultation service with comprehensive setup",
      quantity: 1,
      unitPrice: 500,
      amount: 500,
      notes: "Includes basic consultation and setup"
    },
    {
      service: "Support Hours",
      description: "Additional technical support and maintenance",
      quantity: 5,
      unitPrice: 50,
      amount: 250,
      notes: "Scheduled within 30 days of service"
    }
  ],
  client: {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St",
    city: "Anytown",
    state: "CA",
    zipCode: "90210"
  },
  contractor: {
    businessName: "Professional Services LLC",
    firstName: "Jane",
    lastName: "Contractor",
    email: "info@professionalservices.com",
    phone: "(555) 987-6543",
    address: "456 Business Ave",
    city: "Enterprise",
    state: "CA",
    zipCode: "90211"
  },
  projectTitle: "Website Redesign Project",
  projectDescription: "Complete overhaul of company website with modern design and mobile optimization."
};

const sampleInvoice = {
  invoiceNumber: "INV-12345",
  status: "pending",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
  subtotal: 750,
  tax: 60,
  discount: 50,
  total: 760,
  amountPaid: 0,
  terms: "Payment due within 15 days. Late payments subject to a 5% fee.",
  notes: "Thank you for your business!",
  items: [
    {
      service: "Basic Package",
      description: "Professional consultation service with comprehensive setup",
      quantity: 1,
      unitPrice: 500,
      amount: 500,
      notes: "Service provided on " + new Date().toLocaleDateString()
    },
    {
      service: "Support Hours",
      description: "Additional technical support and maintenance",
      quantity: 5,
      unitPrice: 50,
      amount: 250,
      notes: "Additional support as requested"
    }
  ],
  client: {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St",
    city: "Anytown",
    state: "CA",
    zipCode: "90210"
  },
  contractor: {
    businessName: "Professional Services LLC",
    firstName: "Jane",
    lastName: "Contractor",
    email: "info@professionalservices.com",
    phone: "(555) 987-6543",
    address: "456 Business Ave",
    city: "Enterprise",
    state: "CA",
    zipCode: "90211"
  },
  projectTitle: "Website Redesign Project",
  projectDescription: "Complete overhaul of company website with modern design and mobile optimization.",
  paymentMethod: "Bank Transfer"
};

// Pre-defined template styles
const presetTemplates = {
  business: {
    colorPrimary: "#003366",
    colorSecondary: "#336699",
    fontMain: "Inter",
    headerStyle: 'gradient' as const,
    tableStyle: 'bordered' as const,
    showHeader: true,
    showFooter: true,
    showItemDetails: true,
    showItemNotes: true,
    showProjectDetails: true,
    showClientDetails: true,
    showTerms: true,
    showNotes: true,
    showSignatureLine: true,
    showDates: true,
    showColumns: {
      service: true,
      description: true,
      quantity: true,
      unitPrice: true,
      amount: true,
      notes: true
    }
  },
  minimal: {
    colorPrimary: "#1e293b",
    colorSecondary: "#64748b",
    fontMain: "Inter",
    headerStyle: 'simple' as const,
    tableStyle: 'minimal' as const,
    showHeader: true,
    showFooter: false,
    showItemDetails: true,
    showItemNotes: false,
    showProjectDetails: false,
    showClientDetails: true,
    showTerms: true,
    showNotes: false,
    showSignatureLine: true,
    showDates: true,
    showColumns: {
      service: true,
      description: true,
      quantity: true,
      unitPrice: true,
      amount: true,
      notes: false
    }
  },
  elegant: {
    colorPrimary: "#6d28d9",
    colorSecondary: "#4f46e5",
    fontMain: "Inter",
    headerStyle: 'boxed' as const,
    tableStyle: 'striped' as const,
    showHeader: true,
    showFooter: true,
    showItemDetails: true,
    showItemNotes: true,
    showProjectDetails: true,
    showClientDetails: true,
    showTerms: true,
    showNotes: true,
    showSignatureLine: true,
    showDates: true,
    showColumns: {
      service: true,
      description: true,
      quantity: true,
      unitPrice: true,
      amount: true,
      notes: true
    }
  },
  modern: {
    colorPrimary: "#0f766e",
    colorSecondary: "#2563eb",
    fontMain: "Inter",
    headerStyle: 'gradient' as const,
    tableStyle: 'bordered' as const,
    showHeader: true,
    showFooter: true,
    showItemDetails: true,
    showItemNotes: true,
    showProjectDetails: true,
    showClientDetails: true,
    showTerms: true,
    showNotes: true,
    showSignatureLine: true,
    showDates: true,
    showColumns: {
      service: true,
      description: true,
      quantity: true,
      unitPrice: true,
      amount: true,
      notes: true
    }
  },
  vibrant: {
    colorPrimary: "#be123c",
    colorSecondary: "#db2777",
    fontMain: "Inter",
    headerStyle: 'boxed' as const, 
    tableStyle: 'striped' as const,
    showHeader: true,
    showFooter: true,
    showItemDetails: true,
    showItemNotes: true,
    showProjectDetails: true,
    showClientDetails: true,
    showTerms: true,
    showNotes: true,
    showSignatureLine: true,
    showDates: true,
    showColumns: {
      service: true,
      description: true,
      quantity: true,
      unitPrice: true,
      amount: true,
      notes: true
    }
  }
};

// Default configuration
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
  showColumns: {
    service: true,
    description: true,
    quantity: true,
    unitPrice: true,
    amount: true,
    notes: true
  }
};

interface EnhancedPdfTemplateEditorProps {
  initialConfig?: Partial<PdfTemplateConfig>;
  onSave?: (config: PdfTemplateConfig) => void;
  onBack?: () => void;
  onHome?: () => void;
}

export default function EnhancedPdfTemplateEditor({
  initialConfig,
  onSave,
  onBack,
  onHome
}: EnhancedPdfTemplateEditorProps) {
  const [config, setConfig] = useState<PdfTemplateConfig>({
    ...defaultConfig,
    ...initialConfig
  });
  
  const [activeTab, setActiveTab] = useState("style");
  const [previewType, setPreviewType] = useState<"estimate" | "invoice">("estimate");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0); // Used to force re-render of preview
  
  const { toast } = useToast();

  // Save template config to localStorage
  useEffect(() => {
    localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
    // Update preview whenever config changes
    setPreviewKey(prev => prev + 1);
  }, [config]);

  // Handle config updates
  const updateConfig = <K extends keyof PdfTemplateConfig>(
    key: K,
    value: PdfTemplateConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Apply a preset template
  const applyTemplate = (templateName: keyof typeof presetTemplates) => {
    const template = presetTemplates[templateName];
    setConfig({ ...config, ...template });
    
    // Update localStorage immediately to ensure preview is updated
    localStorage.setItem('pdfTemplateConfig', JSON.stringify({ ...config, ...template }));
    
    toast({
      title: "Template Applied",
      description: `The ${templateName} template has been applied.`,
      variant: "default",
    });
  };

  // Generate preview
  // Función personalizada que solo genera el PDF de estimate sin descargarlo
  const previewEstimatePDF = async (estimate: EstimateData): Promise<Blob> => {
    try {
      const generateEstimatePDF = await getGenerateEstimatePDF();
      return await generateEstimatePDF(estimate);
    } catch (error) {
      console.error("Error previewing estimate PDF:", error);
      return new Blob([], { type: 'application/pdf' });
    }
  };
  
  // Función personalizada que solo genera el PDF de invoice sin descargarlo
  const previewInvoicePDF = async (invoice: InvoiceData): Promise<Blob> => {
    try {
      const generateInvoicePDF = await getGenerateInvoicePDF();
      return await generateInvoicePDF(invoice);
    } catch (error) {
      console.error("Error previewing invoice PDF:", error);
      return new Blob([], { type: 'application/pdf' });
    }
  };

  const generatePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      // Force localStorage update
      localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
      
      // Generar y mostrar el PDF
      let blob: Blob;
      
      if (previewType === "estimate") {
        blob = await previewEstimatePDF(sampleEstimate);
      } else {
        blob = await previewInvoicePDF(sampleInvoice);
      }
      
      // Create an object URL for the blob
      const url = URL.createObjectURL(blob);
      const previewFrame = document.getElementById('pdf-preview-frame') as HTMLIFrameElement;
      if (previewFrame) {
        previewFrame.src = url;
      }
      
    } catch (error) {
      console.error("Error generating preview:", error);
      toast({
        title: "Preview Error",
        description: "There was an error generating the preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [config, previewType, toast]);

  // Generate preview when config changes
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 500); // Debounce preview generation
    
    return () => clearTimeout(timer);
  }, [config, previewType, generatePreview]);

  // Handle save
  const handleSave = () => {
    localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
    
    if (onSave) {
      onSave(config);
    }
    
    toast({
      title: "Template Saved",
      description: "Your template settings have been saved successfully.",
      variant: "default",
    });
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {onHome && (
              <Button variant="outline" size="sm" onClick={onHome}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            )}
            <h2 className="text-2xl font-bold">PDF Template Configuration</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={generatePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Refresh Preview
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Configure the appearance of your documents with live preview. Changes update automatically.</p>
          
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button 
              variant={previewType === "estimate" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPreviewType("estimate")}
              className="rounded-md"
            >
              <FileText className="h-4 w-4 mr-2" />
              Estimate
            </Button>
            <Button 
              variant={previewType === "invoice" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPreviewType("invoice")}
              className="rounded-md"
            >
              <FileText className="h-4 w-4 mr-2" />
              Invoice
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left sidebar with settings */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4">
          <Card className="h-full shadow-md">
            <CardHeader className="bg-muted/50 pb-2">
              <CardTitle>Template Settings</CardTitle>
              <CardDescription>
                Customize your PDF template appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="presets" className="flex items-center gap-1">
                    <LayoutTemplate className="h-4 w-4" />
                    <span className="hidden sm:inline">Presets</span>
                  </TabsTrigger>
                  <TabsTrigger value="style" className="flex items-center gap-1">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Style</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="columns" className="flex items-center gap-1">
                    <Columns className="h-4 w-4" />
                    <span className="hidden sm:inline">Columns</span>
                  </TabsTrigger>
                  <TabsTrigger value="services" className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Services</span>
                  </TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[calc(100vh-270px)] mt-4 pr-4">
                  <TabsContent value="presets" className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose a preset template style to quickly apply a professional look
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(presetTemplates).map(([name, _]) => (
                        <Card key={name} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-2"
                             onClick={() => applyTemplate(name as keyof typeof presetTemplates)}>
                          <div className="flex flex-col items-center text-center">
                            <div className="w-full h-16 mb-2 flex items-center justify-center rounded-md"
                                 style={{ backgroundColor: presetTemplates[name as keyof typeof presetTemplates].colorPrimary }}>
                              <div className="w-1/2 h-4 rounded-sm bg-white/80"></div>
                            </div>
                            <span className="text-sm font-medium capitalize">{name}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="style" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <EnhancedColorPicker
                          value={config.colorPrimary}
                          onChange={(color) => updateConfig('colorPrimary', color)}
                          color={config.colorPrimary}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <EnhancedColorPicker
                          value={config.colorSecondary}
                          onChange={(color) => updateConfig('colorSecondary', color)}
                          color={config.colorSecondary}
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label>Font Family</Label>
                        <Select
                          value={config.fontMain}
                          onValueChange={(value) => updateConfig('fontMain', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="helvetica">Helvetica</SelectItem>
                            <SelectItem value="courier">Courier</SelectItem>
                            <SelectItem value="times">Times</SelectItem>
                            <SelectItem value="Inter">Inter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label>Header Style</Label>
                        <Select
                          value={config.headerStyle}
                          onValueChange={(value: 'simple' | 'gradient' | 'boxed') => 
                            updateConfig('headerStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select header style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">Simple</SelectItem>
                            <SelectItem value="gradient">Gradient</SelectItem>
                            <SelectItem value="boxed">Boxed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label>Table Style</Label>
                        <Select
                          value={config.tableStyle}
                          onValueChange={(value: 'striped' | 'bordered' | 'minimal') => 
                            updateConfig('tableStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select table style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="striped">Striped</SelectItem>
                            <SelectItem value="bordered">Bordered</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <h3 className="text-base font-medium">Main Elements</h3>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="logo" className="cursor-pointer flex items-center">
                          <Image className="h-4 w-4 mr-2 text-muted-foreground" />
                          Show Logo
                        </Label>
                        <Switch 
                          id="logo" 
                          checked={config.logo} 
                          onCheckedChange={value => updateConfig('logo', value)} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showHeader" className="cursor-pointer">
                          Show Header
                        </Label>
                        <Switch 
                          id="showHeader" 
                          checked={config.showHeader} 
                          onCheckedChange={value => updateConfig('showHeader', value)} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showFooter" className="cursor-pointer">
                          Show Footer
                        </Label>
                        <Switch 
                          id="showFooter" 
                          checked={config.showFooter} 
                          onCheckedChange={value => updateConfig('showFooter', value)} 
                        />
                      </div>
                      
                      <Separator className="my-2" />
                      <h3 className="text-base font-medium">Document Details</h3>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showItemDetails" className="cursor-pointer">
                          Show Item Details
                        </Label>
                        <Switch 
                          id="showItemDetails" 
                          checked={config.showItemDetails} 
                          onCheckedChange={value => updateConfig('showItemDetails', value)} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showItemNotes" className="cursor-pointer">
                          Show Item Notes
                        </Label>
                        <Switch 
                          id="showItemNotes" 
                          checked={config.showItemNotes} 
                          onCheckedChange={value => updateConfig('showItemNotes', value)} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showProjectDetails" className="cursor-pointer">
                          Show Project Details
                        </Label>
                        <Switch 
                          id="showProjectDetails" 
                          checked={config.showProjectDetails} 
                          onCheckedChange={value => updateConfig('showProjectDetails', value)} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showClientDetails" className="cursor-pointer">
                          Show Client Details
                        </Label>
                        <Switch 
                          id="showClientDetails" 
                          checked={config.showClientDetails} 
                          onCheckedChange={value => updateConfig('showClientDetails', value)} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showTerms" className="cursor-pointer">
                          Show Terms & Conditions
                        </Label>
                        <Switch 
                          id="showTerms" 
                          checked={config.showTerms} 
                          onCheckedChange={value => updateConfig('showTerms', value)} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showNotes" className="cursor-pointer">
                          Show Notes
                        </Label>
                        <Switch 
                          id="showNotes" 
                          checked={config.showNotes} 
                          onCheckedChange={value => updateConfig('showNotes', value)} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showSignatureLine" className="cursor-pointer">
                          Show Signature Line
                        </Label>
                        <Switch 
                          id="showSignatureLine" 
                          checked={config.showSignatureLine} 
                          onCheckedChange={value => updateConfig('showSignatureLine', value)} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showDates" className="cursor-pointer">
                          Show Dates
                        </Label>
                        <Switch 
                          id="showDates" 
                          checked={config.showDates} 
                          onCheckedChange={value => updateConfig('showDates', value)} 
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="columns" className="space-y-4">
                    <h3 className="text-base font-medium">Table Columns</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select which columns to display in the document table
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="description-column"
                          checked={config.showColumns.description}
                          onCheckedChange={(checked) => 
                            updateConfig('showColumns', {...config.showColumns, description: !!checked})
                          }
                        />
                        <Label htmlFor="description-column" className="cursor-pointer">
                          Description Column
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="quantity-column"
                          checked={config.showColumns.quantity}
                          onCheckedChange={(checked) => 
                            updateConfig('showColumns', {...config.showColumns, quantity: !!checked})
                          }
                        />
                        <Label htmlFor="quantity-column" className="cursor-pointer">
                          Quantity Column
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="unit-price-column"
                          checked={config.showColumns.unitPrice}
                          onCheckedChange={(checked) => 
                            updateConfig('showColumns', {...config.showColumns, unitPrice: !!checked})
                          }
                        />
                        <Label htmlFor="unit-price-column" className="cursor-pointer">
                          Unit Price Column
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="amount-column"
                          checked={config.showColumns.amount}
                          onCheckedChange={(checked) => 
                            updateConfig('showColumns', {...config.showColumns, amount: !!checked})
                          }
                        />
                        <Label htmlFor="amount-column" className="cursor-pointer">
                          Total Amount Column
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="notes-column"
                          checked={config.showColumns.notes}
                          disabled={!config.showItemNotes}
                          onCheckedChange={(checked) => 
                            updateConfig('showColumns', {...config.showColumns, notes: !!checked})
                          }
                        />
                        <Label 
                          htmlFor="notes-column" 
                          className={`cursor-pointer ${!config.showItemNotes ? 'text-muted-foreground' : ''}`}
                        >
                          Notes Column {!config.showItemNotes && "(Enable Item Notes first)"}
                        </Label>
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right side with preview */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8">
          <Card className="h-full shadow-md">
            <CardHeader className="bg-muted/50 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    See changes in real-time as you customize your template
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-normal text-sm">
                  {previewType === "estimate" ? "Estimate" : "Invoice"} Template
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="relative rounded-lg border shadow-inner" style={{ height: 'calc(100vh - 220px)', backgroundColor: 'white' }}>
                {previewLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 backdrop-blur-sm">
                    <div className="flex flex-col items-center space-y-3 bg-card p-6 rounded-lg shadow-lg">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <span className="font-medium">Generating preview...</span>
                    </div>
                  </div>
                )}
                <iframe 
                  id="pdf-preview-frame"
                  key={previewKey}
                  title="PDF Preview"
                  className="w-full h-full rounded-md"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}