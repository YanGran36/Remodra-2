import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Eye, 
  Edit, 
  Trash2, 
  CalendarIcon,
  DollarSign,
  Building,
  Check,
  Clock,
  AlertCircle
} from "lucide-react";
import { apiRequest } from '../../lib/queryClient';
import { useToast } from '../../hooks/use-toast';
import { 
  getWorkflowForService, 
  getWorkflowStages, 
  workflowStagesToKanbanColumns,
  type WorkflowStage,
  type ServiceWorkflow 
} from '../../lib/project-workflows';

interface ProjectWithClient {
  id: number;
  title: string;
  description?: string;
  status: string;
  budget?: string | number;
  startDate?: string | Date;
  endDate?: string | Date;
  position?: number;
  createdAt: string;
  updatedAt: string;
  serviceType?: string;
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SimpleKanbanBoardProps {
  projects: ProjectWithClient[];
  onViewProject: (project: ProjectWithClient) => void;
  onEditProject: (project: ProjectWithClient) => void;
  onDeleteProject: (projectId: number) => void;
  selectedServiceType?: string;
}

interface Column {
  id: string;
  title: string;
  projects: ProjectWithClient[];
  color: string;
  bgColor: string;
  icon: string;
  description: string;
  estimatedDays?: number;
  checkpoints?: string[];
}

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

function ProjectCard({ 
  project, 
  onView, 
  onEdit, 
  onDelete,
  onMoveToStage
}: { 
  project: ProjectWithClient;
  onView: (project: ProjectWithClient) => void;
  onEdit: (project: ProjectWithClient) => void;
  onDelete: (projectId: number) => void;
  onMoveToStage: (projectId: number, newStatus: string) => void;
}) {
  const [isMoving, setIsMoving] = useState(false);

  const handleMoveToStage = async (newStatus: string) => {
    setIsMoving(true);
    try {
      await onMoveToStage(project.id, newStatus);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Card className="bg-slate-700 border-slate-600 hover:shadow-lg transition-all duration-300 mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-amber-400 hover:underline cursor-pointer" onClick={() => onView(project)}>
                {project.title || 'Untitled Project'}
              </h3>
              {project.client && (
                <p className="text-sm text-slate-400 mt-1">
                  {project.client.firstName} {project.client.lastName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => onView(project)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDelete(project.id)}
                className="border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-slate-300 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Budget</span>
              <span className="text-sm font-medium text-green-400">
                {formatCurrency(project.budget)}
              </span>
            </div>
            
            {project.startDate && (
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs text-blue-400">
                  {formatDate(project.startDate)}
                </span>
              </div>
            )}
          </div>

          {/* Service Type Badge */}
          {project.serviceType && (
            <Badge variant="outline" className="text-xs font-medium bg-slate-600 text-slate-300 hover:bg-slate-500">
              {project.serviceType.charAt(0).toUpperCase() + project.serviceType.slice(1)}
            </Badge>
          )}

          {/* Move to Next Stage Button */}
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => handleMoveToStage('next')}
              disabled={isMoving}
            >
              {isMoving ? 'Moving...' : 'Move to Next Stage'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SimpleKanbanBoard({ 
  projects, 
  onViewProject, 
  onEditProject, 
  onDeleteProject,
  selectedServiceType = "fence"
}: SimpleKanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get workflow stages for the selected service type
  useEffect(() => {
    try {
      const workflowStages = getWorkflowStages(selectedServiceType);
      const kanbanColumns = workflowStagesToKanbanColumns(workflowStages);
      
      // Map projects to their respective columns
      const columnsWithProjects = kanbanColumns.map(column => ({
        ...column,
        projects: projects
          .filter(project => project.status === column.id)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
      }));
      
      setColumns(columnsWithProjects);
    } catch (error) {
      console.error('Error setting up Kanban columns:', error);
      // Fallback to basic columns if workflow fails
      setColumns([
        {
          id: 'pending',
          title: 'Pending',
          projects: projects.filter(p => p.status === 'pending'),
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          icon: '⏳',
          description: 'Projects waiting to start'
        },
        {
          id: 'in_progress',
          title: 'In Progress',
          projects: projects.filter(p => p.status === 'in_progress'),
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          icon: '🔨',
          description: 'Projects currently being worked on'
        },
        {
          id: 'completed',
          title: 'Completed',
          projects: projects.filter(p => p.status === 'completed'),
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          icon: '✅',
          description: 'Finished projects'
        }
      ]);
    }
  }, [projects, selectedServiceType]);

  // Mutation to update a project's status
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/protected/projects/${id}`, {
        status
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      toast({
        title: "Project Updated",
        description: "Project status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update project status.",
        variant: "destructive",
      });
    },
  });

  const handleMoveToStage = async (projectId: number, newStatus: string) => {
    // Find the current project
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Find the current column index
    const currentColumnIndex = columns.findIndex(col => col.id === project.status);
    if (currentColumnIndex === -1) return;

    // Move to next column
    const nextColumnIndex = currentColumnIndex + 1;
    if (nextColumnIndex < columns.length) {
      const nextStatus = columns[nextColumnIndex].id;
      updateProjectStatusMutation.mutate({ id: projectId, status: nextStatus });
    }
  };

  // Get workflow info for the selected service type
  const workflow = getWorkflowForService(selectedServiceType);
  const totalStages = workflow?.stages.length || 0;
  const totalEstimatedDays = workflow?.totalEstimatedDays || 0;

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              {workflow?.serviceName || 'Project'} Workflow
            </h2>
            <p className="text-sm text-gray-600">
              {totalStages} stages • {totalEstimatedDays} estimated days
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-medium bg-white">
              {selectedServiceType}
            </Badge>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {columns.map((column) => (
          <Card key={column.id} className="bg-slate-800 border-slate-600">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{column.icon}</span>
                <div>
                  <CardTitle className="text-sm font-medium text-slate-200">
                    {column.title}
                  </CardTitle>
                  <p className="text-xs text-slate-400">
                    {column.projects.length} project{column.projects.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {column.estimatedDays && (
                <p className="text-xs text-slate-400">
                  ~{column.estimatedDays} days
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {column.projects.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-2xl mb-2">📭</div>
                    <p className="text-xs text-slate-400">No projects</p>
                  </div>
                ) : (
                  column.projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onView={onViewProject}
                      onEdit={onEditProject}
                      onDelete={onDeleteProject}
                      onMoveToStage={handleMoveToStage}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 