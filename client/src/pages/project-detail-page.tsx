import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CalendarIcon,
  DollarSign,
  Building,
  User,
  MapPin,
  Clock
} from "lucide-react";
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { Link } from 'wouter';
import ErrorBoundary from '../components/error-boundary';

// Helper function to format currency
const formatCurrency = (amount: number | string | null | undefined) => {
  if (!amount) return '$0.00';
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
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

// Helper function to get status badge styling
const getStatusBadge = (status: string) => {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;
  
  const statusConfig = {
    'project_initiated': { label: 'Project Initiated', className: 'bg-purple-500 hover:bg-purple-600' },
    'site_assessment': { label: 'Site Assessment', className: 'bg-indigo-500 hover:bg-indigo-600' },
    'permits_approvals': { label: 'Permits & Approvals', className: 'bg-orange-500 hover:bg-orange-600' },
    'materials_ordered': { label: 'Materials Ordered', className: 'bg-teal-500 hover:bg-teal-600' },
    'installation_begins': { label: 'Installation Begins', className: 'bg-blue-500 hover:bg-blue-600' },
    'quality_inspection': { label: 'Quality Inspection', className: 'bg-amber-500 hover:bg-amber-600' },
    'completed': { label: 'Completed', className: 'bg-green-500 hover:bg-green-600' },
    'pending': { label: 'Pending', className: 'bg-yellow-500 hover:bg-yellow-600' },
    'in_progress': { label: 'In Progress', className: 'bg-blue-500 hover:bg-blue-600' }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (config) {
    return <Badge className={config.className}>{config.label}</Badge>;
  }
  
  return <Badge variant="secondary">{status}</Badge>;
};

export default function ProjectDetailPage() {
  const [, params] = useRoute('/projects/:id');
  const projectId = params?.id;
  const { toast } = useToast();

  // Add error boundary for React errors
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('ProjectDetailPage Error:', error);
      toast({
        title: "Error",
        description: "An error occurred while loading the project.",
        variant: "destructive"
      });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [toast]);

  // Fetch project details
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['/api/protected/projects', projectId],
    queryFn: async () => {
      try {
        console.log('Fetching project details for ID:', projectId);
        const response = await apiRequest("GET", `/api/protected/projects/${projectId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Project data received:', data);
        return data;
      } catch (err) {
        console.error('Error fetching project:', err);
        throw err;
      }
    },
    enabled: !!projectId,
    retry: 1,
    retryDelay: 1000
  });

  if (isLoading) {
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
                    <div className="text-2xl mb-4">⏳</div>
                    <div className="text-lg font-semibold text-slate-200">Loading Project...</div>
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
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
                    <div className="text-xl font-semibold text-red-400">Project Not Found</div>
                    <div className="text-slate-400 mt-2">
                      The project you're looking for doesn't exist or you don't have permission to view it.
                    </div>
                    <Button className="mt-4" asChild>
                      <Link href="/projects">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Projects
                      </Link>
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
    <ErrorBoundary>
      <div className="remodra-layout">
        <Sidebar />
        <MobileSidebar />
        <div className="remodra-main">
          <TopNav />
          <div className="remodra-content">
            <main className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/projects">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Projects
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-200">
                    {project?.title || 'Untitled Project'}
                  </h1>
                  <p className="text-slate-400">
                    Project ID: {project?.id || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/projects/${project?.id || 'unknown'}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Delete Project",
                      description: "Delete functionality would be implemented here.",
                    });
                  }}
                  className="border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Project Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Project Details Card */}
                <Card className="bg-slate-800 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-amber-400">Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-200 mb-2">
                        {project?.title || 'Untitled Project'}
                      </h3>
                      {project?.description && (
                        <p className="text-slate-300">{project.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-500" />
                        <span className="text-slate-400">Service Type:</span>
                        <Badge variant="outline">
                          {project?.serviceType ? project.serviceType.charAt(0).toUpperCase() + project.serviceType.slice(1) : 'N/A'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="text-slate-400">Status:</span>
                        {getStatusBadge(project?.status || '')}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline Card */}
                <Card className="bg-slate-800 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-amber-400">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-slate-400">Start Date:</span>
                        <span className="text-slate-200">{formatDate(project?.startDate)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-green-500" />
                        <span className="text-slate-400">End Date:</span>
                        <span className="text-slate-200">{formatDate(project?.endDate)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Budget Card */}
                <Card className="bg-slate-800 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-amber-400">Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">
                        {formatCurrency(project?.budget)}
                      </div>
                      <p className="text-sm text-slate-400">Total Project Budget</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Info Card */}
                {project.client && (
                  <Card className="bg-slate-800 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-amber-400">Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <span className="text-slate-400">Name:</span>
                        <span className="text-slate-200">
                          {project.client.firstName || 'N/A'} {project.client.lastName || ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-200">{project.client.email || 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions Card */}
                <Card className="bg-slate-800 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-amber-400">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Create Estimate",
                          description: "Estimate creation will be implemented here.",
                        });
                      }}
                    >
                      Create Estimate
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Create Invoice",
                          description: "Invoice creation will be implemented here.",
                        });
                      }}
                    >
                      Create Invoice
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Update Status",
                          description: "Status update will be implemented here.",
                        });
                      }}
                    >
                      Update Status
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
} 