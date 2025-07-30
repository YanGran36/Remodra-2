import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  ArrowRight,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Appointment {
  id: number;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  type: string;
  status: string;
  clientId: number;
  agentId: number | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

interface Agent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  colorCode: string;
  isActive: boolean;
}

export default function ReassignAppointments() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch appointments for selected date
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const response = await fetch(`/api/protected/events?date=${format(selectedDate, 'yyyy-MM-dd')}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
    enabled: !!selectedDate,
  });

  // Fetch agents
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await fetch('/api/protected/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json();
    }
  });

  // Reassign appointment mutation
  const reassignMutation = useMutation({
    mutationFn: async ({ appointmentId, agentId }: { appointmentId: number; agentId: number | null }) => {
      const response = await fetch(`/api/protected/events/${appointmentId}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId })
      });
      if (!response.ok) throw new Error('Failed to reassign appointment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setSelectedAppointment(null);
      setSelectedAgentId('');
      toast.success('Appointment reassigned successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to reassign appointment: ${error.message}`);
    },
  });

  const handleReassign = () => {
    if (!selectedAppointment) return;
    
    const agentId = selectedAgentId === 'unassigned' ? null : parseInt(selectedAgentId);
    reassignMutation.mutate({ 
      appointmentId: selectedAppointment.id, 
      agentId 
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const getAgentName = (agentId: number | null) => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find((a: Agent) => a.id === agentId);
    return agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown Agent';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <RefreshCw className="h-8 w-8" />
            Reassign Appointments
          </CardTitle>
          <CardDescription>
            Select a date and reassign appointments to different agents or mark as unassigned.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Selection */}
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Select Date:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-auto justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Appointments List */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Appointments for {format(selectedDate, "PPP")}
                </CardTitle>
                <CardDescription>
                  Click on an appointment to reassign it to a different agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAppointments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading appointments...</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📅</div>
                    <div className="text-xl font-semibold">No Appointments</div>
                    <div className="text-muted-foreground mt-2">
                      No appointments scheduled for this date.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Appointment</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Current Agent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.map((appointment: Appointment) => (
                          <TableRow 
                            key={appointment.id}
                            className={`cursor-pointer hover:bg-muted transition-colors ${
                              selectedAppointment?.id === appointment.id ? 'bg-muted' : ''
                            }`}
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {format(new Date(appointment.startTime), "h:mm a")} - 
                                  {format(new Date(appointment.endTime), "h:mm a")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-semibold">{appointment.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {appointment.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {appointment.address}, {appointment.city}, {appointment.state}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getAgentName(appointment.agentId)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={getStatusColor(appointment.status)}
                              >
                                {appointment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAppointment(appointment);
                                }}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reassignment Panel */}
          {selectedAppointment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Reassign Appointment
                </CardTitle>
                <CardDescription>
                  Select a new agent for: <strong>{selectedAppointment.title}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Current Agent</Label>
                    <div className="p-3 bg-muted rounded-md">
                      {getAgentName(selectedAppointment.agentId)}
                    </div>
                  </div>
                  <div>
                    <Label>New Agent</Label>
                    <Select
                      value={selectedAgentId}
                      onValueChange={setSelectedAgentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {agents.map((agent: Agent) => (
                          <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.firstName} {agent.lastName} ({agent.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleReassign}
                    disabled={reassignMutation.isPending || !selectedAgentId}
                    className="flex items-center gap-2"
                  >
                    {reassignMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {reassignMutation.isPending ? 'Reassigning...' : 'Reassign Appointment'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedAppointment(null);
                      setSelectedAgentId('');
                    }}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          {selectedDate && appointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{appointments.length}</div>
                    <div className="text-sm text-muted-foreground">Total Appointments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {appointments.filter((a: Appointment) => a.agentId).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Assigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {appointments.filter((a: Appointment) => !a.agentId).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Unassigned</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 