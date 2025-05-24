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
      <div className="text-4xl font-bold text-red-500 mb-4 text-center border-4 border-red-500 p-4">
        🔴 AQUI - SERVICIOS AQUI 🔴
      </div>
      <div className="text-lg font-semibold mb-2">Select Service Type</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {services.map((service: any) => {
          const isSelected = value === service.serviceType;
          const laborRate = parseFloat(service.laborRate || "0");
          
          // Get service icon based on type
          const getServiceIcon = (serviceType: string) => {
            switch(serviceType) {
              case 'roof': return '🏠';
              case 'fence': return '🔧';
              case 'deck': return '🪵';
              case 'windows': return '🪟';
              default: return '⚒️';
            }
          };
          
          return (
            <Card 
              key={service.id}
              className={cn(
                "transition-all relative overflow-hidden border-2 cursor-pointer",
                isSelected 
                  ? "border-primary shadow-lg bg-primary/5" 
                  : "border-gray-200 hover:border-primary/50 hover:shadow-md"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(service.serviceType);
              }}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 z-10">
                  <Check className="h-4 w-4" />
                </div>
              )}
              
              <CardContent className="p-4">
                <div 
                  className="w-full h-1.5 rounded-full mb-3 bg-primary"
                ></div>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{getServiceIcon(service.serviceType)}</div>
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  Professional {service.name.toLowerCase()} service with expert installation
                </p>
                
                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                  <Badge variant="outline" className="bg-primary/10">
                    {service.unit === 'sqft' ? 'Area Based' : 
                     service.unit === 'ft' ? 'Length Based' :
                     service.unit === 'unit' ? 'Per Unit' : 'Custom'}
                  </Badge>
                  
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {formatCurrency(laborRate)}/{service.unit}
                  </Badge>
                </div>
                
                <div className="mt-2">
                  <ul className="text-xs space-y-1">
                    <li className="flex items-start">
                      <span className="text-primary mr-1">✓</span>
                      <span>Professional installation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-1">✓</span>
                      <span>Quality materials</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-1">✓</span>
                      <span>Labor included</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}