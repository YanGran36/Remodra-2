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
  // Función para prevenir el envío del formulario al hacer clic en botones
  const preventFormSubmission = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);

  const toggleDetails = (serviceId: string) => {
    if (expandedDetails === serviceId) {
      setExpandedDetails(null);
    } else {
      setExpandedDetails(serviceId);
    }
  };

  return (
    <div className="mb-6">
      <div className="text-lg font-semibold mb-2">Select Service Type</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {SERVICE_TYPES.map((service) => {
          const isSelected = value === service.value;
          const serviceInfo = SERVICE_INFO[service.value as keyof typeof SERVICE_INFO];
          const materials = MATERIALS_BY_SERVICE[service.value as keyof typeof MATERIALS_BY_SERVICE] || [];
          const options = OPTIONS_BY_SERVICE[service.value as keyof typeof OPTIONS_BY_SERVICE] || [];
          const isExpanded = expandedDetails === service.value;
          
          // Get price range
          const materialPrices = materials.map(m => m.unitPrice);
          const minPrice = materialPrices.length ? Math.min(...materialPrices) : 0;
          const maxPrice = materialPrices.length ? Math.max(...materialPrices) : 0;
          
          return (
            <Card 
              key={service.value}
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
                  // Prevenir cualquier acción del formulario
                  e.preventDefault();
                  e.stopPropagation();
                  // Solo llamar al onChange si es un click directo (no propagado)
                  if (e.currentTarget === e.target || e.currentTarget.contains(e.target as Node)) {
                    onChange(service.value);
                  }
                }}
              >
                <div 
                  className="w-full h-1.5 rounded-full mb-3"
                  style={{ backgroundColor: serviceInfo?.color || "#888" }}
                ></div>
                
                <div className="flex items-center gap-3 mb-2">
                  <ServiceIcon service={service.value} />
                  <h3 className="font-semibold text-lg">{service.label}</h3>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {serviceInfo?.description || "Service description"}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                  <Badge variant="outline" className="bg-primary/10">
                    {serviceInfo?.unitType === 'sq.ft' ? 'Area Based' : 
                     serviceInfo?.unitType === 'ln.ft' ? 'Length Based' :
                     serviceInfo?.unitType === 'unit' ? 'Per Unit' : 'Custom'}
                  </Badge>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="bg-primary/10">
                          {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}/{serviceInfo?.unitType}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Price range per {serviceInfo?.unitType}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {serviceInfo?.benefits && (
                  <div className="mt-2">
                    <ul className="text-xs space-y-1">
                      {serviceInfo.benefits.map((benefit, index) => (
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
                  onClick={() => toggleDetails(service.value)}
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
                  <h4 className="text-sm font-medium mb-2">Available Materials</h4>
                  <ScrollArea className="h-48 rounded-md border p-2 bg-background">
                    <div className="space-y-2">
                      {materials.map((material) => (
                        <div key={material.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                          <span className="text-sm">{material.name}</span>
                          <div className="flex items-center">
                            <Badge variant="outline">
                              {formatCurrency(material.unitPrice)}/{material.unit}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <h4 className="text-sm font-medium mt-3 mb-2">Additional Options</h4>
                  <ScrollArea className="h-48 rounded-md border p-2 bg-background">
                    <div className="space-y-2">
                      {options.map((option) => (
                        <div key={option.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                          <span className="text-sm">{option.name}</span>
                          <div className="flex items-center">
                            <Badge variant="outline">
                              {formatCurrency(option.unitPrice)}/{option.unit}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}