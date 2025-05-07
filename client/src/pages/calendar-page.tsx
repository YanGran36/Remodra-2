import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Plus } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";
import ScheduleItem from "@/components/dashboard/schedule-item";

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
  };
  orderNumber?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "day" | "week">("month");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filter, setFilter] = useState<string>("all");

  // Sample calendar events - in a real app, this would come from an API call
  const events: CalendarEvent[] = [
    {
      id: "1",
      title: "Site visit - Johnson Kitchen Remodel",
      date: new Date(),
      time: "9:00 AM",
      timeColor: "bg-blue-100 text-blue-800",
      location: "1234 Oak Street, Springfield",
      type: "site-visit",
      status: "confirmed",
      contact: {
        name: "Sarah Johnson",
        initials: "SJ"
      }
    },
    {
      id: "2",
      title: "Material pickup - Home Supply Co.",
      date: new Date(),
      time: "11:30 AM",
      timeColor: "bg-green-100 text-green-800",
      location: "520 Industrial Blvd",
      type: "delivery",
      status: "confirmed",
      orderNumber: "45622"
    },
    {
      id: "3",
      title: "Estimate Presentation - Taylor Bathroom Renovation",
      date: new Date(),
      time: "2:00 PM",
      timeColor: "bg-purple-100 text-purple-800",
      location: "567 Maple Drive, Springfield",
      type: "estimate",
      status: "confirmed",
      contact: {
        name: "Mark Taylor",
        initials: "MT"
      }
    },
    {
      id: "4",
      title: "Follow-up call - Wilson Project",
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      time: "10:00 AM",
      timeColor: "bg-blue-100 text-blue-800",
      location: "Phone call",
      type: "meeting",
      status: "pending",
      contact: {
        name: "Robert Wilson",
        initials: "RW"
      }
    },
    {
      id: "5",
      title: "Final inspection - Garcia Basement",
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      time: "1:00 PM",
      timeColor: "bg-yellow-100 text-yellow-800",
      location: "789 Elm Street, Springfield",
      type: "site-visit",
      status: "confirmed",
      contact: {
        name: "Luis Garcia",
        initials: "LG"
      }
    }
  ];

  // Filter events based on selected date and search term
  const filteredEvents = events.filter(event => {
    // Date filter
    const dateMatches = !selectedDate || isSameDay(event.date, selectedDate);
    
    // Search filter
    const searchMatches = search === "" || 
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase()) ||
      event.contact?.name.toLowerCase().includes(search.toLowerCase()) ||
      event.orderNumber?.toLowerCase().includes(search.toLowerCase());
    
    // Type filter
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

  // Handle month navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  // Function to check if a date has events
  const hasEvents = (date: Date) => {
    return events.some(event => isSameDay(event.date, date));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <PageHeader 
            title="Calendar" 
            description="Manage your schedule and appointments"
            actions={
              <Button className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            }
          />

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar controls */}
            <div className="lg:w-2/3">
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h2 className="text-xl font-semibold">
                        {format(currentDate, "MMMM yyyy")}
                      </h2>
                      <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant={view === "month" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setView("month")}
                      >
                        Month
                      </Button>
                      <Button 
                        variant={view === "week" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setView("week")}
                      >
                        Week
                      </Button>
                      <Button 
                        variant={view === "day" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setView("day")}
                      >
                        Day
                      </Button>
                    </div>
                  </div>

                  {/* Month view calendar */}
                  {view === "month" && (
                    <div className="grid grid-cols-7 gap-1">
                      {/* Day headers */}
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                        <div key={day} className="text-center text-sm font-medium py-2 text-gray-500">
                          {day}
                        </div>
                      ))}
                      
                      {/* Calendar days */}
                      {calendarDays.map((day, index) => {
                        if (!day) {
                          return <div key={`empty-${index}`} className="p-2 border border-transparent" />;
                        }
                        
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const dayHasEvents = hasEvents(day);
                        
                        return (
                          <div
                            key={day.toISOString()}
                            className={`min-h-[80px] p-1 border rounded-md cursor-pointer transition ${
                              isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                            } ${
                              isSelected ? "border-primary" : "border-gray-100 hover:border-gray-300"
                            } ${
                              isToday(day) ? "font-bold" : ""
                            }`}
                            onClick={() => setSelectedDate(day)}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-sm p-1 rounded-full w-6 h-6 flex items-center justify-center ${
                                isToday(day) ? "bg-primary text-white" : ""
                              }`}>
                                {format(day, "d")}
                              </span>
                              {dayHasEvents && (
                                <span className="h-2 w-2 rounded-full bg-primary"></span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {events.filter(event => isSameDay(event.date, day)).slice(0, 2).map((event, i) => (
                                <div key={event.id} className="text-xs px-1 py-0.5 truncate rounded bg-primary/10 text-primary">
                                  {event.time} {event.title.substring(0, 14)}...
                                </div>
                              ))}
                              {events.filter(event => isSameDay(event.date, day)).length > 2 && (
                                <div className="text-xs text-gray-500 pl-1">
                                  +{events.filter(event => isSameDay(event.date, day)).length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Event list */}
            <div className="lg:w-1/3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">
                      {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "All Events"}
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedDate(null)}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <SearchInput 
                      placeholder="Search events..." 
                      onSearch={setSearch} 
                      className="flex-1"
                    />
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="meeting">Meetings</SelectItem>
                        <SelectItem value="site-visit">Site Visits</SelectItem>
                        <SelectItem value="delivery">Deliveries</SelectItem>
                        <SelectItem value="estimate">Estimates</SelectItem>
                        <SelectItem value="invoice">Invoices</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No events found for the selected criteria
                      </div>
                    ) : (
                      filteredEvents.map(event => (
                        <Card key={event.id} className="overflow-hidden">
                          <ScheduleItem 
                            time={event.time}
                            timeColor={event.timeColor}
                            title={event.title}
                            location={event.location}
                            contact={event.contact}
                            orderNumber={event.orderNumber}
                            onPhoneClick={() => {}}
                            onMessageClick={event.contact ? () => {} : undefined}
                            onMapClick={() => {}}
                          />
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
