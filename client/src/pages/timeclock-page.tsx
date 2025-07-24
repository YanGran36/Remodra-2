import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, ArrowLeft, ArrowRight, MapPin, Loader2, FileText, Users, BarChart3 } from "lucide-react";
import { format } from "date-fns";

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';

import { useToast } from '../hooks/use-toast';
import { useLanguage } from '../hooks/use-language';
import { apiRequest } from '../lib/queryClient';
import TopNav from '../components/layout/top-nav';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';

const timeclockFormSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters"),
  jobType: z.string().min(2, "Job type is required"),
});

type TimeclockFormType = z.infer<typeof timeclockFormSchema>;

export default function TimeclockPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("clock");
  const [clockMode, setClockMode] = useState("in");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>("");
  const [expandedEmployees, setExpandedEmployees] = useState<{[key: string]: boolean}>({});
  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // Always prompt for location on page load/refresh
  const getLocation = async () => {
    setLocationError("");
    if ("geolocation" in navigator) {
      setIsLoadingLocation(true);
      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              // Try to get the location name
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
              );
              const data = await response.json();
              const locationName = data.display_name || `Lat: ${latitude}, Lng: ${longitude}`;
              setCurrentLocation(locationName);
              setLocationError("");
            } catch (error) {
              setCurrentLocation(`Lat: ${latitude}, Lng: ${longitude}`);
              setLocationError("");
            }
          },
          (error) => {
            // Location permission denied or unavailable - set a default location
            setCurrentLocation("Location not available");
            setLocationError("Location access denied. You can still clock in/out.");
          }
        );
      } catch (error) {
        setCurrentLocation("Location not available");
        setLocationError("Location access denied. You can still clock in/out.");
      } finally {
        setIsLoadingLocation(false);
      }
    } else {
      setCurrentLocation("Location not available");
      setLocationError("Geolocation not supported. You can still clock in/out.");
    }
  };

  useEffect(() => {
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get recent entries
  const { data: recentEntries = [], isLoading: loadingEntries } = useQuery<any[]>({
    queryKey: ["/api/timeclock/recent"],
  });
  
  // Get hours report (only for business owners)
  const { data: hoursReportData, isLoading: loadingReport } = useQuery<any>({
    queryKey: ["/api/timeclock/report"],
    enabled: activeTab === "report" && !!user,
  });
  
  // Extract daily and weekly report from response
  const hoursReport = hoursReportData?.dailyReport || {};
  const weeklyReport = hoursReportData?.weeklyReport || {};

  // Form setup
  const form = useForm<TimeclockFormType>({
    resolver: zodResolver(timeclockFormSchema),
    defaultValues: {
      employeeName: "",
      jobType: "",
    },
  });

  // Mutations for clock in and clock out registration
  const clockInMutation = useMutation({
    mutationFn: async (data: TimeclockFormType) => {
      // Use current location or fallback to "Location not available"
      const locationToUse = currentLocation || "Location not available";
      return await apiRequest("POST", "/api/timeclock/clock-in", {
        ...data,
        date: format(new Date(), "yyyy-MM-dd"),
        location: locationToUse,
      });
    },
    onSuccess: () => {
      toast({
        title: "Clock In Registered",
        description: "Your clock in has been successfully registered",
        variant: "default"
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Error Registering Clock In",
        description: error.message || "An error occurred while registering your clock in",
        variant: "destructive"
      });
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async (data: TimeclockFormType) => {
      // Use current location or fallback to "Location not available"
      const locationToUse = currentLocation || "Location not available";
      return await apiRequest("POST", "/api/timeclock/clock-out", {
        ...data,
        date: format(new Date(), "yyyy-MM-dd"),
        location: locationToUse,
      });
    },
    onSuccess: () => {
      toast({
        title: "Clock Out Registered",
        description: "Your clock out has been successfully registered",
        variant: "default"
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/report"] });
    },
    onError: (error) => {
      toast({
        title: "Error Registering Clock Out",
        description: error.message || "An error occurred while registering your clock out",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: TimeclockFormType) => {
    if (clockMode === "in") {
      clockInMutation.mutate(data);
    } else {
      clockOutMutation.mutate(data);
    }
  };

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <main className="p-8 space-y-8">
          {/* Header with Remodra branding */}
          <div className="text-center mb-8">
            <div className="remodra-logo mb-6">
              <span className="remodra-logo-text">R</span>
            </div>
            <h1 className="remodra-title mb-3">
              Time Clock
            </h1>
            <p className="remodra-subtitle">
              Record employee clock in and clock out times quickly and easily
            </p>
          </div>

          {/* Location error message */}
          {locationError && (
            <div className="remodra-alert remodra-alert-error">
              <MapPin className="h-5 w-5" />
              <p>{locationError}</p>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-800 border-slate-600 mb-6">
              <TabsTrigger value="clock" className="flex items-center data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
                <Clock className="h-4 w-4 mr-2" />
                Clock In/Out
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
                <Users className="h-4 w-4 mr-2" />
                Recent Entries
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
                <BarChart3 className="h-4 w-4 mr-2" />
                Hours Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clock" className="space-y-6">
              <div className="remodra-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-amber-400">Employee Time Clock</h2>
                    <p className="text-slate-300 mt-2">Record your work hours with location tracking</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-400" />
                    <span className="text-slate-300 text-sm">
                      {isLoadingLocation ? "Getting location..." : currentLocation}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Clock In/Out Form */}
                  <div className="remodra-card p-6">
                    <h3 className="text-lg font-semibold text-amber-400 mb-4">Clock In/Out</h3>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="employeeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300">Employee Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="remodra-input"
                                  placeholder="Enter your name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="jobType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-300">Job Type</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="remodra-input"
                                  placeholder="e.g., Construction, Office, Field Work"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-4 pt-4">
                          <Button
                            type="button"
                            onClick={() => setClockMode("in")}
                            className={`flex-1 ${
                              clockMode === "in" 
                                ? "remodra-button" 
                                : "remodra-button-outline"
                            }`}
                            disabled={clockInMutation.isPending}
                          >
                            {clockInMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ArrowRight className="h-4 w-4 mr-2" />
                            )}
                            Clock In
                          </Button>
                          
                          <Button
                            type="button"
                            onClick={() => setClockMode("out")}
                            className={`flex-1 ${
                              clockMode === "out" 
                                ? "remodra-button" 
                                : "remodra-button-outline"
                            }`}
                            disabled={clockOutMutation.isPending}
                          >
                            {clockOutMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ArrowLeft className="h-4 w-4 mr-2" />
                            )}
                            Clock Out
                          </Button>
                        </div>

                        <Button
                          type="submit"
                          className="remodra-button w-full"
                          disabled={clockInMutation.isPending || clockOutMutation.isPending}
                        >
                          {clockInMutation.isPending || clockOutMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Clock className="h-4 w-4 mr-2" />
                          )}
                          {clockMode === "in" ? "Register Clock In" : "Register Clock Out"}
                        </Button>
                      </form>
                    </Form>
                  </div>

                  {/* Current Status */}
                  <div className="remodra-card p-6">
                    <h3 className="text-lg font-semibold text-amber-400 mb-4">Current Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
                        <div>
                          <p className="text-slate-300 text-sm">Current Time</p>
                          <p className="text-amber-400 font-bold text-lg">
                            {format(new Date(), "HH:mm:ss")}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-amber-400" />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
                        <div>
                          <p className="text-slate-300 text-sm">Today's Date</p>
                          <p className="text-amber-400 font-bold text-lg">
                            {format(new Date(), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <FileText className="h-8 w-8 text-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-6">
              <div className="remodra-card p-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">Recent Entries</h2>
                
                {loadingEntries ? (
                  <div className="remodra-loading">
                    <div className="remodra-spinner"></div>
                    <p className="text-slate-300">Loading recent entries...</p>
                  </div>
                ) : recentEntries.length === 0 ? (
                  <div className="remodra-empty">
                    <div className="remodra-empty-icon">⏰</div>
                    <div className="remodra-empty-title">No Recent Entries</div>
                    <div className="remodra-empty-description">Clock in to see your entries here</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentEntries.map((entry: any) => (
                      <div key={entry.id} className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-200">{entry.employeeName}</h4>
                            <p className="text-slate-400 text-sm">{entry.jobType}</p>
                            <p className="text-slate-400 text-sm">{entry.location}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={`${
                              entry.type === 'clock_in' ? 'remodra-badge' : 'remodra-badge-outline'
                            }`}>
                              {entry.type === 'clock_in' ? 'Clock In' : 'Clock Out'}
                            </Badge>
                            <p className="text-amber-400 font-bold mt-1">
                              {format(new Date(entry.timestamp), "HH:mm")}
                            </p>
                            <p className="text-slate-400 text-sm">
                              {format(new Date(entry.timestamp), "MMM dd")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="report" className="space-y-6">
              <div className="remodra-card p-6">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">Hours Report</h2>
                
                {loadingReport ? (
                  <div className="remodra-loading">
                    <div className="remodra-spinner"></div>
                    <p className="text-slate-300">Loading hours report...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="remodra-card p-6">
                      <h3 className="text-lg font-semibold text-amber-400 mb-4">Daily Report</h3>
                      <div className="space-y-3">
                        {Object.entries(hoursReport).map(([employee, hours]: [string, any]) => (
                          <div key={employee} className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
                            <span className="text-slate-300">{employee}</span>
                            <span className="text-amber-400 font-bold">{hours} hrs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="remodra-card p-6">
                      <h3 className="text-lg font-semibold text-amber-400 mb-4">Weekly Report</h3>
                      <div className="space-y-3">
                        {Object.entries(weeklyReport).map(([employee, hours]: [string, any]) => (
                          <div key={employee} className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
                            <span className="text-slate-300">{employee}</span>
                            <span className="text-amber-400 font-bold">{hours} hrs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}