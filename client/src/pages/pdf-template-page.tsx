import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PdfTemplateSettings, { PdfTemplateConfig } from "@/components/pdf/pdf-template-settings";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Settings, Eye } from "lucide-react";

// Simulated data for preview
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

// Function to format currency
const formatCurrency = (amount: number | string = 0) => {
  if (typeof amount === 'string') amount = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(amount);
};

export default function PdfTemplatePage() {
  const [pdfConfig, setPdfConfig] = useState<PdfTemplateConfig | null>(null);
  const [activeTab, setActiveTab] = useState("settings");
  const { toast } = useToast();
  
  // Load saved configuration from localStorage on startup
  useEffect(() => {
    const savedConfig = localStorage.getItem('pdfTemplateConfig');
    if (savedConfig) {
      try {
        setPdfConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Error loading saved configuration:", e);
      }
    }
  }, []);
  
  // Save configuration to localStorage
  const saveConfig = (config: PdfTemplateConfig) => {
    try {
      localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
      setPdfConfig(config);
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
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">PDF Template Configuration</h1>
          <p className="text-muted-foreground">
            Customize your PDF templates for estimates, invoices, and work orders
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="mr-2">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh]">
              <DialogHeader>
                <DialogTitle>Document Preview</DialogTitle>
                <DialogDescription>
                  This is how your PDF document will look with the current configuration
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-full py-4">
                <div className="p-6 border rounded-lg bg-white">
                  {/* Preview reflecting the configuration - Simplified version */}
                  <div className="mb-6">
                    <div 
                      className={`py-6 mb-6 rounded-t-lg ${
                        pdfConfig?.headerStyle === 'gradient'
                          ? `bg-gradient-to-r from-[${pdfConfig?.colorPrimary}] to-[${pdfConfig?.colorSecondary}] text-white`
                          : pdfConfig?.headerStyle === 'boxed'
                            ? 'border-2 border-gray-200 p-4'
                            : ''
                      }`}
                    >
                      <div className="flex justify-between items-start container mx-auto">
                        <div>
                          <h1 className="text-3xl font-bold">ESTIMADO</h1>
                          <p className="text-lg">#{previewData.estimateNumber}</p>
                        </div>
                        {pdfConfig?.logo && (
                          <div className="w-24 h-24 bg-white/20 rounded-md flex items-center justify-center">
                            Logo
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Información de cliente y contratista */}
                    {pdfConfig?.showClientDetails && (
                      <div className="grid grid-cols-2 gap-8 mb-6">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Cliente</h3>
                          <p className="font-bold">
                            {previewData.client.firstName} {previewData.client.lastName}
                          </p>
                          <p>{previewData.client.email}</p>
                          <p>{previewData.client.phone}</p>
                          <p>{previewData.client.address}</p>
                          <p>
                            {previewData.client.city}, {previewData.client.state} {previewData.client.zipCode}
                          </p>
                        </div>
                        <div>
                          <div className="grid grid-cols-2 gap-4">
                            {pdfConfig?.showDates && (
                              <>
                                <div>
                                  <h3 className="text-sm font-medium">Fecha de Emisión</h3>
                                  <p>{formatDate(previewData.issueDate)}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium">Fecha de Expiración</h3>
                                  <p>{formatDate(previewData.expiryDate)}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Información del proyecto */}
                    {pdfConfig?.showProjectDetails && previewData.projectTitle && (
                      <div className="mb-6 border-t border-b py-4">
                        <h3 className="text-lg font-medium mb-2">Proyecto</h3>
                        <p className="font-bold">{previewData.projectTitle}</p>
                        <p className="text-muted-foreground">{previewData.projectDescription}</p>
                      </div>
                    )}
                    
                    {/* Tabla de ítems */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Detalle de Servicios</h3>
                      <table className={`w-full ${
                        pdfConfig?.tableStyle === 'bordered' 
                          ? 'border-collapse border' 
                          : pdfConfig?.tableStyle === 'minimal'
                            ? 'border-collapse' 
                            : 'border-collapse'
                      }`}>
                        <thead>
                          <tr className={`${
                            pdfConfig?.tableStyle === 'striped' 
                              ? 'bg-gray-100' 
                              : ''
                          }`}>
                            <th className={`text-left p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>Descripción</th>
                            <th className={`text-center p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>Cantidad</th>
                            <th className={`text-right p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>Precio Unitario</th>
                            <th className={`text-right p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.items.map((item, index) => (
                            <tr key={index} className={`${
                              pdfConfig?.tableStyle === 'striped' && index % 2 === 1
                                ? 'bg-gray-50' 
                                : ''
                            } ${pdfConfig?.tableStyle === 'bordered' ? 'border-b' : ''}`}>
                              <td className={`p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>
                                <div className="font-medium">{item.description}</div>
                                {pdfConfig?.showItemNotes && item.notes && (
                                  <div className="text-xs text-muted-foreground">{item.notes}</div>
                                )}
                              </td>
                              <td className={`text-center p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>{item.quantity}</td>
                              <td className={`text-right p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>{formatCurrency(item.unitPrice)}</td>
                              <td className={`text-right p-2 font-medium ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className={`${pdfConfig?.tableStyle === 'bordered' ? 'border-t-2' : 'border-t'}`}>
                            <td colSpan={3} className="text-right p-2 font-medium">Subtotal:</td>
                            <td className="text-right p-2 font-medium">{formatCurrency(previewData.subtotal)}</td>
                          </tr>
                          {parseFloat(String(previewData.tax)) > 0 && (
                            <tr>
                              <td colSpan={3} className="text-right p-2 font-medium">Impuestos:</td>
                              <td className="text-right p-2">{formatCurrency(previewData.tax)}</td>
                            </tr>
                          )}
                          {parseFloat(String(previewData.discount)) > 0 && (
                            <tr>
                              <td colSpan={3} className="text-right p-2 font-medium">Descuento:</td>
                              <td className="text-right p-2">-{formatCurrency(previewData.discount)}</td>
                            </tr>
                          )}
                          <tr className="bg-gray-100">
                            <td colSpan={3} className="text-right p-2 font-bold">TOTAL:</td>
                            <td className="text-right p-2 font-bold text-lg">{formatCurrency(previewData.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    {/* Términos y notas */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      {pdfConfig?.showTerms && previewData.terms && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Términos</h3>
                          <p className="text-sm">{previewData.terms}</p>
                        </div>
                      )}
                      {pdfConfig?.showNotes && previewData.notes && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Notas</h3>
                          <p className="text-sm">{previewData.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Información de aceptación/rechazo */}
                    {pdfConfig?.showSignatureLine && (
                      <div className="mt-8 border-t pt-6">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-base font-medium mb-2">Aceptación del Cliente</h3>
                            <p className="text-sm mb-8">
                              Al firmar este documento, usted acepta los términos y condiciones del estimado.
                            </p>
                            <div className="border-t border-dashed border-gray-300 pt-2 w-64">
                              <p className="text-xs text-center">Firma y Fecha</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Pie de página */}
                    {pdfConfig?.showFooter && (
                      <div className="mt-12 pt-4 border-t text-center text-sm text-muted-foreground">
                        <p>{previewData.contractor.businessName} | {previewData.contractor.phone} | {previewData.contractor.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Configuration
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Template Configuration
          </TabsTrigger>
          <TabsTrigger value="estimate">
            <FileText className="h-4 w-4 mr-2" />
            Estimate Template
          </TabsTrigger>
          <TabsTrigger value="invoice">
            <FileText className="h-4 w-4 mr-2" />
            Invoice Template
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings">
          <PdfTemplateSettings 
            initialConfig={pdfConfig || undefined} 
            onSave={saveConfig}
          />
        </TabsContent>
        
        <TabsContent value="estimate">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Estimate-Specific Configuration</h2>
              <p className="text-muted-foreground mb-4">
                Configure additional options specific to estimates. These options complement
                the general template configuration.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Acceptance Options</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimateTitle">Document Title</Label>
                    <Input id="estimateTitle" defaultValue="ESTIMATE" placeholder="Document title" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimateTerms">Terms and Conditions</Label>
                    <Textarea 
                      id="estimateTerms" 
                      placeholder="Specific terms for estimates" 
                      defaultValue="Payment must be made within 30 days of the issue date. Our standard terms and conditions apply."
                      rows={4}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Customization</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimateTextAboveSignature">Text Above Signature Line</Label>
                    <Textarea 
                      id="estimateTextAboveSignature" 
                      placeholder="Text that will appear above the signature line" 
                      defaultValue="By signing this document, you accept the terms and conditions of the estimate."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimateValidPeriod">Validity Period (days)</Label>
                    <Input id="estimateValidPeriod" type="number" defaultValue="30" />
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex justify-end">
                <Button>Save Estimate Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoice">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Invoice-Specific Configuration</h2>
              <p className="text-muted-foreground mb-4">
                Configure additional options specific to invoices. These options complement
                the general template configuration.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment Options</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoiceTitle">Document Title</Label>
                    <Input id="invoiceTitle" defaultValue="INVOICE" placeholder="Document title" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoiceTerms">Payment Terms</Label>
                    <Textarea 
                      id="invoiceTerms" 
                      placeholder="Specific terms for invoices" 
                      defaultValue="Payment must be made within 15 days from the issue date. Late fees will apply after this period."
                      rows={4}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Customization</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoiceTextAboveSignature">Text Above Signature Line</Label>
                    <Textarea 
                      id="invoiceTextAboveSignature" 
                      placeholder="Text that will appear above the signature line" 
                      defaultValue="With my signature, I confirm receipt of the services described in this invoice."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoicePaymentPeriod">Payment Period (days)</Label>
                    <Input id="invoicePaymentPeriod" type="number" defaultValue="15" />
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex justify-end">
                <Button>Save Invoice Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}