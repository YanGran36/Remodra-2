import React, { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ColorPicker } from "@/components/ui/color-picker";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, 
  FileText, 
  Palette, 
  Settings, 
  Eye, 
  ArrowLeft, 
  Loader2, 
  Image,
  Check
} from "lucide-react";
import ServicesConfig from "./services-config";
import { PdfTemplateConfig } from "./pdf-template-settings";

interface EstimateData {
  estimateNumber: string;
  date: string | Date;
  issueDate?: Date;
  expiryDate?: Date;
  client: Record<string, any>;
  contractor: Record<string, any>;
  items: any[];
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  notes?: string;
  status: string;
  terms?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string | Date;
  issueDate?: Date;
  dueDate?: Date;
  client: Record<string, any>;
  contractor: Record<string, any>;
  items: any[];
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  notes?: string;
  status: string;
  terms?: string;
  amountPaid?: number;
}

interface SimplifiedPdfTemplateEditorProps {
  initialConfig?: Partial<PdfTemplateConfig>;
  onSave?: (config: PdfTemplateConfig) => void;
  onBack?: () => void;
  onHome?: () => void;
}

// Sample estimate data
const sampleEstimate: EstimateData = {
  estimateNumber: "EST-001",
  date: new Date(),
  issueDate: new Date(),
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  client: {
    name: "Sample Client",
    email: "client@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Sample City, SC 12345"
  },
  contractor: {
    name: "Contractor Company",
    email: "contact@contractor.com",
    phone: "(555) 987-6543",
    address: "456 Business Ave, Sample City, SC 54321",
    logo: "https://via.placeholder.com/150"
  },
  items: [
    {
      description: "Electrical Installation",
      quantity: 1,
      unitPrice: 850.00,
      unit: "service",
      amount: 850.00
    },
    {
      description: "Premium Electrical Materials",
      quantity: 1,
      unitPrice: 425.50,
      unit: "package",
      amount: 425.50
    },
    {
      description: "Additional Labor",
      quantity: 5,
      unitPrice: 75.00,
      unit: "hour",
      amount: 375.00
    }
  ],
  subtotal: 1650.50,
  taxRate: 8.25,
  tax: 136.17,
  total: 1701.67,
  notes: "This is a sample estimate. Prices may vary based on site conditions.",
  status: "pending",
  terms: "Payment is required within 30 days of estimate acceptance."
};

// Sample invoice data
const sampleInvoice: InvoiceData = {
  invoiceNumber: "INV-001",
  date: new Date(),
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  client: {
    name: "Sample Client",
    email: "client@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Sample City, SC 12345"
  },
  contractor: {
    name: "Contractor Company",
    email: "contact@contractor.com",
    phone: "(555) 987-6543",
    address: "456 Business Ave, Sample City, SC 54321",
    logo: "https://via.placeholder.com/150"
  },
  items: [
    {
      description: "Electrical Installation",
      quantity: 1,
      unitPrice: 850.00,
      unit: "service",
      amount: 850.00
    },
    {
      description: "Premium Electrical Materials",
      quantity: 1,
      unitPrice: 425.50,
      unit: "package",
      amount: 425.50
    },
    {
      description: "Additional Labor",
      quantity: 5,
      unitPrice: 75.00,
      unit: "hour",
      amount: 375.00
    }
  ],
  subtotal: 1650.50,
  taxRate: 8.25,
  tax: 136.17,
  total: 1701.67,
  amountPaid: 0,
  notes: "This is a sample invoice. Please make payment by the due date.",
  status: "pending",
  terms: "Payment is required within 15 days of invoice issuance."
};

export default function SimplifiedPdfTemplateEditor({
  initialConfig,
  onSave,
  onBack,
  onHome,
}: SimplifiedPdfTemplateEditorProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewType, setPreviewType] = useState<"estimate" | "invoice">("estimate");
  
  const { toast } = useToast();
  
  // Get saved config or use defaults
  const [config, setConfig] = useState<PdfTemplateConfig>(() => {
    const savedConfig = localStorage.getItem('pdfTemplateConfig');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig) as PdfTemplateConfig;
      } catch (e) {
        console.error("Error parsing saved config:", e);
      }
    }
    
    // Use initial config or default configuration
    return initialConfig as PdfTemplateConfig || {
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
  });

  // Preview PDF generation
  const generatePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      // Save config to localStorage
      localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
      
      // For simplicity, let's generate a visual representation of the PDF using HTML
      const previewWindow = window.open('', '_blank');
      
      if (!previewWindow) {
        throw new Error("Unable to open preview window. Please allow popups for this site.");
      }
      
      // Create a simple HTML preview that matches the style of a real PDF
      const previewType = "estimate"; // Default to estimate preview
      const pdfData = previewType === "estimate" ? sampleEstimate : sampleInvoice;
      
      // Apply the template configuration
      const primaryColor = config.colorPrimary || "#0f766e";
      const secondaryColor = config.colorSecondary || "#2563eb";
      
      // Create a sample PDF preview HTML
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${previewType.toUpperCase()} Preview</title>
            <style>
              body { 
                font-family: ${config.fontMain || 'Arial, sans-serif'}; 
                margin: 0; 
                padding: 20px;
                color: #333;
              }
              .pdf-container {
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #ddd;
                padding: 40px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                ${config.headerStyle === 'gradient' ? 'background: linear-gradient(to right, #f7fafc, #edf2f7); padding: 20px;' : ''}
              }
              .title {
                color: ${primaryColor};
                font-size: 28px;
                font-weight: bold;
                margin: 0;
              }
              .company-info {
                font-size: 14px;
              }
              .info-sections {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
              }
              .info-section {
                width: 48%;
              }
              .section-title {
                color: ${primaryColor};
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              table {
                width: 100%;
                border-collapse: ${config.tableStyle === 'bordered' ? 'collapse' : 'separate'};
                margin-bottom: 30px;
              }
              th {
                background-color: ${primaryColor};
                color: white;
                text-align: left;
                padding: 10px;
              }
              td {
                padding: 10px;
                border-bottom: 1px solid #ddd;
              }
              ${config.tableStyle === 'striped' ? 'tr:nth-child(even) { background-color: #f9f9f9; }' : ''}
              ${config.tableStyle === 'bordered' ? 'th, td { border: 1px solid #ddd; }' : ''}
              .totals {
                margin-left: auto;
                width: 40%;
                margin-bottom: 30px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
              }
              .grand-total {
                font-weight: bold;
                border-top: 2px solid ${primaryColor};
                padding-top: 5px;
              }
              .footer {
                margin-top: 50px;
                border-top: 1px solid #ddd;
                padding-top: 20px;
                font-size: 12px;
              }
              .signature-line {
                margin-top: 40px;
                border-top: 1px solid #000;
                width: 200px;
                padding-top: 5px;
              }
            </style>
          </head>
          <body>
            <div class="pdf-container">
              <!-- Header -->
              <div class="header">
                <div>
                  <h1 class="title">ESTIMATE</h1>
                  <p>Estimate #${pdfData.estimateNumber}</p>
                </div>
                <div class="company-info">
                  <strong>${pdfData.contractor.businessName}</strong><br>
                  ${pdfData.contractor.address || ''}<br>
                  ${pdfData.contractor.phone || ''}<br>
                  ${pdfData.contractor.email || ''}
                </div>
              </div>
              
              <!-- Info Sections -->
              <div class="info-sections">
                <!-- Client Section -->
                ${config.showClientDetails ? `
                <div class="info-section">
                  <div class="section-title">BILL TO</div>
                  <p>
                    ${pdfData.client.firstName} ${pdfData.client.lastName}<br>
                    ${pdfData.client.address || ''}<br>
                    ${pdfData.client.city ? pdfData.client.city + ', ' : ''}${pdfData.client.state || ''} ${pdfData.client.zipCode || ''}<br>
                    ${pdfData.client.email || ''}<br>
                    ${pdfData.client.phone || ''}
                  </p>
                </div>` : ''}
                
                <!-- Details Section -->
                <div class="info-section">
                  <div class="section-title">ESTIMATE DETAILS</div>
                  <p>
                    <strong>Date:</strong> ${new Date(pdfData.issueDate).toLocaleDateString()}<br>
                    ${pdfData.expiryDate ? `<strong>Expiration:</strong> ${new Date(pdfData.expiryDate).toLocaleDateString()}<br>` : ''}
                    <strong>Status:</strong> ${pdfData.status.toUpperCase()}<br>
                    ${pdfData.projectTitle ? `<strong>Project:</strong> ${pdfData.projectTitle}<br>` : ''}
                  </p>
                </div>
              </div>
              
              <!-- Items Table -->
              ${config.showItemDetails ? `
              <table>
                <thead>
                  <tr>
                    ${config.showColumns?.service ? '<th>Service</th>' : ''}
                    ${config.showColumns?.description ? '<th>Description</th>' : ''}
                    ${config.showColumns?.quantity ? '<th>Qty</th>' : ''}
                    ${config.showColumns?.unitPrice ? '<th>Rate</th>' : ''}
                    ${config.showColumns?.amount ? '<th>Amount</th>' : ''}
                    ${config.showItemNotes && config.showColumns?.notes ? '<th>Notes</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${pdfData.items.map((item, i) => `
                    <tr>
                      ${config.showColumns?.service ? `<td>${item.service || ''}</td>` : ''}
                      ${config.showColumns?.description ? `<td>${item.description}</td>` : ''}
                      ${config.showColumns?.quantity ? `<td>${item.quantity}</td>` : ''}
                      ${config.showColumns?.unitPrice ? `<td>$${Number(item.unitPrice).toFixed(2)}</td>` : ''}
                      ${config.showColumns?.amount ? `<td>$${Number(item.amount).toFixed(2)}</td>` : ''}
                      ${config.showItemNotes && config.showColumns?.notes ? `<td>${item.notes || ''}</td>` : ''}
                    </tr>
                  `).join('')}
                </tbody>
              </table>` : ''}
              
              <!-- Totals -->
              <div class="totals">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>$${Number(pdfData.subtotal).toFixed(2)}</span>
                </div>
                ${pdfData.tax ? `
                <div class="total-row">
                  <span>Tax:</span>
                  <span>$${Number(pdfData.tax).toFixed(2)}</span>
                </div>` : ''}
                ${pdfData.discount ? `
                <div class="total-row">
                  <span>Discount:</span>
                  <span>-$${Number(pdfData.discount).toFixed(2)}</span>
                </div>` : ''}
                <div class="total-row grand-total">
                  <span>Total:</span>
                  <span>$${Number(pdfData.total).toFixed(2)}</span>
                </div>
              </div>
              
              <!-- Terms & Notes -->
              ${config.showTerms && pdfData.terms ? `
              <div>
                <div class="section-title">NOTE TO CUSTOMER</div>
                <p>${pdfData.terms}</p>
              </div>` : ''}
              
              ${config.showNotes && pdfData.notes ? `
              <div>
                <div class="section-title">NOTES</div>
                <p>${pdfData.notes}</p>
              </div>` : ''}
              
              <!-- Signature Line -->
              ${config.showSignatureLine ? `
              <div>
                <p><strong>Please sign to accept this estimate:</strong></p>
                <div style="display: flex; justify-content: space-between; width: 80%;">
                  <div>
                    <div class="signature-line"></div>
                    <p>Date</p>
                  </div>
                  <div>
                    <div class="signature-line"></div>
                    <p>Signature</p>
                  </div>
                </div>
              </div>` : ''}
              
              <!-- Footer -->
              ${config.showFooter ? `
              <div class="footer">
                <p>Thank you for your business!</p>
              </div>` : ''}
            </div>
          </body>
        </html>
      `);
      
      previewWindow.document.close();
      
      toast({
        title: "Preview Generated",
        description: "Your template preview has been generated in a new window"
      });
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

  // Save configuration
  const handleSave = async () => {
    try {
      // Add metadata for better tracking
      const templateToSave = {
        ...config,
        // Add metadata fields that aren't in the PdfTemplateConfig type
        templateId: `template-${Date.now()}`,
        templateName: "My Custom Template",
        templateCreatedAt: new Date().toISOString(),
        templateUpdatedAt: new Date().toISOString(),
        templateType: previewType, // Save the template type (estimate or invoice)
      };
      
      // Save to localStorage with additional metadata
      localStorage.setItem('pdfTemplateConfig', JSON.stringify(templateToSave));
      
      // Create a separate entry for this specific template
      const savedTemplates = JSON.parse(localStorage.getItem('savedPdfTemplates') || '[]');
      const existingIndex = savedTemplates.findIndex((t: any) => t.id === templateToSave.id);
      
      if (existingIndex >= 0) {
        // Update existing template
        savedTemplates[existingIndex] = templateToSave;
      } else {
        // Add new template
        savedTemplates.push(templateToSave);
      }
      
      // Save the updated templates list
      localStorage.setItem('savedPdfTemplates', JSON.stringify(savedTemplates));
      
      // Call the onSave callback if provided
      if (onSave) {
        onSave(templateToSave);
      }
      
      // Generate a preview to confirm the template works
      await generatePreview();
      
      toast({
        title: "Template Saved Successfully",
        description: "Your PDF template has been saved and can now be used for estimates and invoices.",
      });
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Save Error",
        description: "There was an error saving your template. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update config
  const updateConfig = <K extends keyof PdfTemplateConfig>(
    key: K,
    value: PdfTemplateConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Update columns config
  const updateColumnsConfig = (columnKey: keyof typeof config.showColumns, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      showColumns: {
        ...prev.showColumns,
        [columnKey]: value
      }
    }));
  };

  return (
    <div className="container mx-auto py-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" size="icon" onClick={onBack} title="Back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="text-2xl">PDF Template Editor</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {onHome && (
                <Button variant="outline" size="sm" onClick={onHome} className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Services
                </Button>
              )}
              <Button variant="default" size="sm" onClick={handleSave} className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </div>
          <CardDescription>
            Customize the appearance of your estimates and invoices with these settings.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="col-span-1 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Customization Options</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="content" value={activeTab} onValueChange={(value) => setActiveTab(value)}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="content" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="style" className="flex items-center">
                    <Palette className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Style</span>
                  </TabsTrigger>
                  <TabsTrigger value="columns" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Columns</span>
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[calc(100vh-400px)] mt-4 overflow-y-auto pr-4">
                  {/* Content Tab */}
                  <TabsContent value="content" className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-base font-medium">Layout Elements</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="logo" className="cursor-pointer flex items-center">
                            <Image className="h-4 w-4 mr-2 text-muted-foreground" />
                            Show Logo
                          </Label>
                          <Switch 
                            id="logo" 
                            checked={config.logo} 
                            onCheckedChange={(checked) => updateConfig("logo", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showHeader" className="cursor-pointer">
                            Show Header
                          </Label>
                          <Switch 
                            id="showHeader" 
                            checked={config.showHeader} 
                            onCheckedChange={(checked) => updateConfig("showHeader", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showFooter" className="cursor-pointer">
                            Show Footer
                          </Label>
                          <Switch 
                            id="showFooter" 
                            checked={config.showFooter} 
                            onCheckedChange={(checked) => updateConfig("showFooter", checked)} 
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <h3 className="text-base font-medium">Information Sections</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showClientDetails" className="cursor-pointer">
                            Show Client Details
                          </Label>
                          <Switch 
                            id="showClientDetails" 
                            checked={config.showClientDetails} 
                            onCheckedChange={(checked) => updateConfig("showClientDetails", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showProjectDetails" className="cursor-pointer">
                            Show Project Details
                          </Label>
                          <Switch 
                            id="showProjectDetails" 
                            checked={config.showProjectDetails} 
                            onCheckedChange={(checked) => updateConfig("showProjectDetails", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showItemDetails" className="cursor-pointer">
                            Show Item Details
                          </Label>
                          <Switch 
                            id="showItemDetails" 
                            checked={config.showItemDetails} 
                            onCheckedChange={(checked) => updateConfig("showItemDetails", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showItemNotes" className="cursor-pointer">
                            Show Item Notes
                          </Label>
                          <Switch 
                            id="showItemNotes" 
                            checked={config.showItemNotes} 
                            onCheckedChange={(checked) => updateConfig("showItemNotes", checked)} 
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <h3 className="text-base font-medium">Additional Elements</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showTerms" className="cursor-pointer">
                            Show Terms & Conditions
                          </Label>
                          <Switch 
                            id="showTerms" 
                            checked={config.showTerms} 
                            onCheckedChange={(checked) => updateConfig("showTerms", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showNotes" className="cursor-pointer">
                            Show Notes
                          </Label>
                          <Switch 
                            id="showNotes" 
                            checked={config.showNotes} 
                            onCheckedChange={(checked) => updateConfig("showNotes", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showSignatureLine" className="cursor-pointer">
                            Show Signature Line
                          </Label>
                          <Switch 
                            id="showSignatureLine" 
                            checked={config.showSignatureLine} 
                            onCheckedChange={(checked) => updateConfig("showSignatureLine", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showDates" className="cursor-pointer">
                            Show Dates
                          </Label>
                          <Switch 
                            id="showDates" 
                            checked={config.showDates} 
                            onCheckedChange={(checked) => updateConfig("showDates", checked)} 
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Style Tab */}
                  <TabsContent value="style" className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-base font-medium">Colors</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="colorPrimary" className="text-sm">Primary Color</Label>
                          <ColorPicker 
                            id="colorPrimary"
                            color={config.colorPrimary} 
                            onChange={(color) => updateConfig("colorPrimary", color)} 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="colorSecondary" className="text-sm">Secondary Color</Label>
                          <ColorPicker 
                            id="colorSecondary"
                            color={config.colorSecondary} 
                            onChange={(color) => updateConfig("colorSecondary", color)} 
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <h3 className="text-base font-medium">Typography</h3>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="fontMain" className="text-sm">Main Font</Label>
                          <Select 
                            value={config.fontMain}
                            onValueChange={(value) => updateConfig("fontMain", value)}
                          >
                            <SelectTrigger id="fontMain">
                              <SelectValue placeholder="Select font" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Courier New">Courier New</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <h3 className="text-base font-medium">Styles</h3>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="headerStyle" className="text-sm">Header Style</Label>
                          <Select 
                            value={config.headerStyle}
                            onValueChange={(value: 'simple' | 'gradient' | 'boxed') => updateConfig("headerStyle", value)}
                          >
                            <SelectTrigger id="headerStyle">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gradient">Gradient</SelectItem>
                              <SelectItem value="simple">Simple</SelectItem>
                              <SelectItem value="boxed">Boxed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="tableStyle" className="text-sm">Table Style</Label>
                          <Select 
                            value={config.tableStyle}
                            onValueChange={(value: 'striped' | 'bordered' | 'minimal') => updateConfig("tableStyle", value)}
                          >
                            <SelectTrigger id="tableStyle">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="striped">Striped</SelectItem>
                              <SelectItem value="bordered">Bordered</SelectItem>
                              <SelectItem value="minimal">Minimal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Columns Tab */}
                  <TabsContent value="columns" className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-base font-medium">Visible Columns</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showColumnsService" className="cursor-pointer">
                            Service
                          </Label>
                          <Switch 
                            id="showColumnsService" 
                            checked={config.showColumns.service} 
                            onCheckedChange={(checked) => updateColumnsConfig("service", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showColumnsDescription" className="cursor-pointer">
                            Description
                          </Label>
                          <Switch 
                            id="showColumnsDescription" 
                            checked={config.showColumns.description} 
                            onCheckedChange={(checked) => updateColumnsConfig("description", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showColumnsQuantity" className="cursor-pointer">
                            Quantity
                          </Label>
                          <Switch 
                            id="showColumnsQuantity" 
                            checked={config.showColumns.quantity} 
                            onCheckedChange={(checked) => updateColumnsConfig("quantity", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showColumnsUnitPrice" className="cursor-pointer">
                            Unit Price
                          </Label>
                          <Switch 
                            id="showColumnsUnitPrice" 
                            checked={config.showColumns.unitPrice} 
                            onCheckedChange={(checked) => updateColumnsConfig("unitPrice", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showColumnsAmount" className="cursor-pointer">
                            Amount
                          </Label>
                          <Switch 
                            id="showColumnsAmount" 
                            checked={config.showColumns.amount} 
                            onCheckedChange={(checked) => updateColumnsConfig("amount", checked)} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showColumnsNotes" className="cursor-pointer">
                            Notes
                          </Label>
                          <Switch 
                            id="showColumnsNotes" 
                            checked={config.showColumns.notes} 
                            onCheckedChange={(checked) => updateColumnsConfig("notes", checked)} 
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Document Preview</CardTitle>
                <Select
                  value={previewType}
                  onValueChange={(value: "estimate" | "invoice") => setPreviewType(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estimate">Estimate</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>
                This is a preview of how your {previewType === "estimate" ? "estimate" : "invoice"} will look.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden bg-white relative">
                <div className="bg-muted-foreground/10 p-2 text-center text-xs text-muted-foreground">
                  <span className="font-medium">Preview Area</span>
                </div>
                <div className="w-full h-[350px] bg-gray-100 rounded-md border border-gray-200 overflow-hidden flex items-center justify-center">
                  {previewLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Generating preview...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <div className="mb-6 text-muted-foreground">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">PDF Preview</h3>
                        <p className="max-w-md mb-4">
                          Click the button below to generate a PDF preview with the current settings.
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                          The PDF will open in a new window when ready.
                        </p>
                      </div>
                      
                      <Button 
                        variant="default" 
                        onClick={generatePreview}
                        className="flex items-center"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Generate Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {activeTab === "content" && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-xl">Services Configuration</CardTitle>
                <CardDescription>
                  Define the services your company offers to easily add them to your estimates and invoices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServicesConfig contractorId={1} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}