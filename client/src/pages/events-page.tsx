import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Calendar, 
  Search, 
  Settings, 
  Download, 
  User, 
  MapPin, 
  Edit, 
  Eye, 
  Trash2,
  Clock
} from 'lucide-react';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  client?: {
    firstName: string;
    lastName: string;
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Site Inspection - Johnson Residence',
        description: 'Initial site inspection for fence installation project',
        startTime: '2024-01-15T09:00:00',
        endTime: '2024-01-15T10:30:00',
        location: '123 Main St, Anytown, CA',
        status: 'upcoming',
        client: { firstName: 'John', lastName: 'Johnson' }
      },
      {
        id: '2',
        title: 'Material Delivery - Smith Project',
        description: 'Delivery of fence materials and equipment',
        startTime: '2024-01-16T14:00:00',
        endTime: '2024-01-16T15:00:00',
        location: '456 Oak Ave, Somewhere, CA',
        status: 'upcoming',
        client: { firstName: 'Sarah', lastName: 'Smith' }
      },
      {
        id: '3',
        title: 'Installation Complete - Davis Fence',
        description: 'Final walkthrough and project completion',
        startTime: '2024-01-14T16:00:00',
        endTime: '2024-01-14T17:00:00',
        location: '789 Pine Rd, Elsewhere, CA',
        status: 'completed',
        client: { firstName: 'Mike', lastName: 'Davis' }
      }
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${event.client?.firstName} ${event.client?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewEvent = (event: Event) => {
    console.log('View event:', event);
  };

  const handleEditEvent = (event: Event) => {
    console.log('Edit event:', event);
  };

  const handleDeleteEvent = (eventId: string) => {
    console.log('Delete event:', eventId);
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
              Events
            </h1>
            <p className="remodra-subtitle">
              Schedule and manage your appointments and events
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button className="remodra-button" onClick={() => window.location.href = '/events/create'}>
              <Calendar className="h-5 w-5 mr-2" />
              New Event
            </Button>
            <Button className="remodra-button-outline" onClick={() => {
              // Export functionality
              const csvContent = "data:text/csv;charset=utf-8," + 
                "Title,Description,Start Time,End Time,Location,Status,Client\n" +
                events.map(e => 
                  `"${e.title}","${e.description}","${new Date(e.startTime).toLocaleString()}","${new Date(e.endTime).toLocaleString()}","${e.location}","${e.status}","${e.client?.firstName || ''} ${e.client?.lastName || ''}"`
                ).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "events.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>
              <Download className="h-5 w-5 mr-2" />
              Export Calendar
            </Button>
            <Button className="remodra-button-outline" onClick={() => window.location.href = '/settings'}>
              <Settings className="h-5 w-5 mr-2" />
              Calendar Settings
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="remodra-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search events by title, client, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="remodra-input pl-12"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
                <SelectTrigger className="remodra-input w-full lg:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">All Events</SelectItem>
                  <SelectItem value="upcoming" className="text-slate-200 hover:bg-slate-700">Upcoming</SelectItem>
                  <SelectItem value="completed" className="text-slate-200 hover:bg-slate-700">Completed</SelectItem>
                  <SelectItem value="cancelled" className="text-slate-200 hover:bg-slate-700">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{(events as any[])?.length || 0}</div>
              <div className="remodra-stats-label">Total Events</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{(events as any[])?.filter((e: any) => new Date(e.startTime) > new Date()).length || 0}</div>
              <div className="remodra-stats-label">Upcoming Events</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{(events as any[])?.filter((e: any) => new Date(e.startTime).toDateString() === new Date().toDateString()).length || 0}</div>
              <div className="remodra-stats-label">Today's Events</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{(events as any[])?.filter((e: any) => e.status === 'completed').length || 0}</div>
              <div className="remodra-stats-label">Completed</div>
              <div className="remodra-stats-accent"></div>
            </div>
          </div>

          {/* Events List */}
          <div className="remodra-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-400">Event Directory</h2>
              <Badge className="remodra-badge">
                {filteredEvents.length} Events
              </Badge>
            </div>

            {isLoading ? (
              <div className="remodra-loading">
                <div className="remodra-spinner"></div>
                <p className="text-slate-300">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="remodra-empty">
                <div className="remodra-empty-icon">📅</div>
                <div className="remodra-empty-title">No Events Found</div>
                <div className="remodra-empty-description">
                  {searchTerm ? `No events match "${searchTerm}"` : "Start by scheduling your first event"}
                </div>
                <Button className="remodra-button mt-4" onClick={() => window.location.href = '/events/create'}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule First Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="p-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600 hover:border-amber-500/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-slate-900" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-200 text-lg">
                            {event.title}
                          </h3>
                          <p className="text-slate-400 text-sm">{event.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${
                          event.status === 'completed' ? 'remodra-badge' :
                          event.status === 'cancelled' ? 'border-red-600/50 text-red-400' :
                          'remodra-badge-outline'
                        }`}>
                          {event.status}
                        </Badge>
                        <span className="text-amber-400 font-bold text-lg">
                          {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <User className="h-4 w-4 text-amber-400" />
                        <span className="text-sm">
                          {event.client?.firstName} {event.client?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="h-4 w-4 text-amber-400" />
                        <span className="text-sm">
                          {event.location || 'No location specified'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                      <div className="text-sm text-slate-400">
                        <span className="text-amber-400 font-semibold">
                          {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEvent(event)}
                          className="remodra-button-outline"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                          className="remodra-button-outline"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 