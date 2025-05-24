import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface ServiceItemSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ServiceItemSelector({ value, onChange }: ServiceItemSelectorProps) {
  const { 
    data: services, 
    isLoading: servicesLoading, 
    error: servicesError 
  } = useQuery({
    queryKey: ['/api/direct/services'],
    retry: 1,
  });

  console.log("Services in ServiceItemSelector:", services);
  console.log("Services loading:", servicesLoading);

  if (servicesLoading) {
    return (
      <div className="mb-6">
        <div className="text-lg font-semibold mb-2">Select Service Type</div>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading services...</span>
        </div>
      </div>
    );
  }

  if (servicesError) {
    return (
      <div className="mb-6">
        <div className="text-lg font-semibold mb-2">Select Service Type</div>
        <div className="text-red-500">Error loading services: {servicesError.message}</div>
      </div>
    );
  }

  // Forzar que services sea tratado como array
  const servicesArray = Array.isArray(services) ? services : [];
  
  if (!servicesArray || servicesArray.length === 0) {
    return (
      <div className="mb-6">
        <div className="text-lg font-semibold mb-2">Select Service Type</div>
        <div className="text-gray-500">
          No services configured. Please add services in your pricing configuration first.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="text-lg font-semibold mb-2">Select Service Type</div>
      <div className="bg-white p-4 border-2 border-blue-500 rounded-lg shadow-lg">
        <div className="text-center mb-4 text-blue-600 font-bold">
          Found {servicesArray.length} services configured
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {servicesArray.map((service: any) => {
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
                    ? "border-blue-500 bg-blue-50 shadow-lg scale-105" 
                    : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                )}
                onClick={() => onChange(service.serviceType)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">{getServiceIcon(service.serviceType)}</span>
                    {service.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <strong>Labor Rate:</strong> ${laborRate.toFixed(2)}/{service.unit}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Service Type:</strong> {service.serviceType}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Calculation:</strong> {service.laborMethod || service.laborCalculationMethod}
                    </div>
                  </div>
                  
                  {/* Professional descriptions based on service type */}
                  <div className="mt-3 pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      {service.serviceType === 'roof' && (
                        <ul className="list-disc list-inside space-y-1">
                          <li>Complete roof installation and replacement</li>
                          <li>Quality shingles and waterproofing</li>
                          <li>Professional installation with warranty</li>
                        </ul>
                      )}
                      {service.serviceType === 'fence' && (
                        <ul className="list-disc list-inside space-y-1">
                          <li>Custom fence design and installation</li>
                          <li>Premium materials and hardware</li>
                          <li>Professional craftsmanship guaranteed</li>
                        </ul>
                      )}
                      {service.serviceType === 'deck' && (
                        <ul className="list-disc list-inside space-y-1">
                          <li>Custom deck construction</li>
                          <li>Quality lumber and composite options</li>
                          <li>Expert installation and finishing</li>
                        </ul>
                      )}
                      {service.serviceType === 'windows' && (
                        <ul className="list-disc list-inside space-y-1">
                          <li>Energy-efficient window installation</li>
                          <li>Premium window brands available</li>
                          <li>Professional fitting and sealing</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}