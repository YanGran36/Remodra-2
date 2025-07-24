import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2, Home, UserPlus, Users, Search, Filter } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay, startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import TopNav from '../components/layout/top-nav';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import { useLocation } from "wouter";
import { useEvents } from '../hooks/use-events';
import EventDialog from '../components/events/event-dialog';
import AgentScheduler from '../components/agents/AgentScheduler';
import { useQuery } from "@tanstack/react-query";

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

          <Tabs defaultValue="calendar" className="space-y-4">
            <TabsList className="bg-slate-800 border-slate-600">
              <TabsTrigger value="calendar" className="flex items-center data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
                <Users className="h-4 w-4 mr-2" />
                Agent Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-4">
              {/* Agent Color Legend */}
              {agents.length > 0 && (
                <div className="remodra-card p-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-slate-300">Agent Assignments:</span>
                    {agents.filter((agent: any) => agent.isActive).map((agent: any) => (
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