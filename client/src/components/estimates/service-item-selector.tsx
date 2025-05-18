import React from "react";
import { SERVICE_TYPES, SERVICE_INFO } from "@/lib/service-options";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Icons for services
const ServiceIcon = ({ service }: { service: string }) => {
  const info = SERVICE_INFO[service as keyof typeof SERVICE_INFO];
  return <div className="text-2xl">{info?.icon || "🔧"}</div>;
};

interface ServiceItemSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ServiceItemSelector({ value, onChange }: ServiceItemSelectorProps) {
  return (
    <div className="mb-6">
      <div className="text-lg font-semibold mb-2">Select Service Type</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {SERVICE_TYPES.map((service) => {
          const isSelected = value === service.value;
          const serviceInfo = SERVICE_INFO[service.value as keyof typeof SERVICE_INFO];
          
          return (
            <Card 
              key={service.value}
              className={cn(
                "cursor-pointer transition-all relative overflow-hidden border-2",
                isSelected 
                  ? "border-primary shadow-lg" 
                  : "border-transparent hover:border-primary/20"
              )}
              onClick={() => onChange(service.value)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
              
              <CardContent className="p-4">
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
            </Card>
          );
        })}
      </div>
    </div>
  );
}