import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Eye, Edit, Trash2, GripVertical } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ProjectWithClient {
  id: number;
  title: string;
  description?: string;
  status: string;
  budget?: number | string;
  startDate?: string | Date;
  endDate?: string | Date;
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  contractorId: number;
  serviceType?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const formatCurrency = (amount: number | string | null | undefined) => {
  if (!amount) return '$0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return 'N/A';
  
  try {
    let date: Date;
    
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'N/A';
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

function getStatusBadge(status: string) {
  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    in_progress: { label: 'In Progress', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    completed: { label: 'Completed', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    project_initiated: { label: 'Initiated', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    site_assessment: { label: 'Site Assessment', className: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    permits_approvals: { label: 'Permits & Approvals', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    materials_ordered: { label: 'Materials Ordered', className: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
    installation_begins: { label: 'Installation Begins', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    quality_inspection: { label: 'Quality Inspection', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge className={`bg-transparent border text-xs px-2 py-1 ${config.className}`}>
      {config.label}
    </Badge>
  );
}

function ProjectCard({
  project,
  onView,
  onEdit,
  onDelete,
  isDragging = false,
  isUpdating = false,
  onDragStart,
  onDragEnd
}: {
  project: ProjectWithClient;
  onView: (project: ProjectWithClient) => void;
  onEdit: (project: ProjectWithClient) => void;
  onDelete: (projectId: number) => void;
  isDragging?: boolean;
  isUpdating?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}) {
  // Safety check for project data
  if (!project || !project.id) {
    console.error('Invalid project data:', project);
    return null;
  }

  return (
    <div
      draggable={!isUpdating}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-lg p-3 lg:p-4 cursor-move transition-all duration-300 ${
        isDragging ? 'opacity-75 scale-105 shadow-2xl border-2 border-amber-500 rotate-1 z-50' : ''
      } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {isUpdating && (
        <div className="absolute inset-0 bg-amber-500/10 rounded-lg flex items-center justify-center z-10">
          <div className="text-amber-400 font-medium text-xs lg:text-sm">Updating...</div>
        </div>
      )}
      
      {/* Project Header */}
      <div className="flex items-start justify-between mb-2 lg:mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 lg:mb-2">
            <h4 className="font-semibold text-slate-200 truncate text-sm lg:text-base">{project.title || 'Untitled Project'}</h4>
            {project.serviceType && (
              <Badge className="bg-transparent border border-slate-600 text-slate-300 text-xs">
                {project.serviceType}
              </Badge>
            )}
          </div>
        </div>

        <div
          className={`p-1 lg:p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-all duration-200 ${
            isUpdating ? 'cursor-not-allowed' : 'cursor-move'
          }`}
          title={isUpdating ? 'Updating...' : 'Drag to move project'}
        >
          <GripVertical className="h-3 w-3 lg:h-4 lg:w-4" />
        </div>
      </div>

      {/* Project Description */}
      {project.description && (
        <p className="text-xs lg:text-sm text-slate-400 mb-2 lg:mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Project Details */}
      <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-slate-400 mb-3 lg:mb-4">
        {project.budget && (
          <span className="flex items-center gap-1">
            <span className="text-amber-400">💰</span>
            {formatCurrency(project.budget)}
          </span>
        )}
        {project.startDate && (
          <span className="flex items-center gap-1">
            <span className="text-blue-400">📅</span>
            {formatDate(project.startDate)}
          </span>
        )}
        {project.client && (
          <span className="flex items-center gap-1">
            <span className="text-green-400">👤</span>
            {project.client.firstName || ''} {project.client.lastName || ''}
          </span>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-3 lg:mb-4">
        {getStatusBadge(project.status || 'pending')}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 lg:gap-2 pt-2 lg:pt-3 border-t border-slate-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(project)}
          disabled={isUpdating}
          className="flex-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 h-8 lg:h-9 text-xs"
        >
          <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(project)}
          disabled={isUpdating}
          className="flex-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 h-8 lg:h-9 text-xs"
        >
          <Edit className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(project.id)}
          disabled={isUpdating}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 lg:h-9 w-8 lg:w-9 p-0"
        >
          <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
        </Button>
      </div>
    </div>
  );
}

function KanbanColumn({
  title,
  icon,
  color,
  projects,
  onView,
  onEdit,
  onDelete,
  statusId,
  onDrop,
  draggedProjectId,
  onDragStart,
  onDragEnd,
  updatingProjectId
}: {
  title: string;
  icon: string;
  color: string;
  projects: ProjectWithClient[];
  onView: (project: ProjectWithClient) => void;
  onEdit: (project: ProjectWithClient) => void;
  onDelete: (projectId: number) => void;
  statusId: string;
  onDrop: (projectId: number, newStatus: string) => void;
  draggedProjectId: number | null;
  onDragStart: (e: React.DragEvent, projectId: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  updatingProjectId: number | null;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedProjectId) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the column entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const projectId = e.dataTransfer.getData('text/plain');
    if (projectId && draggedProjectId) {
      console.log('🎯 Dropping project:', projectId, 'to status:', statusId);
      onDrop(parseInt(projectId), statusId);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedProjectId) {
      setIsDragOver(true);
    }
  };

  return (
    <div
      className={`bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg min-h-[300px] lg:min-h-[400px] p-4 lg:p-6 transition-all duration-300 ${
        isDragOver
          ? 'bg-gradient-to-b from-amber-500/30 to-amber-600/30 scale-105 border-2 border-amber-500 shadow-xl ring-4 ring-amber-500/20'
          : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 lg:mb-6 border-b border-slate-600 pb-3 lg:pb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg lg:text-2xl">{icon}</span>
          <h3 className="font-semibold text-slate-200 text-sm lg:text-base">{title}</h3>
        </div>
        <Badge className="bg-slate-700 text-slate-200 text-xs">{projects.length}</Badge>
      </div>

      {/* Projects Container */}
      <div className="space-y-3 lg:space-y-4 min-h-[200px] lg:min-h-[300px]">
        {projects.length === 0 ? (
          <div className={`bg-gradient-to-b from-amber-500/20 to-amber-600/20 border-2 border-dashed border-amber-500/50 rounded-lg p-3 lg:p-4 text-center transition-all duration-300 ${
            isDragOver
              ? 'bg-gradient-to-b from-amber-500/30 to-amber-600/30 scale-105 shadow-xl ring-4 ring-amber-500/20'
              : ''
          }`}>
            <div className="text-lg lg:text-2xl mb-2">📋</div>
            <div className="font-medium text-slate-200 text-sm lg:text-base">
              {isDragOver ? 'Drop here!' : 'No projects'}
            </div>
            <div className="text-xs lg:text-sm text-slate-400">
              {isDragOver ? 'Release to move project' : 'Drag projects here'}
            </div>
            {isDragOver && (
              <div className="text-amber-400 font-medium mt-2 animate-pulse text-xs lg:text-sm">
                ✨ Drop to move project
              </div>
            )}
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              isDragging={draggedProjectId === project.id}
              isUpdating={updatingProjectId === project.id}
              onDragStart={(e) => onDragStart(e, project.id)}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function DraggableKanbanBoard({ 
  projects, 
  onViewProject, 
  onEditProject, 
  onDeleteProject 
}: {
  projects: ProjectWithClient[];
  onViewProject: (project: ProjectWithClient) => void;
  onEditProject: (project: ProjectWithClient) => void;
  onDeleteProject: (projectId: number) => void;
}) {
  const queryClient = useQueryClient();
  const [draggedProjectId, setDraggedProjectId] = useState<number | null>(null);
  const [updatingProjectId, setUpdatingProjectId] = useState<number | null>(null);
  const [localProjects, setLocalProjects] = useState<ProjectWithClient[]>(projects);
  
  // Update local projects when props change
  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);
  
  // Debug logging for projects data
  console.log('🎯 DraggableKanbanBoard received projects:', projects);
  console.log('🎯 Local projects state:', localProjects);
  
  // Filter out invalid projects
  const validProjects = localProjects.filter(project => {
    if (!project || !project.id) {
      console.error('❌ Invalid project found:', project);
      return false;
    }
    return true;
  });
  
  console.log('✅ Valid projects:', validProjects.length, 'out of', localProjects.length);
  
  const updateProjectStatus = useMutation({
    mutationFn: async ({ projectId, newStatus }: { projectId: number; newStatus: string }) => {
      setUpdatingProjectId(projectId);
      const response = await fetch(`/api/protected/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update project status');
      return response.json();
    },
    onMutate: async ({ projectId, newStatus }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projects']);

      // Optimistically update to the new value
      queryClient.setQueryData(['projects'], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((project: any) => 
          project.id === projectId 
            ? { ...project, status: newStatus }
            : project
        );
      });

      // Also update local state immediately
      setLocalProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, status: newStatus }
            : project
        )
      );

      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onError: (err, variables, context) => {
      setUpdatingProjectId(null);
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
        setLocalProjects(context.previousProjects as ProjectWithClient[]);
      }
      toast.error('Failed to update project status');
    },
    onSettled: () => {
      setUpdatingProjectId(null);
    },
    onSuccess: () => {
      toast.success('Project status updated successfully');
    }
  });

  const handleDragStart = (e: React.DragEvent, projectId: number) => {
    console.log('🎯 Drag started for project:', projectId);
    setDraggedProjectId(projectId);
    e.dataTransfer.setData('text/plain', projectId.toString());
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('🎯 Drag ended');
    setDraggedProjectId(null);
  };

  const handleDrop = (projectId: number, newStatus: string) => {
    console.log('🚀 Updating project status:', { projectId, newStatus });

    // Validate status
    const validStatuses = [
      'project_initiated', 'site_assessment', 'permits_approvals',
      'materials_ordered', 'installation_begins', 'quality_inspection',
      'completed', 'pending', 'in_progress'
    ];
    if (!validStatuses.includes(newStatus)) {
      console.error('Invalid status received:', newStatus);
      toast.error('Invalid project status. Please try again.');
      return;
    }

    // Prevent rapid-fire updates
    if (updatingProjectId === projectId) {
      console.log('🚫 Project already being updated:', projectId);
      return;
    }

    // Add a small delay to prevent rapid-fire updates
    setTimeout(() => {
      updateProjectStatus.mutate({ projectId, newStatus });
    }, 50);
  };

  // Get all unique statuses from the projects
  const allStatuses = Array.from(new Set(validProjects.map(p => p.status).filter(Boolean)));

  // Define all possible workflow stages
  const allWorkflowStages = [
    { id: 'project_initiated', title: 'Project Initiated', icon: '🚀', color: 'text-purple-600' },
    { id: 'site_assessment', title: 'Site Assessment', icon: '📏', color: 'text-indigo-600' },
    { id: 'permits_approvals', title: 'Permits & Approvals', icon: '📜', color: 'text-orange-600' },
    { id: 'materials_ordered', title: 'Materials Ordered', icon: '📦', color: 'text-teal-600' },
    { id: 'installation_begins', title: 'Installation Begins', icon: '🔨', color: 'text-blue-600' },
    { id: 'quality_inspection', title: 'Quality Inspection', icon: '🔍', color: 'text-amber-600' },
    { id: 'completed', title: 'Completed', icon: '✅', color: 'text-green-600' },
    { id: 'pending', title: 'Pending', icon: '⏳', color: 'text-yellow-600' },
    { id: 'in_progress', title: 'In Progress', icon: '🔨', color: 'text-blue-600' }
  ];

  // Create columns for ALL workflow stages, not just those with projects
  const allColumns = allWorkflowStages.map(stage => ({
    id: stage.id,
    title: stage.title,
    icon: stage.icon,
    color: stage.color,
    projects: validProjects.filter(p => p.status === stage.id)
  }));

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

  const sortedColumns = allColumns.sort((a, b) => {
    const aIndex = workflowOrder.indexOf(a.id);
    const bIndex = workflowOrder.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  console.log('Kanban columns debug:', {
    allStatuses,
    allColumns: allColumns.map(col => ({ id: col.id, title: col.title, projectCount: col.projects.length })),
    sortedColumns: sortedColumns.map(col => ({ id: col.id, title: col.title, projectCount: col.projects.length }))
  });

  // If no valid projects, show a message
  if (validProjects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="remodra-card p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-amber-400 mb-2">No Projects Found</h2>
            <p className="text-slate-400">There are no valid projects to display.</p>
            {projects.length > 0 && (
              <p className="text-sm text-slate-500 mt-2">
                {projects.length - validProjects.length} projects were filtered out due to invalid data.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show loading indicator if any project is being updated
  const isAnyProjectUpdating = updatingProjectId !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="remodra-card p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-amber-400">Project Workflow</h2>
            <p className="text-slate-400 text-sm lg:text-base">Manage projects through all workflow stages</p>
            <p className="text-xs text-slate-500 mt-1">💡 Drag projects between columns using the grip handle</p>
            <p className="text-xs text-slate-500">🔧 Multiple projects can be in the same workflow stage</p>
          </div>
          <div className="text-center lg:text-right">
            <div className="text-xl lg:text-2xl font-bold text-slate-200">{validProjects.length}</div>
            <div className="text-sm text-slate-400">Total Projects</div>
            {isAnyProjectUpdating && (
              <div className="text-xs text-amber-400 mt-1 animate-pulse">
                ⚡ Updating...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-x-auto pb-4">
        {sortedColumns.map((column) => (
          <div key={column.id} className="w-full lg:w-80 lg:flex-shrink-0">
            <KanbanColumn
              title={column.title}
              icon={column.icon}
              color={column.color}
              projects={column.projects}
              onView={onViewProject}
              onEdit={onEditProject}
              onDelete={onDeleteProject}
              statusId={column.id}
              onDrop={handleDrop}
              draggedProjectId={draggedProjectId}
              updatingProjectId={updatingProjectId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

 