import React, { useState } from "react";
import { SERVICE_TYPES, SERVICE_INFO, MATERIALS_BY_SERVICE, OPTIONS_BY_SERVICE } from "@/lib/service-options";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Check, ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePricing } from '@/hooks/use-pricing';

// Icons for services
const ServiceIcon = ({ service }: { service: string }) => {
  const info = SERVICE_INFO[service as keyof typeof SERVICE_INFO];
  return <div className="text-2xl">{info?.icon || "🔧"}</div>;
};

interface ServiceItemSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export function ServiceItemSelector({ value, onChange }: ServiceItemSelectorProps) {
  // Obtener servicios de la configuración de precios
  const { services, isLoading } = usePricing();
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);

  console.log('Services in ServiceItemSelector:', services);
  console.log('Services loading:', isLoading);

  const toggleDetails = (serviceId: string) => {
    if (expandedDetails === serviceId) {
      setExpandedDetails(null);
    } else {
      setExpandedDetails(serviceId);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="text-lg font-semibold mb-2">Select Service Type</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!services || !Array.isArray(services) || services.length === 0) {
    return (
      <div className="mb-6">
        <div className="text-lg font-semibold mb-2">Select Service Type</div>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No services configured. Please add services in your pricing configuration first.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="text-lg font-semibold mb-2">Select Service Type</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {services.map((service) => {
          const isSelected = value === service.serviceType;
          const serviceInfo = SERVICE_INFO[service.serviceType as keyof typeof SERVICE_INFO];
          const materials = MATERIALS_BY_SERVICE[service.serviceType as keyof typeof MATERIALS_BY_SERVICE] || [];
          const options = OPTIONS_BY_SERVICE[service.serviceType as keyof typeof OPTIONS_BY_SERVICE] || [];
          const isExpanded = expandedDetails === service.serviceType;
          
          // Get price range from materials
          const materialPrices = materials.map(m => m.unitPrice);
          const minPrice = materialPrices.length ? Math.min(...materialPrices) : 0;
          const maxPrice = materialPrices.length ? Math.max(...materialPrices) : 0;
          
          // Use service labor rate if no materials
          const laborRate = parseFloat(service.laborRate);
          const displayMinPrice = minPrice || laborRate;
          const displayMaxPrice = maxPrice || laborRate;
          
          return (
            <Card 
              key={service.id}
              className={cn(
                "transition-all relative overflow-hidden border-2",
                isSelected 
                  ? "border-primary shadow-lg" 
                  : "border-transparent hover:border-primary/20"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 z-10">
                  <Check className="h-4 w-4" />
                </div>
              )}
              
              <CardContent 
                className="p-4 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(service.serviceType);
                }}
              >
                <div 
                  className="w-full h-1.5 rounded-full mb-3"
                  style={{ backgroundColor: serviceInfo?.color || "#3b82f6" }}
                ></div>
                
                <div className="flex items-center gap-3 mb-2">
                  <ServiceIcon service={service.serviceType} />
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {serviceInfo?.description || `Professional ${service.name.toLowerCase()} service`}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                  <Badge variant="outline" className="bg-primary/10">
                    {service.unit === 'sqft' ? 'Area Based' : 
                     service.unit === 'ft' ? 'Length Based' :
                     service.unit === 'unit' ? 'Per Unit' : 'Custom'}
                  </Badge>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="bg-primary/10">
                          {formatCurrency(laborRate)}/{service.unit} labor
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Labor rate per {service.unit}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {serviceInfo?.benefits && (
                  <div className="mt-2">
                    <ul className="text-xs space-y-1">
                      {serviceInfo.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-1">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              
              <Separator />
              
              <CardFooter className="p-0">
                <Button 
                  variant="ghost" 
                  className="w-full p-2 flex items-center justify-center gap-1 rounded-none text-sm text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleDetails(service.serviceType);
                  }}
                >
                  {isExpanded ? (
                    <>
                      Hide details <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      View details <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
              
              {isExpanded && (
                <div className="p-3 bg-muted/30 border-t">
                  <h4 className="text-sm font-medium mb-2">Service Details</h4>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center p-2 bg-background rounded-md">
                      <span className="text-sm font-medium">Labor Rate</span>
                      <Badge variant="outline">
                        {formatCurrency(laborRate)}/{service.unit}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-background rounded-md">
                      <span className="text-sm">Labor Method</span>
                      <Badge variant="secondary">
                        {service.laborMethod === 'by_area' ? 'By Area' : 'Fixed Rate'}
                      </Badge>
                    </div>
                  </div>
                  
                  {materials.length > 0 && (
                    <>
                      <h4 className="text-sm font-medium mb-2">Available Materials</h4>
                      <ScrollArea className="h-32 rounded-md border p-2 bg-background mb-4">
                        <div className="space-y-2">
                          {materials.map((material: any) => (
                            <div key={material.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                              <span className="text-sm">{material.name}</span>
                              <Badge variant="outline">
                                {formatCurrency(material.unitPrice)}/{material.unit}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                  
                  {options.length > 0 && (
                    <>
                      <h4 className="text-sm font-medium mb-2">Additional Options</h4>
                      <ScrollArea className="h-32 rounded-md border p-2 bg-background">
                        <div className="space-y-2">
                          {options.map((option: any) => (
                            <div key={option.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                              <span className="text-sm">{option.name}</span>
                              <Badge variant="outline">
                                {formatCurrency(option.unitPrice)}/{option.unit}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}