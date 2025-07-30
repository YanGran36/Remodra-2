import React, { useState } from 'react';
import { Link } from 'wouter';
import { useProjects } from '../hooks/use-projects';
import { useToast } from '../hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// UI Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

// Icons
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw,
  Building,
  Check,
  Clock,
  DollarSign,
  List,
  Grid
} from 'lucide-react';

// Layout Components
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

// Kanban Components
import DraggableKanbanBoard from '../components/projects/draggable-kanban-board';

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(typeof amount === 'string' ? parseFloat(amount) : amount);
  } catch {
    return '$0.00';
  }
};

// Helper function to format date
const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

// Helper function to get status badge styling
const getStatusBadge = (status: string) => {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;
  
  switch (status.toLowerCase()) {
    case 'completed':
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
    case 'on_hold':
      return <Badge className="bg-orange-500 hover:bg-orange-600">On Hold</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-700 hover:bg-red-800">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'kanban'>('table');
  
  const { toast } = useToast();
  const { 
    projects = [], 
    isLoadingProjects, 
    projectsError
  } = useProjects();

  // Debug: Log projects data to see if client information is included
  console.log('Projects data:', projects);

  // Fetch contractor's custom services for filtering
  const { data: contractorServices = [] } = useQuery<any[]>({
    queryKey: ['/api/direct/services'],
  });

  // Get unique service types for filter from contractor services
  const serviceTypes = Array.from(new Set(contractorServices?.map((s: any) => s.serviceType).filter(Boolean) || []));

  // Filter projects based on search, status, and service type
  const filteredProjects = projects?.filter((project: any) => {
    const matchesSearch = 
      (project.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client?.lastName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || (project.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesServiceType = serviceTypeFilter === 'all' || (project.serviceType || '').toLowerCase() === serviceTypeFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesServiceType;
  }) || [];

  // Safe mapping function to prevent errors
  const safeMapProjects = (projects: any[]) => {
    try {
      return projects.map((project: any) => ({
        id: project.id || 0,
        title: project.title || 'Untitled Project',
        description: project.description || '',
        status: project.status || 'pending',
        budget: project.budget || 0,
        startDate: project.startDate || null,
        endDate: project.endDate || null,
        position: 0,
        createdAt: typeof project.createdAt === 'string' ? project.createdAt : new Date().toISOString(),
        updatedAt: typeof project.updatedAt === 'string' ? project.updatedAt : new Date().toISOString(),
        serviceType: project.serviceType || 'fence',
        client: project.client ? {
          id: project.client.id || 0,
          firstName: project.client.firstName || '',
          lastName: project.client.lastName || '',
          email: project.client.email || ''
        } : undefined
      }));
    } catch (error) {
      console.error('Error mapping projects:', error);
      return [];
    }
  };

  // Calculate summary stats
  const totalProjects = filteredProjects.length;
  const completedProjects = filteredProjects.filter((p: any) => (p.status || '').toLowerCase() === 'completed').length;
  const inProgressProjects = filteredProjects.filter((p: any) => (p.status || '').toLowerCase() === 'in_progress').length;
  const totalBudget = filteredProjects.reduce((sum: number, project: any) => sum + (parseFloat(project.budget) || 0), 0);

  // Handle refresh
  const handleRefresh = () => {
    toast({
      title: 'Data refreshed',
      description: 'Project data has been refreshed.',
    });
  };

  // Handle delete click
  const handleDeleteClick = (project: any) => {
    toast({
      title: 'Delete Project',
      description: `Delete functionality for ${project.title} would be implemented here.`,
    });
  };

  if (projectsError) {
    return (
      <div className="remodra-layout">
        <Sidebar />
        <MobileSidebar />
        <div className="remodra-main">
          <TopNav />
          <div className="remodra-content">
            <main className="p-8">
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⚠️</div>
                    <div className="text-xl font-semibold text-red-400">Error Loading Projects</div>
                    <div className="text-slate-400 mt-2">
                      There was an error loading the projects. Please try refreshing the page.
                    </div>
                    <Button className="mt-4" onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
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
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-amber-400 mb-2">Projects</h1>
              <p className="text-slate-400">Manage your construction projects</p>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center gap-4 mb-8">
              <Button asChild>
                <Link href="/projects/create">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Project
                </Link>
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Total Projects</p>
                      <p className="text-2xl font-bold text-amber-400">{totalProjects}</p>
                    </div>
                    <Building className="h-8 w-8 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Completed</p>
                      <p className="text-2xl font-bold text-green-400">{completedProjects}</p>
                    </div>
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">In Progress</p>
                      <p className="text-2xl font-bold text-blue-400">{inProgressProjects}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Total Budget</p>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(totalBudget)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="bg-slate-800 border-slate-600">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Filter by service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {serviceTypes.length === 0 ? (
                        <SelectItem value="no-services" disabled>No services available</SelectItem>
                      ) : (
                        serviceTypes.map((serviceType) => (
                          <SelectItem key={serviceType} value={serviceType}>
                            {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  <Select value={viewMode} onValueChange={(value: 'table' | 'cards' | 'kanban') => setViewMode(value)}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="View mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">
                        <div className="flex items-center">
                          <List className="h-4 w-4 mr-2" />
                          Table View
                        </div>
                      </SelectItem>
                      <SelectItem value="cards">
                        <div className="flex items-center">
                          <Grid className="h-4 w-4 mr-2" />
                          Card View
                        </div>
                      </SelectItem>
                      <SelectItem value="kanban">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Kanban Board
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Projects Display */}
            {isLoadingProjects ? (
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto"></div>
                    <p className="mt-2 text-slate-400">Loading projects...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredProjects.length === 0 ? (
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🏗️</div>
                    <div className="text-xl font-semibold text-slate-200">No Projects Found</div>
                    <div className="text-slate-400 mt-2">
                      {searchQuery || statusFilter !== 'all'
                        ? 'No projects match your filters' 
                        : 'Start by creating your first project'}
                    </div>
                    <Button className="mt-4" asChild>
                      <Link href="/projects/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Project
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : viewMode === 'table' ? (
              <Card className="bg-slate-800 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-amber-400">Project Directory</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project: any) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            <Link href={`/projects/${project.id}`} className="text-amber-400 hover:underline">
                              {project.title || 'Untitled Project'}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {project.client ? `${project.client.firstName || ''} ${project.client.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {project.serviceType ? project.serviceType.charAt(0).toUpperCase() + project.serviceType.slice(1) : 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(project.status)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(project.budget)}</TableCell>
                          <TableCell>{formatDate(project.startDate)}</TableCell>
                          <TableCell>{formatDate(project.endDate)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/projects/${project.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/projects/${project.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteClick(project)}
                                className="border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : viewMode === 'kanban' ? (
              <DraggableKanbanBoard
                projects={safeMapProjects(filteredProjects)}
                onViewProject={(project) => window.location.href = `/projects/${project.id}`}
                onEditProject={(project) => window.location.href = `/projects/${project.id}/edit`}
                onDeleteProject={(projectId) => handleDeleteClick({ id: projectId, title: 'Project' })}
                selectedServiceType={serviceTypeFilter !== 'all' ? serviceTypeFilter : 'fence'}
              />
            ) : (
              <Card className="bg-slate-800 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-amber-400">Project Cards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project: any) => (
                      <Card key={project.id} className="bg-slate-700 border-slate-600 hover:shadow-lg transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                <Link href={`/projects/${project.id}`} className="text-amber-400 hover:underline">
                                  {project.title || 'Untitled Project'}
                                </Link>
                              </CardTitle>
                              <p className="text-sm text-slate-400">
                                {project.client ? `${project.client.firstName || ''} ${project.client.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                              </p>
                            </div>
                            {getStatusBadge(project.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-400">Service Type</span>
                              <Badge variant="outline">
                                {project.serviceType ? project.serviceType.charAt(0).toUpperCase() + project.serviceType.slice(1) : 'N/A'}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm text-slate-400">Budget</p>
                              <p className="text-xl font-bold text-green-400">{formatCurrency(project.budget)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-slate-400">Start</p>
                                <p className="font-medium">{formatDate(project.startDate)}</p>
                              </div>
                              <div>
                                <p className="text-slate-400">End</p>
                                <p className="font-medium">{formatDate(project.endDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link href={`/projects/${project.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteClick(project)}
                                className="border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
} 