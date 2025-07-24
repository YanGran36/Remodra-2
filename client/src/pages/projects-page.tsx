import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Edit, Trash2, Hammer, Download, Settings, User, Calendar, Target } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import ProjectForm from "../components/projects/project-form";
import { useClients } from "../hooks/use-clients";
import TopNav from '../components/layout/top-nav';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';

interface Project {
  id: number;
  title: string;
  description?: string;
  status: string;
  budget?: string | number;
  startDate?: string | Date;
  endDate?: string | Date;
  serviceType?: string;
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  progress?: number;
  tasks?: any[];
}

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { clients } = useClients();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/protected/projects");
        return response.json() as Promise<Project[]>;
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [] as Project[];
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return apiRequest("DELETE", `/api/protected/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/protected/projects", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Project created",
        description: "The project has been successfully created.",
      });
      setIsProjectFormOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = (data: any) => {
    if (!selectedClientId) {
      toast({
        title: "Error",
        description: "Please select a client first.",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(data);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project: Project) => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const tabFilteredProjects = useMemo(() => {
    switch (activeTab) {
      case "active":
        return filteredProjects.filter((project: Project) => project.status === "active");
      case "completed":
        return filteredProjects.filter((project: Project) => project.status === "completed");
      case "pending":
        return filteredProjects.filter((project: Project) => project.status === "pending");
      default:
        return filteredProjects;
    }
  }, [filteredProjects, activeTab]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p: Project) => p.status === "active").length;
    const completed = projects.filter((p: Project) => p.status === "completed").length;
    const totalBudget = projects.reduce((sum: number, p: Project) => {
      const budget = typeof p.budget === 'string' ? parseFloat(p.budget) : (p.budget || 0);
      return sum + budget;
    }, 0);

    return { total, active, completed, totalBudget };
  }, [projects]);

  const handleViewProject = (project: Project) => {
    window.location.href = `/projects/${project.id}`;
  };

  const handleEditProject = (project: Project) => {
    window.location.href = `/projects/${project.id}/edit`;
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6" style={{ color: 'black' }}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6" style={{ color: 'black' }}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'black' }}>Error Loading Projects</h2>
          <p className="mb-4" style={{ color: 'black' }}>
            {error instanceof Error ? error.message : "Failed to load projects"}
          </p>
          <p className="text-sm mb-4" style={{ color: 'black' }}>
            This might be because you need to log in first, or there's a connection issue.
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = '/login'} 
              variant="default"
              className="text-white"
            >
              Go to Login
            </Button>
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
        <main className="p-8 space-y-8">
          {/* Header with Remodra branding */}
          <div className="text-center mb-8">
            <div className="remodra-logo mb-6">
              <span className="remodra-logo-text">R</span>
            </div>
            <h1 className="remodra-title mb-3">
              Projects
            </h1>
            <p className="remodra-subtitle">
              Manage your construction projects with precision
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button className="remodra-button" onClick={() => setIsProjectFormOpen(true)}>
              <Hammer className="h-5 w-5 mr-2" />
              New Project
            </Button>
            <Button className="remodra-button-outline" onClick={() => {
              // Export functionality
              const csvContent = "data:text/csv;charset=utf-8," + 
                "Title,Status,Budget,Client,Start Date,End Date\n" +
                projects.map(p => 
                  `"${p.title}","${p.status}","${p.budget || 0}","${p.client?.firstName || ''} ${p.client?.lastName || ''}","${p.startDate || ''}","${p.endDate || ''}"`
                ).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "projects.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>
              <Download className="h-5 w-5 mr-2" />
              Export Projects
            </Button>
            <Button className="remodra-button-outline" onClick={() => window.location.href = '/settings'}>
              <Settings className="h-5 w-5 mr-2" />
              Project Settings
            </Button>
          </div>

          {/* Stats Cards with Luxury Design */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{projects.length}</div>
              <div className="remodra-stats-label">Total Projects</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{projects.filter(p => p.status === 'active').length}</div>
              <div className="remodra-stats-label">Active Projects</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{projects.filter(p => p.status === 'completed').length}</div>
              <div className="remodra-stats-label">Completed</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">${projects.reduce((sum, p) => sum + (typeof p.budget === 'number' ? p.budget : 0), 0).toLocaleString()}</div>
              <div className="remodra-stats-label">Total Budget</div>
              <div className="remodra-stats-accent"></div>
            </div>
          </div>

          {/* Filters */}
          <div className="remodra-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
                <SelectTrigger className="remodra-input w-full lg:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-slate-200 hover:bg-slate-700">All Projects</SelectItem>
                  <SelectItem value="active" className="text-slate-200 hover:bg-slate-700">Active</SelectItem>
                  <SelectItem value="completed" className="text-slate-200 hover:bg-slate-700">Completed</SelectItem>
                  <SelectItem value="on_hold" className="text-slate-200 hover:bg-slate-700">On Hold</SelectItem>
                  <SelectItem value="cancelled" className="text-slate-200 hover:bg-slate-700">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Projects List */}
          <div className="remodra-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-400">Project Directory</h2>
              <Badge className="remodra-badge">
                {filteredProjects.length} Projects
              </Badge>
            </div>

            {isLoading ? (
              <div className="remodra-loading">
                <div className="remodra-spinner"></div>
                <p className="text-slate-300">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="remodra-empty">
                <div className="remodra-empty-icon">🏗️</div>
                <div className="remodra-empty-title">No Projects Found</div>
                <div className="remodra-empty-description">
                  {searchTerm ? `No projects match "${searchTerm}"` : "Start by creating your first project"}
                </div>
                <Button className="remodra-button mt-4" onClick={() => setIsProjectFormOpen(true)}>
                  <Hammer className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="p-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600 hover:border-amber-500/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center">
                          <Hammer className="h-6 w-6 text-slate-900" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-200 text-lg">
                            {project.title}
                          </h3>
                          <p className="text-slate-400 text-sm">{project.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${
                          project.status === 'completed' ? 'remodra-badge' :
                          project.status === 'cancelled' ? 'border-red-600/50 text-red-400' :
                          'remodra-badge-outline'
                        }`}>
                          {project.status}
                        </Badge>
                        <span className="text-amber-400 font-bold text-lg">
                          ${project.budget?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <User className="h-4 w-4 text-amber-400" />
                        <span className="text-sm">
                          {project.client?.firstName} {project.client?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="h-4 w-4 text-amber-400" />
                        <span className="text-sm">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Target className="h-4 w-4 text-amber-400" />
                        <span className="text-sm">
                          {project.progress || 0}% Complete
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>Progress</span>
                        <span>{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                      <div className="text-sm text-slate-400">
                        <span className="text-amber-400 font-semibold">{project.tasks?.length || 0}</span> tasks
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(project)}
                          className="remodra-button-outline"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProject(project)}
                          className="remodra-button-outline"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
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

      {/* Project Form Dialog */}
      <Dialog open={isProjectFormOpen} onOpenChange={setIsProjectFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Client</label>
            <Select onValueChange={(value) => setSelectedClientId(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.firstName} {client.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedClientId && (
            <ProjectForm
              clientId={selectedClientId}
              onSubmit={handleCreateProject}
              isSubmitting={createProjectMutation.isPending}
              onCancel={() => setIsProjectFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}