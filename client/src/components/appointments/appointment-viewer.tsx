import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Appointment {
  id: number;
  title: string;
  startTime: number;
  endTime: number;
  clientId: number;
  type: string;
  status: string;
  address: string;
  clientName?: string;
  clientEmail?: string;
}

interface AppointmentViewerProps {
  onSelectAppointment?: (appointment: Appointment) => void;
  showCreateEstimate?: boolean;
}

export default function AppointmentViewer({ 
  onSelectAppointment, 
  showCreateEstimate = true 
}: AppointmentViewerProps) {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Fetch appointments for selected date
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/protected/agents/schedule?date=${dateStr}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      
      // Flatten and format appointments
      const allAppointments: Appointment[] = [];
      
      if (data.schedule) {
        data.schedule.forEach((agent: any) => {
          // Add events
          agent.events?.forEach((event: any) => {
            allAppointments.push({
              id: event.id,
              title: event.title,
              startTime: event.startTime,
              endTime: event.endTime,
              clientId: event.clientId,
              type: 'event',
              status: event.status,
              address: event.address,
              clientName: event.clientName,
              clientEmail: event.clientEmail
            });
          });
          
          // Add estimates
          agent.estimates?.forEach((estimate: any) => {
            allAppointments.push({
              id: estimate.id,
              title: `Estimate: ${estimate.estimateNumber}`,
              startTime: estimate.appointmentDate,
              endTime: estimate.appointmentDate + (estimate.appointmentDuration * 60 * 1000),
              clientId: estimate.clientId,
              type: 'estimate',
              status: estimate.status,
              address: estimate.address || 'TBD',
              clientName: estimate.clientName,
              clientEmail: estimate.clientEmail
            });
          });
        });
      }
      
      return allAppointments.sort((a, b) => a.startTime - b.startTime);
    },
    enabled: !!selectedDate
  });

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsDatePickerOpen(false);
    }
  };

  const handleCreateEstimate = (appointment: Appointment) => {
    if (onSelectAppointment) {
      onSelectAppointment(appointment);
    } else {
      setLocation(`/estimates/create?clientId=${appointment.clientId}&appointmentDate=${appointment.startTime}`);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'estimate':
        return <FileText className="h-4 w-4" />;
      case 'event':
        return <Clock className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Appointments
            </CardTitle>
            <CardDescription>
              View and manage appointments for {format(selectedDate, 'MMMM d, yyyy')}
            </CardDescription>
          </div>
          
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    "w-[200px]"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto"></div>
            <p className="mt-2 text-slate-400">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-200 mb-2">No Appointments</h3>
            <p className="text-slate-400 mb-4">
              No appointments scheduled for {format(selectedDate, 'MMMM d, yyyy')}
            </p>
            {showCreateEstimate && (
              <Button onClick={() => setLocation('/estimates/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Estimate
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(appointment.type)}
                      <h4 className="font-semibold text-amber-400">{appointment.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {appointment.type}
                      </Badge>
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(appointment.status))} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(appointment.startTime), 'h:mm a')} - 
                            {format(new Date(appointment.endTime), 'h:mm a')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPin className="h-3 w-3" />
                          <span>{appointment.address}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                          <User className="h-3 w-3" />
                          <span>{appointment.clientName || 'Client TBD'}</span>
                        </div>
                        
                        {appointment.clientEmail && (
                          <div className="text-slate-500 text-xs">
                            {appointment.clientEmail}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {showCreateEstimate && appointment.type === 'event' && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateEstimate(appointment)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Create Estimate
                      </Button>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{appointment.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Appointment Details</h4>
                            <div className="space-y-2 text-sm">
                              <div><strong>Date:</strong> {format(new Date(appointment.startTime), 'PPP')}</div>
                              <div><strong>Time:</strong> {format(new Date(appointment.startTime), 'h:mm a')} - {format(new Date(appointment.endTime), 'h:mm a')}</div>
                              <div><strong>Duration:</strong> {Math.round((appointment.endTime - appointment.startTime) / (1000 * 60))} minutes</div>
                              <div><strong>Status:</strong> {appointment.status}</div>
                              <div><strong>Type:</strong> {appointment.type}</div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Location</h4>
                            <p className="text-sm">{appointment.address}</p>
                          </div>
                          
                          {appointment.clientName && (
                            <div>
                              <h4 className="font-semibold mb-2">Client</h4>
                              <div className="text-sm">
                                <div>{appointment.clientName}</div>
                                {appointment.clientEmail && <div className="text-slate-500">{appointment.clientEmail}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 