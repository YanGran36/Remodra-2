import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2, Home, UserPlus, Users, Search, Filter, UserCheck } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay, startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import TopNav from '../components/layout/top-nav';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import { useLocation } from "wouter";
import { useEvents } from '../hooks/use-events';
import { useToast } from '../hooks/use-toast';
import EventDialog from '../components/events/event-dialog';
import AgentScheduler from '../components/agents/AgentScheduler';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Event interface
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  timeColor: string;
  location: string;
  type: "meeting" | "site-visit" | "delivery" | "estimate" | "invoice" | "other";
  status: "confirmed" | "pending" | "completed" | "cancelled";
  contact?: {
    name: string;
    avatar?: string;
    initials?: string;
    id?: number;
  };
  orderNumber?: string;
  clientId?: number;
  projectId?: number;
  description?: string;
  agentId?: number;
  agentName?: string | null;
  estimateId?: number;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "day" | "week">("month");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [, setLocation] = useLocation();
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<number | undefined>(undefined);
  const [defaultClientId, setDefaultClientId] = useState<string | undefined>(undefined);
  const [defaultEventType, setDefaultEventType] = useState<string | undefined>("estimate");
  
  // Reassignment functionality
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignmentData, setAssignmentData] = useState<any>({
    selectedDate: format(currentDate, 'yyyy-MM-dd'),
    appointmentId: '',
    newAgentId: ''
  });

  // Sync assignment date with current calendar date
  useEffect(() => {
    setAssignmentData(prev => ({
      ...prev,
      selectedDate: format(currentDate, 'yyyy-MM-dd')
    }));
  }, [currentDate]);
  
  // Obtener eventos reales desde la API
  const { getEvents, formatEvent, deleteEvent } = useEvents();
  const { data: apiEvents = [], isLoading } = getEvents();
  
  // Fetch agents for color coding
  const { data: agents = [] } = useQuery<any[]>({
    queryKey: ['/api/protected/agents'],
  });

  // Fetch clients for event contact names
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/protected/clients'],
  });

  // Agent color mapping - using database colors
  const getAgentColor = (agentId?: number) => {
    if (!agentId) return '#6B7280'; // Gray for unassigned
    const agent = agents.find(agent => agent.id === agentId);
    return agent?.colorCode || '#3B82F6'; // Default to blue if no color set
  };

  const getAgentName = (agentId?: number) => {
    if (!agentId) return null;
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.firstName} ${agent.lastName}` : null;
  };
  
  // Convertir los eventos de la API al formato que espera el calendario
  // Force refresh to ensure cancelled events are filtered out
  const events: CalendarEvent[] = isLoading ? [] : apiEvents
    .filter(event => event.status !== "cancelled")
    .map(event => {
      const agentId = (event as any).agentId;
      const agentName = agentId ? getAgentName(agentId) : null;
      // Find client for contact name
      let contact = undefined;
      if (event.clientId) {
        const client = clients.find((c: any) => c.id === event.clientId);
        if (client) {
          contact = { name: `${client.firstName} ${client.lastName}` };
        }
      }
      return {
        ...formatEvent(event),
        // Override timeColor with agent color if available
        timeColor: getAgentColor(agentId),
        // Add agent info if available
        agentId: agentId,
        agentName: agentName || undefined,
        contact,
      };
    });

  // Get date range based on current view
  const getDateRange = () => {
    switch (view) {
      case "day":
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        };
      case "week":
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate)
        };
      case "month":
      default:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        };
    }
  };

  const dateRange = getDateRange();

  // Filter events based on view, selected date, search term, and type
  const filteredEvents = events.filter(event => {
    // Hide cancelled events
    if (event.status === "cancelled") {
      return false;
    }
    
    // Date filter based on view
    let dateMatches = false;
    
    if (selectedDate) {
      // If a specific date is selected, show only events for that date
      dateMatches = isSameDay(event.date, selectedDate);
    } else {
      // Filter by current view range (month/week/day)
      dateMatches = isWithinInterval(event.date, dateRange);
    }
    
    // Search filter
    const searchMatches = search === "" || 
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      (event.location && event.location.toLowerCase().includes(search.toLowerCase())) ||
      (event.contact?.name && event.contact.name.toLowerCase().includes(search.toLowerCase()));
    
    // Type filter - when "all" is selected, show all types
    const typeMatches = filter === "all" || event.type === filter;
    
    return dateMatches && searchMatches && typeMatches;
  });

  // Get days to display in the calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of the week for the first of the month (0 = Sunday, 6 = Saturday)
  const startDay = getDay(monthStart);

  // Generate calendar grid with empty cells for proper alignment
  const calendarDays = Array(startDay).fill(null).concat(daysInMonth);

  // Handle navigation based on current view
  const navigateNext = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
      default:
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const navigatePrev = () => {
    switch (view) {
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "month":
      default:
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };
  
  // Function to check if a date has events (excluding cancelled events)
  const hasEvents = (date: Date) => {
    return events.some(event => isSameDay(event.date, date) && event.status !== "cancelled");
  };
  
  // Handler to create an estimate from an appointment
  const handleCreateEstimate = (clientId: number) => {
    setLocation(`/vendor-estimate-form-new?clientId=${clientId}`);
  };

  // Manejadores para crear nuevos eventos
  const handleOpenNewEventDialog = () => {
    setCurrentEventId(undefined);
    setIsNewEventDialogOpen(true);
  };

  const handleCloseNewEventDialog = () => {
    setIsNewEventDialogOpen(false);
    setCurrentEventId(undefined);
  };

  // Manejadores para editar eventos existentes
  const handleOpenEditEventDialog = (eventId: number) => {
    setCurrentEventId(eventId);
    setIsEditEventDialogOpen(true);
  };

  const handleCloseEditEventDialog = () => {
    setIsEditEventDialogOpen(false);
    setCurrentEventId(undefined);
  };

  // Handler para editar un evento existente
  const handleEditEvent = (eventId: string) => {
    handleOpenEditEventDialog(Number(eventId));
  };

  // Reassignment mutation
  const assignEstimateMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      // Update the appointment with the new agent
      const eventResponse = await fetch(`/api/protected/events/${assignmentData.appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          agent_id: assignmentData.newAgentId
        }),
      });
      
      if (!eventResponse.ok) {
        const error = await eventResponse.json();
        throw new Error(error.message || 'Failed to update appointment');
      }
      
      return await eventResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Updated",
        description: "The appointment has been successfully reassigned to the new agent.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/events'] });
      setAssignmentData({
        selectedDate: new Date().toISOString().split('T')[0],
        appointmentId: '',
        newAgentId: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssignSubmit = () => {
    if (!assignmentData.appointmentId || !assignmentData.newAgentId) {
      toast({
        title: "Missing Information",
        description: "Please select an appointment and a new agent.",
        variant: "destructive",
      });
      return;
    }

    const assignmentPayload = {
      appointmentId: assignmentData.appointmentId,
      newAgentId: assignmentData.newAgentId
    };

    assignEstimateMutation.mutate(assignmentPayload);
  };

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <main className="p-8 space-y-8">
          {/* Header with Remodra branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/remodra-logo.png" 
                alt="Remodra Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="remodra-title mb-3">
              Calendar & Scheduling
            </h1>
            <p className="remodra-subtitle">
              Manage your schedule, appointments, and field agents
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button className="remodra-button" onClick={() => handleOpenNewEventDialog()}>
              <Plus className="h-5 w-5 mr-2" />
              New Event
            </Button>
            <Button className="remodra-button-outline" onClick={() => setLocation("/lead-capture")}>
              <UserPlus className="h-5 w-5 mr-2" />
              New Client
            </Button>
          </div>

          <Tabs defaultValue="calendar" className="space-y-4">
            <TabsList className="remodra-card p-3 bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-amber-500/30 shadow-lg">
              <TabsTrigger 
                value="calendar" 
                className="flex items-center px-6 py-3 text-slate-300 hover:text-amber-400 hover:bg-slate-700/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:font-bold data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-lg transition-all duration-300 border border-transparent data-[state=active]:border-amber-300"
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                <span className="font-semibold">Calendar</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reassign" 
                className="flex items-center px-6 py-3 text-slate-300 hover:text-amber-400 hover:bg-slate-700/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:font-bold data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-lg transition-all duration-300 border border-transparent data-[state=active]:border-amber-300"
              >
                <UserCheck className="h-5 w-5 mr-2" />
                <span className="font-semibold">Reassign Appointments</span>
              </TabsTrigger>
              <TabsTrigger 
                value="agents" 
                className="flex items-center px-6 py-3 text-slate-300 hover:text-amber-400 hover:bg-slate-700/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:font-bold data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-lg transition-all duration-300 border border-transparent data-[state=active]:border-amber-300"
              >
                <Users className="h-5 w-5 mr-2" />
                <span className="font-semibold">Agent Management</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-4">
              {/* Search and Filters */}
              <div className="remodra-card p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Search events by title, location, or client..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="remodra-input pl-12"
                    />
                  </div>
                  <Select value={filter} onValueChange={(value: string) => setFilter(value)}>
                    <SelectTrigger className="remodra-input w-full lg:w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">All Events</SelectItem>
                      <SelectItem value="meeting" className="text-slate-200 hover:bg-slate-700">Meetings</SelectItem>
                      <SelectItem value="site-visit" className="text-slate-200 hover:bg-slate-700">Site Visits</SelectItem>
                      <SelectItem value="estimate" className="text-slate-200 hover:bg-slate-700">Estimates</SelectItem>
                      <SelectItem value="invoice" className="text-slate-200 hover:bg-slate-700">Invoices</SelectItem>
                      <SelectItem value="delivery" className="text-slate-200 hover:bg-slate-700">Deliveries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Agent Color Legend */}
              {agents.length > 0 && (
                <div className="remodra-card p-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-slate-300">Agent Assignments:</span>
                    {agents.map((agent: any) => (
                      <div key={agent.id} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-slate-600 shadow-sm" 
                          style={{ backgroundColor: agent.colorCode || '#3B82F6' }}
                        />
                        <span className="text-sm text-slate-300">
                          {agent.firstName} {agent.lastName}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-slate-600 shadow-sm" />
                      <span className="text-sm text-slate-300">Unassigned</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
                {/* Main Calendar Section */}
                <div className="w-full xl:w-2/3">
                  <div className="remodra-card p-6">
                    {/* Calendar Header - Responsive */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                      {/* Navigation Controls */}
                      <div className="flex items-center gap-2 order-2 sm:order-1">
                        <Button variant="outline" size="sm" onClick={navigatePrev} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-base sm:text-lg lg:text-xl font-semibold min-w-[180px] sm:min-w-[200px] text-center px-2 text-amber-400">
                          {view === "day" 
                            ? format(currentDate, "MMM d, yyyy")
                            : view === "week"
                              ? `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d")}`
                              : format(currentDate, "MMMM yyyy")
                          }
                        </h2>
                        <Button variant="outline" size="sm" onClick={navigateNext} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* View Toggle Buttons */}
                      <div className="flex gap-1 sm:gap-2 order-1 sm:order-2">
                        <Button 
                          variant={view === "month" ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setView("month")}
                          className={`text-xs sm:text-sm px-2 sm:px-3 ${
                            view === "month" 
                              ? "bg-amber-400 text-slate-900" 
                              : "border-slate-600 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Month
                        </Button>
                        <Button 
                          variant={view === "week" ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setView("week")}
                          className={`text-xs sm:text-sm px-2 sm:px-3 ${
                            view === "week" 
                              ? "bg-amber-400 text-slate-900" 
                              : "border-slate-600 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Week
                        </Button>
                        <Button 
                          variant={view === "day" ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setView("day")}
                          className={`text-xs sm:text-sm px-2 sm:px-3 ${
                            view === "day" 
                              ? "bg-amber-400 text-slate-900" 
                              : "border-slate-600 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          Day
                        </Button>
                      </div>
                    </div>

                    {/* Loading indicator */}
                    {isLoading ? (
                      <div className="remodra-loading">
                        <div className="remodra-spinner"></div>
                        <p className="text-slate-300">Loading events...</p>
                      </div>
                    ) : (
                      <div>
                        {/* Month View - Responsive */}
                        {view === "month" && (
                          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                            {/* Day headers */}
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                              <div key={day} className="text-center text-xs sm:text-sm font-medium py-1 sm:py-2 text-amber-400">
                                <span className="hidden sm:inline">{day}</span>
                                <span className="sm:hidden">{day.charAt(0)}</span>
                              </div>
                            ))}
                            
                            {/* Calendar days */}
                            {calendarDays.map((day, index) => {
                              if (!day) {
                                return <div key={`empty-${index}`} className="p-1 sm:p-2 border border-transparent" />;
                              }
                              
                              const isCurrentMonth = isSameMonth(day, currentDate);
                              const isSelected = selectedDate && isSameDay(day, selectedDate);
                              const dayHasEvents = hasEvents(day);
                              
                              return (
                                <div
                                  key={day.toISOString()}
                                  className={`min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] p-0.5 sm:p-1 border rounded cursor-pointer transition ${
                                    isCurrentMonth ? "bg-slate-800" : "bg-slate-900 text-slate-400"
                                  } ${
                                    isSelected ? "border-amber-400" : "border-slate-600 hover:border-slate-500"
                                  } ${
                                    isToday(day) ? "font-bold" : ""
                                  }`}
                                  onClick={() => setSelectedDate(day)}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className={`text-xs sm:text-sm p-0.5 sm:p-1 rounded-full w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center ${
                                      isToday(day) ? "bg-amber-400 text-slate-900" : "text-slate-300"
                                    }`}>
                                      {format(day, "d")}
                                    </span>
                                    {dayHasEvents && (
                                      <div className="flex gap-0.5">
                                        {events.filter(event => isSameDay(event.date, day)).slice(0, 3).map((event, idx) => (
                                          <span 
                                            key={`${event.id}-${idx}`}
                                            className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full border border-slate-600 shadow-sm" 
                                            style={{ backgroundColor: event.timeColor }}
                                            title={event.agentName ? `${event.title} - ${event.agentName}` : `${event.title} - Unassigned`}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-0.5 sm:space-y-1 hidden sm:block">
                                    {events.filter(event => isSameDay(event.date, day)).slice(0, window.innerWidth < 640 ? 1 : 2).map((event) => (
                                      <div 
                                        key={event.id} 
                                        className="text-xs px-1 py-0.5 truncate rounded bg-amber-400/20 text-amber-400 cursor-pointer hover:bg-amber-400/30"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditEvent(event.id);
                                        }}
                                        title={`${event.title} - ${event.contact?.name || 'No client'} - ${event.time}`}
                                      >
                                        {event.contact?.name || event.title.substring(0, window.innerWidth < 1024 ? 8 : 14) + "..."}
                                      </div>
                                    ))}
                                    {events.filter(event => isSameDay(event.date, day)).length > (window.innerWidth < 640 ? 1 : 2) && (
                                      <div className="text-xs text-slate-400 px-1">
                                        +{events.filter(event => isSameDay(event.date, day)).length - (window.innerWidth < 640 ? 1 : 2)} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="w-full xl:w-1/3">
                  <div className="remodra-card p-6">
                    <h3 className="text-lg font-semibold text-amber-400 mb-4">Today's Events</h3>
                    {isLoading ? (
                      <div className="remodra-loading">
                        <div className="remodra-spinner"></div>
                        <p className="text-slate-300">Loading...</p>
                      </div>
                    ) : filteredEvents.length === 0 ? (
                      <div className="remodra-empty">
                        <div className="remodra-empty-icon">📅</div>
                        <div className="remodra-empty-title">No Events Today</div>
                        <div className="remodra-empty-description">Enjoy your day off or add some events</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredEvents.slice(0, 5).map((event) => (
                          <div key={event.id} className="p-3 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600 hover:border-amber-500/50 transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold`} style={{ backgroundColor: event.timeColor }}>
                                {event.time}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-200 text-sm">{event.title}</h4>
                                <p className="text-slate-400 text-xs">{event.location}</p>
                                {event.contact && (
                                  <p className="text-slate-400 text-xs">{event.contact.name}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reassign" className="space-y-4">
              <div className="remodra-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">Reassign Appointments</h3>
                    <p className="text-slate-300">Change which agent is assigned to existing appointments</p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Reassign Appointment to Different Agent</CardTitle>
                    <CardDescription>Select an existing appointment and change its assigned agent</CardDescription>
                  </CardHeader>
                  

                  <CardContent className="space-y-4">
                    {/* Date Selection - Auto-synced with main calendar */}
                    <div>
                      <Label htmlFor="selectedDate">Calendar Date (Auto-synced)</Label>
                      <Input
                        id="selectedDate"
                        type="date"
                        value={format(currentDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          // Create date in local timezone to avoid timezone issues
                          const [year, month, day] = e.target.value.split('-').map(Number);
                          const newDate = new Date(year, month - 1, day);
                          setCurrentDate(newDate);
                        }}
                        className="remodra-input"
                      />
                    </div>

                    {/* Available Appointments Section */}
                    <div className="p-4 bg-slate-700 border border-slate-600 rounded-md">
                      <div className="text-sm font-semibold text-amber-400 mb-2">
                        Appointments for {format(currentDate, 'yyyy-MM-dd')}
                      </div>
                      <div className="text-sm text-slate-300 space-y-1">
                        {apiEvents && apiEvents.length > 0 ? (
                          apiEvents
                            .filter((event: any) => {
                              if (!event.startTime) return false;
                              const appointmentDate = new Date(event.startTime);
                              return isSameDay(appointmentDate, currentDate);
                            })
                            .slice(0, 5)
                            .map((event: any) => (
                              <div key={event.id}>
                                {event.title} - {new Date(event.startTime).toLocaleTimeString()}
                              </div>
                            ))
                        ) : (
                          <div className="text-slate-400">Loading appointments...</div>
                        )}
                        {apiEvents && apiEvents.filter((event: any) => {
                          if (!event.startTime) return false;
                          const appointmentDate = new Date(event.startTime);
                          return isSameDay(appointmentDate, currentDate);
                        }).length === 0 && (
                          <div className="text-slate-400">No appointments for this date</div>
                        )}
                      </div>
                    </div>

                    {/* Select Appointment */}
                    <div>
                      <Label htmlFor="appointmentId">Select Appointment</Label>
                      <Select
                        value={assignmentData.appointmentId}
                        onValueChange={(value) => setAssignmentData({...assignmentData, appointmentId: value})}
                      >
                        <SelectTrigger className="remodra-input">
                          <SelectValue placeholder="Choose an appointment" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {apiEvents && apiEvents.length > 0 ? (
                            apiEvents
                              .filter((event: any) => {
                                if (!event.startTime) return false;
                                const appointmentDate = new Date(event.startTime);
                                return isSameDay(appointmentDate, currentDate);
                              })
                              .map((event: any) => (
                                <SelectItem key={event.id} value={event.id.toString()}>
                                  {event.title} - {new Date(event.startTime).toLocaleTimeString()}
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="" disabled>No appointments available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Select New Agent */}
                    <div>
                      <Label htmlFor="newAgentId">Assign to Agent</Label>
                      <Select
                        value={assignmentData.newAgentId}
                        onValueChange={(value) => setAssignmentData({...assignmentData, newAgentId: value})}
                      >
                        <SelectTrigger className="remodra-input">
                          <SelectValue placeholder="Choose a new agent" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {agents && agents.length > 0 ? (
                            agents.map((agent: any) => (
                              <SelectItem key={agent.id} value={agent.id.toString()}>
                                {agent.firstName} {agent.lastName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>No agents available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        onClick={handleAssignSubmit}
                        disabled={assignEstimateMutation.isPending}
                        className="remodra-button"
                      >
                        {assignEstimateMutation.isPending ? 'Updating...' : 'Reassign Appointment'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <div className="remodra-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">Agent Management</h3>
                    <p className="text-slate-300">Manage your field agents and their assignments</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button className="remodra-button-outline" onClick={() => setLocation("/")}>
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>
                    <Button className="remodra-button-outline" onClick={() => setLocation("/agents")}>
                      <Users className="h-4 w-4 mr-2" />
                      Full Agent Management
                    </Button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <Button className="remodra-button" onClick={() => setLocation("/agents")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Agent
                  </Button>
                </div>
                
                <AgentScheduler selectedDate={format(currentDate, 'yyyy-MM-dd')} />
              </div>
            </TabsContent>
          </Tabs>
        </main>
        </div>
      </div>

      {/* Event Dialogs */}
      <EventDialog
        isOpen={isNewEventDialogOpen}
        onClose={handleCloseNewEventDialog}
        eventId={undefined}
        defaultClientId={defaultClientId}
        defaultType={defaultEventType}
      />
      
      <EventDialog
        isOpen={isEditEventDialogOpen}
        onClose={handleCloseEditEventDialog}
        eventId={currentEventId}
      />
    </div>
  );
}