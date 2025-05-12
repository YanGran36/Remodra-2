import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, ArrowLeft, ArrowRight, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import { useLanguage } from "@/hooks/use-language";

// Validation schema for the form
const timeclockFormSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters")
});

type TimeclockFormType = z.infer<typeof timeclockFormSchema>;

export default function TimeclockPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("clock");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Obtener la ubicación actual
  useEffect(() => {
    const getLocation = async () => {
      if ("geolocation" in navigator) {
        setIsLoadingLocation(true);
        try {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                // Intentar obtener el nombre de la ubicación
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                );
                const data = await response.json();
                const locationName = data.display_name || `Lat: ${latitude}, Lng: ${longitude}`;
                setCurrentLocation(locationName);
              } catch (error) {
                // Si falla la geocodificación inversa, usar coordenadas
                setCurrentLocation(`Lat: ${latitude}, Lng: ${longitude}`);
              }
            },
            (error) => {
              console.error("Error obteniendo ubicación:", error);
              setCurrentLocation("No disponible");
            }
          );
        } catch (error) {
          console.error("Error en geolocalización:", error);
          setCurrentLocation("No disponible");
        } finally {
          setIsLoadingLocation(false);
        }
      } else {
        setCurrentLocation("No soportado por el navegador");
      }
    };

    getLocation();
  }, []);

  // Obtener entradas recientes
  const { data: recentEntries = [], isLoading: loadingEntries } = useQuery<any[]>({
    queryKey: ["/api/timeclock/recent"],
  });

  // Configurar formulario
  const form = useForm<TimeclockFormType>({
    resolver: zodResolver(timeclockFormSchema),
    defaultValues: {
      employeeName: ""
    }
  });

  // Mutaciones para entrada y salida
  const clockInMutation = useMutation({
    mutationFn: async (data: TimeclockFormType) => {
      return await apiRequest("POST", "/api/timeclock/clock-in", {
        ...data,
        location: currentLocation, // Usar siempre la ubicación actual
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "" // Vacío ya que no se solicita
      });
    },
    onSuccess: () => {
      toast({
        title: "Clock In Registered",
        description: "Your clock in has been successfully recorded",
        variant: "default"
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Error Recording Clock In",
        description: error.message || "An error occurred while recording your clock in",
        variant: "destructive"
      });
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async (data: TimeclockFormType) => {
      return await apiRequest("POST", "/api/timeclock/clock-out", {
        ...data,
        location: currentLocation, // Usar siempre la ubicación actual
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "" // Vacío ya que no se solicita
      });
    },
    onSuccess: () => {
      toast({
        title: "Clock Out Registered",
        description: "Your clock out has been successfully recorded",
        variant: "default"
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Error Recording Clock Out",
        description: error.message || "An error occurred while recording your clock out",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: TimeclockFormType) => {
    if (activeTab === "in") {
      clockInMutation.mutate(data);
    } else {
      clockOutMutation.mutate(data);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container py-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Registro de Entrada/Salida</h1>
            <p className="text-gray-600 mt-2">
              Registre la entrada y salida de los empleados de forma rápida y sencilla.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Time Clock
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(), "EEEE, MMMM dd, yyyy, h:mm a")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <Tabs defaultValue="in" value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
                      <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="in" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Clock In
                        </TabsTrigger>
                        <TabsTrigger value="out" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Clock Out
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <FormField
                      control={form.control}
                      name="employeeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First and last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location is automatically captured in the background but not shown */}

                    <Button 
                      type="submit" 
                      className={`w-full ${
                        activeTab === "in" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"
                      }`}
                      disabled={clockInMutation.isPending || clockOutMutation.isPending}
                    >
                      {(clockInMutation.isPending || clockOutMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {activeTab === "in" ? "Record Clock In" : "Record Clock Out"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Records</CardTitle>
                <CardDescription>
                  Latest clock in and clock out entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEntries ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : recentEntries && recentEntries.length > 0 ? (
                  <div className="space-y-4">
                    {recentEntries.map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{entry.employeeName}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(entry.timestamp), "MM/dd/yyyy h:mm a")}
                            </p>
                          </div>
                          <Badge
                            className={
                              entry.type === "IN"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            }
                          >
                            {entry.type === "IN" ? "Clock In" : "Clock Out"}
                          </Badge>
                        </div>
                        {entry.location && (
                          <div className="mt-2 flex items-start gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {entry.location}
                            </p>
                          </div>
                        )}
                        {entry.notes && <p className="mt-1 text-sm">{entry.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent records
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("list")}>
                  View all records
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}