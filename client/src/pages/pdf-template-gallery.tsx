import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  Home, 
  FileText, 
  Paintbrush, 
  Download, 
  Eye, 
  ArrowRight,
  LayoutTemplate
} from "lucide-react";
import { PdfTemplateConfig } from "@/components/pdf/pdf-template-settings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

// Template previews
const templatePreviews = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean and professional template with a gradient header and structured layout",
    tags: ["modern", "business", "gradient"],
    config: {
      colorPrimary: "#0f766e",
      colorSecondary: "#2563eb",
      headerStyle: "gradient",
      tableStyle: "bordered"
    },
    thumbnail: "/templates/professional-thumb.png" // Placeholder path
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simplified design with focus on content and clean typography",
    tags: ["minimal", "clean", "simple"],
    config: {
      colorPrimary: "#1f2937",
      colorSecondary: "#4b5563",
      headerStyle: "simple",
      tableStyle: "minimal"
    },
    thumbnail: "/templates/minimal-thumb.png" // Placeholder path
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated layout with serif typography and elegant styling",
    tags: ["elegant", "premium", "formal"],
    config: {
      colorPrimary: "#7c3aed",
      colorSecondary: "#4f46e5",
      headerStyle: "boxed",
      tableStyle: "striped"
    },
    thumbnail: "/templates/elegant-thumb.png" // Placeholder path
  },
  {
    id: "custom",
    name: "Custom Template",
    description: "Your personalized template with saved settings",
    tags: ["custom", "personalized"],
    config: {},
    isCustom: true,
    thumbnail: "/templates/custom-thumb.png" // Placeholder path
  }
];

export default function PdfTemplateGallery() {
  const [activeTab, setActiveTab] = useState("templates");
  const [, setLocation] = useLocation();
  const [savedConfig, setSavedConfig] = useState<PdfTemplateConfig | null>(null);
  
  // Check if user has a saved custom template
  useEffect(() => {
    const savedConfigStr = localStorage.getItem('pdfTemplateConfig');
    if (savedConfigStr) {
      try {
        setSavedConfig(JSON.parse(savedConfigStr));
      } catch (e) {
        console.error("Error parsing saved template config:", e);
      }
    }
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    // Apply template config or go to custom editor
    if (templateId === "custom") {
      setLocation("/pdf-template-luxury");
    } else {
      // In a real implementation, would set this template as active or save it
      const template = templatePreviews.find(t => t.id === templateId);
      if (template && template.config) {
        // Could save this template config as a starting point
        localStorage.setItem('selectedTemplate', templateId);
        setLocation("/pdf-template-luxury");
      }
    }
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
        <Link href="/tools-dashboard">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Tools
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">PDF Templates</h1>
          <p className="text-muted-foreground">
            Choose from professional templates or customize your own
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/pdf-template-luxury">
            <Button>
              <Paintbrush className="h-4 w-4 mr-2" />
              Luxury Editor
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="templates" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="templates" className="flex items-center gap-1">
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Document Preview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templatePreviews.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Card className={`h-full flex flex-col overflow-hidden cursor-pointer border-2 hover:border-primary/60 ${
                  template.isCustom && savedConfig ? "border-primary" : ""
                }`} onClick={() => handleTemplateSelect(template.id)}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                    {/* Template Preview Image */}
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-gray-100 to-gray-200">
                      {/* Replace with actual template preview */}
                      <div className="w-[80%] h-[90%] bg-white border shadow overflow-hidden">
                        {/* Simulated document header */}
                        <div 
                          className={`h-16 ${
                            template.config.headerStyle === 'gradient' 
                              ? `bg-gradient-to-r from-[${template.config.colorPrimary}] to-[${template.config.colorSecondary}]` 
                              : template.config.headerStyle === 'boxed' 
                                ? 'border-b-2' 
                                : ''
                          }`}
                        ></div>
                        {/* Simulated document body */}
                        <div className="p-4">
                          <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="w-3/4 h-4 bg-gray-200 rounded mb-4"></div>
                          
                          <div className="w-full h-20 bg-gray-100 rounded mb-4 flex flex-col p-2">
                            <div className="w-full h-3 bg-gray-200 rounded mb-1"></div>
                            <div className="w-full h-3 bg-gray-200 rounded mb-1"></div>
                            <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                          </div>
                          
                          <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Template Tags */}
                    <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                      {template.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <CardContent className="flex-grow flex flex-col justify-between p-4">
                    <div>
                      <h3 className="font-medium text-lg">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      className="justify-start p-0 text-primary hover:text-primary/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateSelect(template.id);
                      }}
                    >
                      {template.isCustom ? "Edit Custom Template" : "Use This Template"}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="bg-gray-50 min-h-[calc(100vh-300px)] rounded-md">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="p-6 flex justify-center">
              <div className="bg-white shadow-xl rounded-md w-full max-w-4xl p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-32 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                    Company Logo
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-primary">ESTIMATE</h2>
                    <p>EST-2025-001</p>
                    <div className="mt-1 inline-block px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                      PENDING
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-sm font-medium mb-1 text-primary">CLIENT</h3>
                    <p className="font-medium">John Smith</p>
                    <p className="text-sm">john@example.com</p>
                    <p className="text-sm">555-123-4567</p>
                    <p className="text-sm">123 Main Street</p>
                    <p className="text-sm">Sample City, Sample State 12345</p>
                  </div>
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <h3 className="text-xs font-medium text-primary">ISSUE DATE</h3>
                        <p className="text-sm">May 13, 2025</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-primary">EXPIRY DATE</h3>
                        <p className="text-sm">June 12, 2025</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-8 border-t border-b py-4">
                  <h3 className="text-md font-medium mb-1 text-primary">PROJECT DETAILS</h3>
                  <p className="font-medium">Living Room Renovation</p>
                  <p className="text-sm text-muted-foreground">
                    Complete renovation project including painting, window installation, and surface repairs.
                  </p>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-md font-medium mb-2 text-primary">SERVICES</h3>
                  <table className="w-full text-sm border border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border">Description</th>
                        <th className="text-center p-2 border">Qty</th>
                        <th className="text-right p-2 border">Price</th>
                        <th className="text-right p-2 border">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border">
                          <div>High-efficiency window installation</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Includes aluminum frame and double glazing
                          </div>
                        </td>
                        <td className="text-center p-2 border">4</td>
                        <td className="text-right p-2 border">$450.00</td>
                        <td className="text-right p-2 border">$1,800.00</td>
                      </tr>
                      <tr>
                        <td className="p-2 border">
                          <div>Interior painting service</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Premium stain-resistant paint
                          </div>
                        </td>
                        <td className="text-center p-2 border">3</td>
                        <td className="text-right p-2 border">$300.00</td>
                        <td className="text-right p-2 border">$900.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end mb-8">
                  <div className="w-64">
                    <div className="flex justify-between py-2">
                      <span>Subtotal</span>
                      <span>$2,700.00</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Tax (8%)</span>
                      <span>$216.00</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Discount</span>
                      <span>-$100.00</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold border-t">
                      <span>Total</span>
                      <span>$2,816.00</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-md font-medium mb-2 text-primary">TERMS & CONDITIONS</h3>
                    <p className="text-sm text-muted-foreground">
                      Payment must be made within 30 days of the issue date. Our standard terms and conditions apply.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-md font-medium mb-2 text-primary">NOTES</h3>
                    <p className="text-sm text-muted-foreground">
                      Prices are subject to change based on material availability. A 30% deposit may be required to begin work.
                    </p>
                  </div>
                </div>
                
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
                
                <div className="text-center text-xs text-muted-foreground mt-8">
                  <p>Thank you for your business!</p>
                  <p>ABC Construction Services • 456 Construction Ave, Sample City • 555-987-6543</p>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <div className="flex justify-center mt-4 p-4">
            <Button className="mr-2">
              <Eye className="h-4 w-4 mr-2" />
              View Full Screen
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download Sample
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}