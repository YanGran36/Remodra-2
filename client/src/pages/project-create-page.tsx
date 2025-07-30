import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useProjects } from '../hooks/use-projects';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';

// UI Components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { Badge } from '../components/ui/badge';

// Icons
import { 
  Plus, 
  Calendar as CalendarIcon,
  ArrowLeft,
  Building,
  User,
  DollarSign,
  FileText,
  Settings
} from 'lucide-react';

// Layout Components
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

// Workflow Components
import { 
  getWorkflowForService, 
  type ServiceWorkflow 
} from '../lib/project-workflows';

// Custom hook to fetch contractor services
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

// Validation schema
const projectFormSchema = z.object({
  title: z.string().min(2, "Project title must be at least 2 characters"),
  description: z.string().optional(),
  serviceType: z.string().min(1, "Please select a service type"),
  clientId: z.number().min(1, "Please select a client"),
  budget: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  notes: z.string().optional(),
  status: z.string().default("pending")
});

interface ContractorService {
  id: string;
  name: string;
  serviceType: string;
  unit: string;
  laborRate: number;
  laborMethod: string;
}

type ProjectFormData = z.infer<typeof projectFormSchema>;

export default function ProjectCreatePage() {
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<ServiceWorkflow | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { createProject, isCreating } = useProjects();

  // Fetch contractor's custom services
  const { data: contractorServices = [], isLoading: isLoadingServices } = useQuery<ContractorService[]>({
    queryKey: ['/api/direct/services'],
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: '',
      description: '',
      serviceType: '',
      clientId: 0,
      budget: '',
      startDate: undefined,
      endDate: undefined,
      notes: '',
      status: 'pending'
    }
  });

  // Update workflow when service type changes
  React.useEffect(() => {
    const workflow = getWorkflowForService(selectedServiceType);
    setSelectedWorkflow(workflow);
    form.setValue('serviceType', selectedServiceType);
  }, [selectedServiceType, form]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const projectData = {
        ...data,
        budget: data.budget ? data.budget.toString() : undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        serviceType: data.serviceType,
        contractorId: 2 // Default contractor ID - this should come from auth context
      };

      await createProject(projectData);
      
      toast({
        title: 'Project created successfully!',
        description: `Project "${data.title}" has been created and is ready for workflow tracking.`,
      });

      navigate('/projects');
    } catch (error) {
      toast({
        title: 'Error creating project',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
              <div className="flex justify-center mb-6">
                <img 
                  src="/remodra-logo.png" 
                  alt="Remodra Logo" 
                  className="h-16 w-16 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-amber-400 mb-2">Create New Project</h1>
              <p className="text-slate-400">Set up a new construction project with workflow tracking</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Project Form */}
                <div className="lg:col-span-2">
                  <Card className="bg-slate-800 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-amber-400 flex items-center">
                        <Plus className="h-5 w-5 mr-2" />
                        Project Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          {/* Basic Information */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-200 flex items-center">
                              <Building className="h-4 w-4 mr-2" />
                              Basic Information
                            </h3>
                            
                            <FormField
                              control={form.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-300 font-medium">Project Title</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter project title" 
                                      {...field} 
                                      className="remodra-input"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-300 font-medium">Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe the project scope and requirements" 
                                      {...field} 
                                      className="remodra-input"
                                      rows={3}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="serviceType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Service Type</FormLabel>
                                  <Select 
                                    value={selectedServiceType} 
                                    onValueChange={(value) => {
                                      setSelectedServiceType(value);
                                      field.onChange(value);
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                                        <SelectValue placeholder="Select service type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-700 border-slate-600">
                                      {isLoadingServices ? (
                                        <SelectItem value="" disabled>Loading services...</SelectItem>
                                      ) : contractorServices.length === 0 ? (
                                        <SelectItem value="" disabled>No services available</SelectItem>
                                      ) : (
                                        contractorServices.map((service) => (
                                          <SelectItem key={service.id} value={service.serviceType}>
                                            {service.name} ({service.serviceType})
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Financial Information */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-200 flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Financial Information
                            </h3>
                            
                            <FormField
                              control={form.control}
                              name="budget"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Budget</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter project budget" 
                                      type="number"
                                      step="0.01"
                                      {...field} 
                                      className="bg-slate-700 border-slate-600 text-slate-200"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Timeline */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-200 flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              Timeline
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            className="w-full bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                                          >
                                            {field.value ? (
                                              format(field.value, "PPP")
                                            ) : (
                                              <span>Pick a start date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={(date) =>
                                            date < new Date()
                                          }
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            className="w-full bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                                          >
                                            {field.value ? (
                                              format(field.value, "PPP")
                                            ) : (
                                              <span>Pick an end date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={(date) =>
                                            date < new Date()
                                          }
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          {/* Additional Notes */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-200 flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Additional Notes
                            </h3>
                            
                            <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Add any additional notes or special requirements" 
                                      {...field} 
                                      className="bg-slate-700 border-slate-600 text-slate-200"
                                      rows={3}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Form Actions */}
                          <div className="flex items-center gap-4 pt-6">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => navigate('/projects')}
                              className="flex items-center"
                            >
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={isCreating}
                              className="flex items-center"
                            >
                              {isCreating ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Project
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>

                {/* Workflow Preview */}
                <div className="lg:col-span-1">
                  <Card className="bg-slate-800 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-amber-400 flex items-center">
                        <Settings className="h-5 w-5 mr-2" />
                        Workflow Preview
                      </CardTitle>
                    </CardHeader>
                                         <CardContent>
                       {isLoadingServices ? (
                         <div className="text-center py-8">
                           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-4"></div>
                           <p className="text-slate-400">Loading services...</p>
                         </div>
                       ) : contractorServices.length === 0 ? (
                         <div className="text-center py-8">
                           <div className="text-4xl mb-4">⚠️</div>
                           <h4 className="font-semibold text-slate-200 mb-2">No Services Available</h4>
                           <p className="text-slate-400 mb-4">You need to add services first</p>
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => navigate('/simple-pricing')}
                             className="text-amber-400 border-amber-400 hover:bg-amber-400 hover:text-slate-900"
                           >
                             Add Services
                           </Button>
                         </div>
                       ) : selectedWorkflow ? (
                         <div className="space-y-4">
                           <div className="text-center p-4 bg-slate-700 rounded-lg">
                             <h4 className="font-semibold text-slate-200 mb-2">
                               {selectedWorkflow.serviceName}
                             </h4>
                             <Badge variant="outline" className="text-amber-400 border-amber-400">
                               {selectedWorkflow.totalEstimatedDays} days estimated
                             </Badge>
                           </div>
                           
                           <div className="space-y-3">
                             <h5 className="text-sm font-medium text-slate-300">Workflow Stages:</h5>
                             {selectedWorkflow.stages.map((stage, index) => (
                               <div key={stage.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                                 <div className="flex-shrink-0">
                                   <span className="text-lg">{stage.icon}</span>
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className="text-sm font-medium text-slate-200 truncate">
                                     {stage.title}
                                   </p>
                                   {stage.estimatedDays && (
                                     <p className="text-xs text-slate-400">
                                       {stage.estimatedDays} day{stage.estimatedDays !== 1 ? 's' : ''}
                                     </p>
                                   )}
                                 </div>
                                 <Badge variant="outline" className="text-xs">
                                   {index + 1}
                                 </Badge>
                               </div>
                             ))}
                           </div>
                         </div>
                       ) : (
                         <div className="text-center py-8">
                           <div className="text-4xl mb-4">🏗️</div>
                           <p className="text-slate-400">Select a service type to see the workflow</p>
                         </div>
                       )}
                     </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 