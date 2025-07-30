import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Calendar, User, Phone, Mail, MapPin, Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { useToast } from '../hooks/use-toast';
import { Agent, AgentInsert } from '../../../shared/schema';
import AgentScheduler from '../components/agents/AgentScheduler';
import { Link } from 'wouter';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

export default function AgentManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form state
  const [formData, setFormData] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    role: 'field_agent',
    isActive: true,
    specialties: [],
    hourlyRate: '',
    commissionRate: '',
    hireDate: '',
    notes: '',
    colorCode: '#3B82F6'
  });

  // Assignment form state
  const [assignmentData, setAssignmentData] = useState<any>({
    selectedDate: new Date().toISOString().split('T')[0],
    appointmentId: '',
    newAgentId: ''
  });

  // Predefined color options for agents
  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Lime', value: '#84CC16' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Rose', value: '#F43F5E' }
  ];

  // Fetch agents
  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/protected/agents'],
    queryFn: async () => {
      const response = await fetch('/api/protected/agents', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      return response.json();
    },
  });

  // Fetch appointments for assignment
  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/protected/events'],
    queryFn: async () => {
      const response = await fetch('/api/protected/events', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      return response.json();
    },
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (agentData: Partial<AgentInsert>) => {
      const response = await fetch('/api/protected/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(agentData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create agent');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Created",
        description: "The agent has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/agents'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, ...agentData }: Partial<AgentInsert> & { id: number }) => {
      const response = await fetch(`/api/protected/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(agentData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update agent');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Updated",
        description: "The agent has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/agents'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/protected/agents/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete agent');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Deleted",
        description: "The agent has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/agents'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign appointment mutation
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

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      employeeId: '',
      role: 'field_agent',
      isActive: true,
      specialties: [],
      hourlyRate: '',
      commissionRate: '',
      hireDate: '',
      notes: '',
      colorCode: '#3B82F6'
    });
    setEditingAgent(null);
    setShowAgentDialog(false);
  };

  const handleEditAgent = (agent: Agent) => {
    setFormData({
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email || '',
      phone: agent.phone,
      employeeId: agent.employeeId || '',
      role: agent.role,
      isActive: agent.isActive,
      specialties: agent.specialties as string[],
      hourlyRate: agent.hourlyRate ? agent.hourlyRate.toString() : undefined,
      commissionRate: agent.commissionRate ? agent.commissionRate.toString() : undefined,
      hireDate: agent.hireDate || undefined,
      notes: agent.notes || '',
      colorCode: agent.colorCode || '#3B82F6'
    });
    setEditingAgent(agent);
    setShowAgentDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (editingAgent) {
      updateAgentMutation.mutate({ ...formData, id: editingAgent.id } as any);
    } else {
      createAgentMutation.mutate(formData);
    }
  };

  const handleDeleteAgent = (agent: Agent) => {
    if (window.confirm(`Are you sure you want to delete ${agent.firstName} ${agent.lastName}?`)) {
      deleteAgentMutation.mutate(agent.id);
    }
  };



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

  const specialtyOptions = [
    'fencing', 'roofing', 'siding', 'gutters', 'windows', 'doors', 
    'flooring', 'painting', 'electrical', 'plumbing', 'hvac'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

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
                Agent Management
              </h1>
              <p className="remodra-subtitle">
                Manage your field agents, schedules, and assignments
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex justify-center gap-4 mb-8">
              <Button className="remodra-button" onClick={() => resetForm()}>
                <Plus className="h-5 w-5 mr-2" />
                Add New Agent
              </Button>
              <Link href="/calendar">
                <Button className="remodra-button-outline">
                  <Calendar className="h-5 w-5 mr-2" />
                  View Calendar
                </Button>
              </Link>
              <Link href="/">
                <Button className="remodra-button-outline">
                  <Home className="h-5 w-5 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-600">
          <DialogHeader>
            <DialogTitle className="text-slate-200 text-xl font-bold">
              {editingAgent ? 'Edit Agent' : 'Add New Agent'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-slate-300 font-medium mb-2">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="John"
                  className="remodra-input"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-slate-300 font-medium mb-2">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Doe"
                  className="remodra-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  placeholder="EMP001"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({...formData, role: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field_agent">Field Agent</SelectItem>
                    <SelectItem value="senior_agent">Senior Agent</SelectItem>
                    <SelectItem value="lead_estimator">Lead Estimator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                  placeholder="25.00"
                />
              </div>
              <div>
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.01"
                  value={formData.commissionRate || ''}
                  onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                  placeholder="5.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate || ''}
                onChange={(e) => setFormData({...formData, hireDate: e.target.value || undefined})}
              />
            </div>

            <div>
              <Label htmlFor="colorCode">Calendar Color</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                      formData.colorCode === color.value 
                        ? 'border-gray-900 ring-2 ring-gray-300' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({...formData, colorCode: color.value})}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300" 
                  style={{ backgroundColor: formData.colorCode }}
                />
                <span className="text-sm text-gray-600">
                  Selected: {colorOptions.find(c => c.value === formData.colorCode)?.name || 'Custom'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="isActive">Active Agent</Label>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes about the agent..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createAgentMutation.isPending || updateAgentMutation.isPending}
              >
                {editingAgent ? 'Update Agent' : 'Create Agent'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="remodra-card p-3 bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-amber-500/30 shadow-lg">
          <TabsTrigger 
            value="agents" 
            className="flex items-center px-6 py-3 text-slate-300 hover:text-amber-400 hover:bg-slate-700/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:font-bold data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-lg transition-all duration-300 border border-transparent data-[state=active]:border-amber-300"
          >
            <User className="h-5 w-5 mr-2" />
            <span className="font-semibold">Agents</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reassign" 
            className="flex items-center px-6 py-3 text-slate-300 hover:text-amber-400 hover:bg-slate-700/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:font-bold data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-lg transition-all duration-300 border border-transparent data-[state=active]:border-amber-300"
          >
            <Calendar className="h-5 w-5 mr-2" />
            <span className="font-semibold">Reassign Appointments</span>
          </TabsTrigger>
          <TabsTrigger 
            value="schedule" 
            className="flex items-center px-6 py-3 text-slate-300 hover:text-amber-400 hover:bg-slate-700/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-yellow-500 data-[state=active]:text-slate-900 data-[state=active]:font-bold data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-lg transition-all duration-300 border border-transparent data-[state=active]:border-amber-300"
          >
            <MapPin className="h-5 w-5 mr-2" />
            <span className="font-semibold">Daily Schedule</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          {/* Agents Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="remodra-card p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{agents.length}</div>
              <div className="text-sm text-slate-300">Total Agents</div>
            </div>
            <div className="remodra-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {agents.filter(a => a.isActive).length}
              </div>
              <div className="text-sm text-slate-300">Active Agents</div>
            </div>
            <div className="remodra-card p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {agents.filter(a => a.role === 'field_agent').length}
              </div>
              <div className="text-sm text-slate-300">Field Agents</div>
            </div>
            <div className="remodra-card p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {agents.filter(a => a.role === 'senior_agent').length}
              </div>
              <div className="text-sm text-slate-300">Senior Agents</div>
            </div>
          </div>

          <div className="grid gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="remodra-card p-6 hover:shadow-lg transition-all duration-300 border border-slate-600 hover:border-amber-500/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600">
                        <User className="h-8 w-8 text-amber-400" />
                      </div>
                      <div 
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-800 shadow-lg"
                        style={{ backgroundColor: agent.colorCode || '#3B82F6' }}
                        title="Calendar Color"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-200 mb-1">
                        {agent.firstName} {agent.lastName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        {agent.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{agent.phone}</span>
                          </div>
                        )}
                        {agent.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{agent.email}</span>
                          </div>
                        )}
                        {agent.employeeId && (
                          <Badge variant="outline" className="bg-slate-700 text-slate-300 border-slate-600">
                            ID: {agent.employeeId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={agent.isActive ? "default" : "secondary"}
                      className={agent.isActive ? "bg-slate-700 text-slate-200 border-slate-600" : "bg-red-600/20 text-red-400 border-red-500/30"}
                    >
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-700 text-slate-300 border-slate-600">
                      {agent.role.replace('_', ' ')}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAgent(agent)}
                      className="remodra-button-outline"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAgent(agent)}
                      className="bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Agent Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Role</div>
                    <div className="font-semibold text-slate-200">{agent.role.replace('_', ' ')}</div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Status</div>
                    <div className="font-semibold text-slate-200">{agent.isActive ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Hourly Rate</div>
                    <div className="font-semibold text-slate-200">{agent.hourlyRate ? `$${Number(agent.hourlyRate).toFixed(2)}/hr` : '-'}</div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Commission</div>
                    <div className="font-semibold text-slate-200">{agent.commissionRate ? `${Number(agent.commissionRate).toFixed(1)}%` : '-'}</div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Hire Date</div>
                    <div className="font-semibold text-slate-200">{agent.hireDate ? new Date(agent.hireDate).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Specialties</div>
                    <div className="font-semibold text-slate-200">
                      {Array.isArray(agent.specialties)
                        ? agent.specialties.join(', ')
                        : (typeof agent.specialties === 'string' && agent.specialties.trim().length > 0
                            ? (() => { try { return JSON.parse(agent.specialties).join(', '); } catch { return agent.specialties; } })()
                            : '-')}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Calendar Color</div>
                    <div className="flex items-center gap-2 font-semibold text-slate-200">
                      <span className="inline-block w-4 h-4 rounded-full border border-slate-600" style={{ backgroundColor: agent.colorCode || '#3B82F6' }}></span>
                      <span>{colorOptions.find(c => c.value === agent.colorCode)?.name || 'Custom'}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Created</div>
                    <div className="font-semibold text-slate-200">{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : '-'}</div>
                  </div>
                </div>
                
                {agent.notes && (
                  <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-600">
                    <div className="text-slate-400 text-sm font-medium mb-2">Notes</div>
                    <div className="text-slate-300 text-sm">{agent.notes}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {agents.length === 0 && (
            <div className="remodra-card p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center">
                  <User className="h-10 w-10 text-amber-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-3">No Agents Found</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Get started by adding your first field agent to handle estimates and appointments.
              </p>
              <Button className="remodra-button" onClick={() => resetForm()}>
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Agent
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reassign" className="space-y-6">
          <div className="remodra-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-amber-400 mb-2">Reassign Appointments</h3>
                <p className="text-slate-300">Change which agent is assigned to existing appointments</p>
              </div>
            </div>

            <div className="remodra-card p-6 border border-slate-600">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-200 mb-2">Reassign Appointment to Different Agent</h4>
                <p className="text-slate-400">Select an existing appointment and change its assigned agent</p>
              </div>
              
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <Label htmlFor="selectedDate" className="text-slate-300 font-medium mb-2">Select Date</Label>
                  <Input
                    id="selectedDate"
                    type="date"
                    value={assignmentData.selectedDate}
                    onChange={(e) => setAssignmentData({...assignmentData, selectedDate: e.target.value})}
                    className="remodra-input"
                  />
                </div>

                {/* Available Appointments Section */}
                <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                  <div className="text-sm font-semibold text-amber-400 mb-3">
                    Appointments for {assignmentData.selectedDate}
                  </div>
                  <div className="text-sm text-slate-300 space-y-2">
                    {appointments
                      .filter((appointment: any) => {
                        const appointmentDate = new Date(appointment.start_time);
                        const selectedDate = new Date(assignmentData.selectedDate);
                        return appointmentDate.toDateString() === selectedDate.toDateString();
                      })
                      .slice(0, 5)
                      .map((appointment: any) => (
                        <div key={appointment.id} className="p-2 bg-slate-800/50 rounded border border-slate-600">
                          {appointment.title} - {new Date(appointment.start_time).toLocaleTimeString()}
                        </div>
                      ))}
                    {appointments.filter((appointment: any) => {
                      const appointmentDate = new Date(appointment.start_time);
                      const selectedDate = new Date(assignmentData.selectedDate);
                      return appointmentDate.toDateString() === selectedDate.toDateString();
                    }).length === 0 && (
                      <div className="text-slate-400 italic">No appointments for this date</div>
                    )}
                  </div>
                </div>

                {/* Select Appointment */}
                <div>
                  <Label htmlFor="appointmentId" className="text-slate-300 font-medium mb-2">Select Appointment</Label>
                  <Select
                    value={assignmentData.appointmentId}
                    onValueChange={(value) => setAssignmentData({...assignmentData, appointmentId: value})}
                  >
                    <SelectTrigger className="remodra-input">
                      <SelectValue placeholder="Choose an appointment" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {appointments
                        .filter((appointment: any) => {
                          const appointmentDate = new Date(appointment.start_time);
                          const selectedDate = new Date(assignmentData.selectedDate);
                          return appointmentDate.toDateString() === selectedDate.toDateString();
                        })
                        .map((appointment: any) => (
                          <SelectItem key={appointment.id} value={appointment.id.toString()} className="text-slate-200 hover:bg-slate-700">
                            {appointment.title} - {new Date(appointment.start_time).toLocaleTimeString()}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Select New Agent */}
                <div>
                  <Label htmlFor="newAgentId" className="text-slate-300 font-medium mb-2">Assign to Agent</Label>
                  <Select
                    value={assignmentData.newAgentId}
                    onValueChange={(value) => setAssignmentData({...assignmentData, newAgentId: value})}
                  >
                    <SelectTrigger className="remodra-input">
                      <SelectValue placeholder="Choose a new agent" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {agents.map((agent: any) => (
                        <SelectItem key={agent.id} value={agent.id.toString()} className="text-slate-200 hover:bg-slate-700">
                          {agent.firstName} {agent.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleAssignSubmit}
                    disabled={assignEstimateMutation.isPending}
                    className="remodra-button"
                  >
                    {assignEstimateMutation.isPending ? 'Updating...' : 'Reassign Appointment'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="remodra-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-amber-400 mb-2">Daily Schedule</h3>
                <p className="text-slate-300">View and manage agent schedules for specific dates</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
              <Label htmlFor="scheduleDate" className="text-slate-300 font-medium">Select Date:</Label>
              <Input
                id="scheduleDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="remodra-input w-auto"
              />
            </div>
            
            <AgentScheduler selectedDate={selectedDate} />
          </div>
        </TabsContent>
      </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}