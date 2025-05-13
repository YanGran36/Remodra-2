import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PdfTemplateSettings, { PdfTemplateConfig } from "@/components/pdf/pdf-template-settings";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  FileText, 
  Settings, 
  Eye, 
  ChevronLeft, 
  Home, 
  RefreshCw,
  Check 
} from "lucide-react";
import { Link } from "wouter";

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

export default function PdfTemplatePageNew() {
  const [pdfConfig, setPdfConfig] = useState<PdfTemplateConfig | null>(null);
  const [activeTab, setActiveTab] = useState("settings");
  const [saveIndicator, setSaveIndicator] = useState(false);
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
      
      // Show save indicator animation
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
  
  // Update config without saving to localStorage (for live preview)
  const updatePreview = (config: PdfTemplateConfig) => {
    setPdfConfig(config);
  };

  return (
    <div className="container py-6">
      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
        <Link href="/estimates">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Estimates
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">PDF Template Configuration</h1>
          <p className="text-muted-foreground">
            Customize your PDF templates with real-time preview
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" className="mr-2" onClick={() => {
            // Reset to default settings
            if (window.confirm("Are you sure you want to reset all template settings to default?")) {
              localStorage.removeItem('pdfTemplateConfig');
              window.location.reload();
            }
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>
      
      {/* Split view layout - Settings on left, Live Preview on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Settings Panel */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Template Settings
                {saveIndicator && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Saved
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="settings">
                    General
                  </TabsTrigger>
                  <TabsTrigger value="estimate">
                    Estimate
                  </TabsTrigger>
                  <TabsTrigger value="invoice">
                    Invoice
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="settings" className="space-y-4 mt-2">
                  <PdfTemplateSettings 
                    initialConfig={pdfConfig || undefined}
                    onSave={saveConfig}
                    onUpdate={updatePreview}
                    livePreview={true}
                  />
                </TabsContent>
                
                <TabsContent value="estimate">
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold">Estimate-specific Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure settings specifically for estimate templates.
                    </p>
                    <Separator />
                    <div className="space-y-2">
                      <p>Additional estimate settings coming soon...</p>
                      {/* Future estimate-specific settings will go here */}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="invoice">
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold">Invoice-specific Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure settings specifically for invoice templates.
                    </p>
                    <Separator />
                    <div className="space-y-2">
                      <p>Additional invoice settings coming soon...</p>
                      {/* Future invoice-specific settings will go here */}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right side - Live Preview */}
        <div>
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex justify-between items-center">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Live Preview
                </div>
                <div className="flex items-center">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Auto-updating
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="p-6">
                  {/* Document Preview */}
                  <div className="border rounded-lg shadow-sm overflow-hidden bg-white">
                    {/* Header */}
                    <div className={`${
                      pdfConfig?.headerStyle === 'boxed' 
                        ? 'border-b p-6' 
                        : pdfConfig?.headerStyle === 'gradient'
                          ? `bg-gradient-to-r from-[${pdfConfig?.colorPrimary || '#1e293b'}] to-[${pdfConfig?.colorSecondary || '#64748b'}] text-white p-6`
                          : 'p-6'
                    }`}>
                      <div className="flex justify-between items-start">
                        {pdfConfig?.logo && (
                          <div className="w-32 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                            Company Logo
                          </div>
                        )}
                        <div className="text-right">
                          <h2 className="text-2xl font-bold" style={{color: pdfConfig?.headerStyle === 'gradient' ? 'white' : pdfConfig?.colorPrimary || '#1e293b'}}>
                            ESTIMATE
                          </h2>
                          <p>{previewData.estimateNumber}</p>
                          <div className="mt-1 inline-block px-2 py-0.5 text-xs rounded-full" 
                            style={{
                              backgroundColor: `${pdfConfig?.colorSecondary || '#64748b'}20`,
                              color: pdfConfig?.headerStyle === 'gradient' ? 'white' : pdfConfig?.colorSecondary || '#64748b'
                            }}>
                            {previewData.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Client and Dates Section */}
                      {pdfConfig?.showClientDetails && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <h3 className="text-sm font-medium mb-1" style={{color: pdfConfig?.colorPrimary || '#1e293b'}}>
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
                            {pdfConfig?.showDates && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <h3 className="text-xs font-medium" style={{color: pdfConfig?.colorPrimary || '#1e293b'}}>ISSUE DATE</h3>
                                  <p className="text-sm">{formatDate(previewData.issueDate)}</p>
                                </div>
                                <div>
                                  <h3 className="text-xs font-medium" style={{color: pdfConfig?.colorPrimary || '#1e293b'}}>EXPIRY DATE</h3>
                                  <p className="text-sm">{formatDate(previewData.expiryDate)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Project Details */}
                      {pdfConfig?.showProjectDetails && previewData.projectTitle && (
                        <div className="mb-6 border-t border-b py-4">
                          <h3 className="text-md font-medium mb-1" style={{color: pdfConfig?.colorPrimary || '#1e293b'}}>
                            PROJECT DETAILS
                          </h3>
                          <p className="font-medium">{previewData.projectTitle}</p>
                          <p className="text-sm text-muted-foreground">{previewData.projectDescription}</p>
                        </div>
                      )}

                      {/* Items Table */}
                      <div className="mb-6">
                        <h3 className="text-md font-medium mb-2" style={{color: pdfConfig?.colorPrimary || '#1e293b'}}>
                          SERVICES
                        </h3>
                        <table className={`w-full text-sm ${
                          pdfConfig?.tableStyle === 'bordered' 
                            ? 'border border-collapse' 
                            : 'border-collapse'
                        }`}>
                          <thead>
                            <tr className={`${
                              pdfConfig?.tableStyle === 'striped' || pdfConfig?.tableStyle === 'bordered'
                                ? 'bg-gray-50' 
                                : ''
                            }`}>
                              <th className={`text-left p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>
                                Description
                              </th>
                              <th className={`text-center p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>
                                Qty
                              </th>
                              <th className={`text-right p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>
                                Price
                              </th>
                              <th className={`text-right p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.items.slice(0, 2).map((item, index) => (
                              <tr key={index} className={`${
                                pdfConfig?.tableStyle === 'striped' && index % 2 === 1
                                  ? 'bg-gray-50' 
                                  : ''
                              }`}>
                                <td className={`p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>
                                  <div className="font-medium">{item.description}</div>
                                  {pdfConfig?.showItemNotes && item.notes && (
                                    <div className="text-xs text-muted-foreground mt-0.5">{item.notes}</div>
                                  )}
                                </td>
                                <td className={`text-center p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>
                                  {item.quantity}
                                </td>
                                <td className={`text-right p-2 ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className={`text-right p-2 font-medium ${pdfConfig?.tableStyle === 'bordered' ? 'border' : ''}`}>
                                  {formatCurrency(item.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={3} className="text-right p-2 font-medium">Subtotal:</td>
                              <td className="text-right p-2">{formatCurrency(previewData.subtotal)}</td>
                            </tr>
                            {parseFloat(String(previewData.tax)) > 0 && (
                              <tr>
                                <td colSpan={3} className="text-right p-2">Tax:</td>
                                <td className="text-right p-2">{formatCurrency(previewData.tax)}</td>
                              </tr>
                            )}
                            {parseFloat(String(previewData.discount)) > 0 && (
                              <tr>
                                <td colSpan={3} className="text-right p-2">Discount:</td>
                                <td className="text-right p-2">-{formatCurrency(previewData.discount)}</td>
                              </tr>
                            )}
                            <tr className="font-bold">
                              <td colSpan={3} className="text-right p-2 border-t">TOTAL:</td>
                              <td className="text-right p-2 border-t" style={{color: pdfConfig?.colorPrimary || '#1e293b'}}>
                                {formatCurrency(previewData.total)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Terms and Notes */}
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        {pdfConfig?.showTerms && (
                          <div>
                            <h3 className="text-sm font-medium mb-1" style={{color: pdfConfig?.colorPrimary || '#1e293b'}}>
                              TERMS
                            </h3>
                            <p className="text-xs">{previewData.terms}</p>
                          </div>
                        )}
                        {pdfConfig?.showNotes && (
                          <div>
                            <h3 className="text-sm font-medium mb-1" style={{color: pdfConfig?.colorPrimary || '#1e293b'}}>
                              NOTES
                            </h3>
                            <p className="text-xs">{previewData.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Signature Line */}
                      {pdfConfig?.showSignatureLine && (
                        <div className="mt-6 pt-4 border-t">
                          <h3 className="text-sm font-medium mb-1" style={{color: pdfConfig?.colorPrimary || '#1e293b'}}>
                            CLIENT APPROVAL
                          </h3>
                          <p className="text-xs mb-4">
                            By signing below, you agree to the terms of this estimate.
                          </p>
                          <div className="border-t border-dashed w-48 pt-1">
                            <p className="text-[10px] text-center text-gray-500">Signature and Date</p>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      {pdfConfig?.showFooter && (
                        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                          <p>{previewData.contractor.businessName} | {previewData.contractor.phone} | {previewData.contractor.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}