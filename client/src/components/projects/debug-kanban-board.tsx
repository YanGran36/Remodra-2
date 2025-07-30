import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

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

interface DebugKanbanBoardProps {
  projects: ProjectWithClient[];
  onViewProject: (project: ProjectWithClient) => void;
  onEditProject: (project: ProjectWithClient) => void;
  onDeleteProject: (projectId: number) => void;
  selectedServiceType?: string;
}

export default function DebugKanbanBoard({ 
  projects, 
  onViewProject, 
  onEditProject, 
  onDeleteProject,
  selectedServiceType = "fence"
}: DebugKanbanBoardProps) {
  
  console.log('DebugKanbanBoard - Received props:', {
    projectsCount: projects.length,
    projects: projects,
    selectedServiceType
  });

  // Group projects by status
  const projectsByStatus = projects.reduce((acc, project) => {
    const status = project.status || 'pending';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(project);
    return acc;
  }, {} as Record<string, ProjectWithClient[]>);

  console.log('DebugKanbanBoard - Projects by status:', projectsByStatus);

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
      {/* Debug Info */}
      <Card className="bg-red-900 border-red-600">
        <CardHeader>
          <CardTitle className="text-red-200">DEBUG INFO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-red-200">Total Projects: {projects.length}</p>
            <p className="text-red-200">Selected Service Type: {selectedServiceType}</p>
            <p className="text-red-200">Unique Statuses: {allStatuses.join(', ')}</p>
            <p className="text-red-200">Projects by Status:</p>
            <pre className="text-red-200 text-xs bg-red-800 p-2 rounded">
              {JSON.stringify(projectsByStatus, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {sortedColumns.map((column) => (
          <Card key={column.id} className="bg-slate-800 border-slate-600">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-200">
                <span className="text-lg mr-2">{column.icon}</span>
                {column.title} ({column.projects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {column.projects.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400">No projects</p>
                  </div>
                ) : (
                  column.projects.map((project) => (
                    <Card key={project.id} className="bg-slate-700 border-slate-600">
                      <CardContent className="p-3">
                        <h3 className="font-medium text-amber-400 text-sm">
                          {project.title || 'Untitled Project'}
                        </h3>
                        {project.client && (
                          <p className="text-xs text-slate-400">
                            {project.client.firstName} {project.client.lastName}
                          </p>
                        )}
                        <p className="text-xs text-green-400 mt-1">
                          Budget: ${project.budget || '0'}
                        </p>
                        <p className="text-xs text-blue-400 mt-1">
                          Service: {project.serviceType || 'N/A'}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Button variant="outline" size="sm" onClick={() => onViewProject(project)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onDeleteProject(project.id)}>
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Raw Data Display */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="text-amber-400">Raw Project Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-slate-300 bg-slate-900 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(projects, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
} 