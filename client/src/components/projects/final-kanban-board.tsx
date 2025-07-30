import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Eye, 
  Edit, 
  Trash2, 
  CalendarIcon,
  DollarSign,
  Building
} from "lucide-react";

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

interface FinalKanbanBoardProps {
  projects: ProjectWithClient[];
  onViewProject: (project: ProjectWithClient) => void;
  onEditProject: (project: ProjectWithClient) => void;
  onDeleteProject: (projectId: number) => void;
  selectedServiceType?: string;
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

function ProjectCard({ 
  project, 
  onView, 
  onEdit, 
  onDelete
}: { 
  project: ProjectWithClient;
  onView: (project: ProjectWithClient) => void;
  onEdit: (project: ProjectWithClient) => void;
  onDelete: (projectId: number) => void;
}) {
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
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinalKanbanBoard({ 
  projects, 
  onViewProject, 
  onEditProject, 
  onDeleteProject,
  selectedServiceType = "fence"
}: FinalKanbanBoardProps) {
  
  // Group projects by status
  const projectsByStatus = projects.reduce((acc, project) => {
    const status = project.status || 'pending';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(project);
    return acc;
  }, {} as Record<string, ProjectWithClient[]>);

  // Get all unique statuses from the projects
  const allStatuses = Array.from(new Set(projects.map(p => p.status).filter(Boolean)));
  
  // Create dynamic columns based on actual project statuses
  const dynamicColumns = allStatuses.map(status => {
    const statusConfig = {
      'project_initiated': { title: 'Project Initiated', icon: '🚀', color: 'text-purple-600' },
      'site_assessment': { title: 'Site Assessment', icon: '📏', color: 'text-indigo-600' },
      'permits_approvals': { title: 'Permits & Approvals', icon: '📜', color: 'text-orange-600' },
      'materials_ordered': { title: 'Materials Ordered', icon: '📦', color: 'text-teal-600' },
      'installation_begins': { title: 'Installation Begins', icon: '🔨', color: 'text-blue-600' },
      'quality_inspection': { title: 'Quality Inspection', icon: '🔍', color: 'text-amber-600' },
      'completed': { title: 'Completed', icon: '✅', color: 'text-green-600' },
      'pending': { title: 'Pending', icon: '⏳', color: 'text-yellow-600' },
      'in_progress': { title: 'In Progress', icon: '🔨', color: 'text-blue-600' }
    };

    return {
      id: status,
      title: statusConfig[status as keyof typeof statusConfig]?.title || status,
      icon: statusConfig[status as keyof typeof statusConfig]?.icon || '📋',
      color: statusConfig[status as keyof typeof statusConfig]?.color || 'text-gray-600',
      projects: projectsByStatus[status] || []
    };
  });

  // Sort columns in workflow order
  const workflowOrder = [
    'project_initiated',
    'site_assessment', 
    'permits_approvals',
    'materials_ordered',
    'installation_begins',
    'quality_inspection',
    'completed',
    'pending',
    'in_progress'
  ];

  const sortedColumns = dynamicColumns.sort((a, b) => {
    const aIndex = workflowOrder.indexOf(a.id);
    const bIndex = workflowOrder.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Project Workflow Board
            </h2>
            <p className="text-sm text-gray-600">
              {projects.length} total projects • {allStatuses.length} workflow stages
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
        {sortedColumns.map((column) => (
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