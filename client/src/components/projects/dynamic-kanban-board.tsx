import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  closestCorners,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  Eye, 
  FileEdit, 
  Trash2, 
  MoreHorizontal,
  CalendarIcon,
  DollarSign,
  Settings,
  Plus,
  Users
} from "lucide-react";
// Removed date-fns dependency
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

interface DynamicKanbanBoardProps {
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

function DroppableColumn({ 
  column, 
  onViewProject, 
  onEditProject, 
  onDeleteProject 
}: {
  column: Column;
  onViewProject: (project: ProjectWithClient) => void;
  onEditProject: (project: ProjectWithClient) => void;
  onDeleteProject: (projectId: number) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  const style = {
    backgroundColor: isOver ? 'rgba(0, 0, 0, 0.05)' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${column.bgColor} rounded-xl p-4 min-h-96 border border-gray-100 shadow-sm`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-sm">{column.icon}</span>
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${column.color} mb-1`}>{column.title}</h3>
            {column.estimatedDays && (
              <p className="text-xs text-gray-500 font-medium">{column.estimatedDays} days</p>
            )}
          </div>
          <Badge variant="outline" className="ml-2 text-xs rounded-full bg-white/80">
            {column.projects.length}
          </Badge>
        </div>
      </div>

      <p className="text-xs text-gray-600 mb-4 leading-relaxed">{column.description}</p>

      <SortableContext
        items={column.projects.map(p => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-40 space-y-3">
          {column.projects.map(project => (
            <SortableProjectCard
              key={project.id}
              project={project}
              onView={onViewProject}
              onEdit={onEditProject}
              onDelete={onDeleteProject}
            />
          ))}
          
          {column.projects.length === 0 && (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg bg-white/50">
              <div className="text-center">
                <p className="text-sm text-gray-500 font-medium">
                  No projects
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Drag projects here
                </p>
              </div>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableProjectCard({ 
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-3 cursor-pointer hover:shadow-md transition-all duration-200 group border border-gray-100 bg-white">
        <CardContent className="p-4">
          <div className="mb-3 flex justify-between items-start">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1 mr-3 text-gray-900">{project.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-gray-100">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView(project)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <FileEdit className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(project.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {project.client && (
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-3 w-3 text-blue-600" />
              </div>
              <p className="text-xs text-gray-700 font-medium">
                {project.client.firstName} {project.client.lastName}
              </p>
            </div>
          )}

          {project.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {project.budget && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs text-emerald-700 font-semibold">
                    {formatCurrency(project.budget)}
                  </span>
                </div>
              )}
              
              {project.startDate && (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs text-blue-700 font-medium">
                    {new Date(project.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {project.serviceType && (
              <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
                {project.serviceType}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectCardOverlay({ project }: { project: ProjectWithClient }) {
  return (
    <Card className="w-80 shadow-lg">
      <CardContent className="p-4">
        <h3 className="font-medium text-base mb-2">{project.title}</h3>
        {project.client && (
          <p className="text-sm text-gray-600 mb-2">
            {project.client.firstName} {project.client.lastName}
          </p>
        )}
        {project.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {project.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DynamicKanbanBoard({ 
  projects, 
  onViewProject, 
  onEditProject, 
  onDeleteProject,
  selectedServiceType = "fence"
}: DynamicKanbanBoardProps) {
  const [activeProject, setActiveProject] = useState<ProjectWithClient | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get workflow stages for the selected service type
  useEffect(() => {
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
  }, [projects, selectedServiceType]);

  // Mutation to update a single project's status
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/protected/projects/${id}`, {
        status
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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

  function handleDragStart(event: DragStartEvent) {
    const project = projects.find(p => p.id === event.active.id);
    setActiveProject(project || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over) {
      setActiveProject(null);
      return;
    }

    const activeProject = projects.find(p => p.id === active.id);
    if (!activeProject) {
      setActiveProject(null);
      return;
    }

    // Get the target column ID
    let targetColumnId = over.id as string;
    
    // If dropping on a project card, get the column from its status
    if (!columns.find(col => col.id === targetColumnId)) {
      const targetProject = projects.find(p => p.id === over.id);
      if (targetProject) {
        targetColumnId = targetProject.status;
      }
    }

    // Check if we're dropping on a different column
    if (targetColumnId && activeProject.status !== targetColumnId) {
      console.log('Drag end data:', {
        activeProject: activeProject,
        targetColumnId: targetColumnId,
        updateData: {
          id: activeProject.id,
          status: targetColumnId
        }
      });
      
      // Use the simple single project status update
      updateProjectStatusMutation.mutate({
        id: activeProject.id,
        status: targetColumnId
      });
    }

    setActiveProject(null);
  }

  function handleDragOver(event: DragOverEvent) {
    // Handle drag over for better UX feedback
  }

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
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Customize
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              onViewProject={onViewProject}
              onEditProject={onEditProject}
              onDeleteProject={onDeleteProject}
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeProject && (
            <ProjectCardOverlay project={activeProject} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 