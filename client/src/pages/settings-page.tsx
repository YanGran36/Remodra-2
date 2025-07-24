import { useState, useEffect } from "react";
import { 
  Settings, 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Save,
  BellRing,
  CreditCard,
  Globe,
  Palette,
  FileText,
  Eye,
  Download,
  DollarSign,
  Users,
  PencilIcon,
  Trash2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from '../hooks/use-auth';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient, fetchWithBaseUrl } from '../lib/queryClient';
import { usePricing } from '../hooks/use-pricing';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../components/ui/form';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';
import EnhancedPdfTemplateEditor from '../components/pdf/enhanced-pdf-template-editor';
import { PdfTemplateConfig } from '../components/pdf/pdf-template-settings';

// Form schemas
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type SecurityFormValues = z.infer<typeof securityFormSchema>;

// Service Pricing Section Component
function ServicePricingSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { services: configuredServices, isLoading } = usePricing();
  const [editingService, setEditingService] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const services = Array.isArray(configuredServices)
    ? configuredServices.map((service: any) => ({
        id: String(service.id || service.serviceType),
        name: service.name || 'Unnamed Service',
        serviceType: service.serviceType || '',
        unit: service.unit || 'ft',
        laborRate: typeof service.laborRate === 'string' ? parseFloat(service.laborRate) : (service.laborRate || 0),
        laborMethod: service.laborCalculationMethod || service.laborMethod || 'by_length'
      }))
    : [];

  const handleEditService = (service: any) => {
    setEditingService({ ...service });
  };

  const handleSaveService = async () => {
    if (!editingService) return;
    setIsSaving(true);
    try {
      const serviceData = {
        id: editingService.id,
        name: editingService.name,
        serviceType: editingService.serviceType,
        unit: editingService.unit,
        laborRate: parseFloat(String(editingService.laborRate)),
        laborMethod: editingService.laborMethod,
        contractorId: 1
      };
      // Use the correct endpoint for update
      const response = await fetchWithBaseUrl(`/api/pricing/direct-service`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData) 
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || result?.error || 'Unknown error');
      }
      await queryClient.invalidateQueries({ queryKey: ['/api/pricing/services'] });
      toast({
        title: 'Service updated',
        description: 'Service has been updated successfully',
      });
      setEditingService(null);
    } catch (error: any) {
      toast({
        title: 'Error saving',
        description: error.message || 'Changes could not be saved. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = async (serviceType: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      // Use the correct endpoint for delete
      const response = await fetchWithBaseUrl(`/api/pricing/direct-service/${serviceType}`, { 
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || result?.error || 'Unknown error');
      }
      await queryClient.invalidateQueries({ queryKey: ['/api/pricing/services'] });
      toast({
        title: 'Service deleted',
        description: 'Service has been removed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete service. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading services...</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No services configured yet.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.href = '/pricing-config'}
        >
          Configure Services
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {services.map((service) => (
          <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              {editingService?.id === service.id ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={editingService.name}
                    onChange={(e) => setEditingService((prev: any) => ({ ...prev, name: e.target.value }))}
                    className="w-32"
                    placeholder="Service name"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={editingService.laborRate}
                    onChange={(e) => setEditingService((prev: any) => ({ ...prev, laborRate: parseFloat(e.target.value) || 0 }))}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">/ {service.unit}</span>
                  <Button size="sm" onClick={handleSaveService} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingService(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-medium">{service.name}</h3>
                  <p className="text-sm text-gray-500">
                    {service.serviceType} • {service.unit} • {service.laborMethod}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {editingService?.id === service.id ? null : (
                <Button size="sm" variant="outline" onClick={() => handleEditService(service)}>
                  <PencilIcon className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteService(service.serviceType)}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.location.href = '/pricing-config'}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage All Services
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/agent-estimate-form'}
          >
            Test in Estimate Form
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [pdfTemplateConfig, setPdfTemplateConfig] = useState<Partial<PdfTemplateConfig> | undefined>(undefined);
  const [isLoadingPdfConfig, setIsLoadingPdfConfig] = useState(true);
  
  // Load saved PDF template configuration
  useEffect(() => {
    try {
      setIsLoadingPdfConfig(true);
      const savedTemplate = localStorage.getItem('pdfTemplateConfig');
      if (savedTemplate) {
        setPdfTemplateConfig(JSON.parse(savedTemplate));
      }
    } catch (error) {
      console.error('Error loading saved PDF template:', error);
      toast({
        title: 'Error Loading Template',
        description: 'There was a problem loading your saved PDF template settings.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingPdfConfig(false);
    }
  }, [toast]);

  // Save PDF template configuration
  const handleSavePdfTemplate = (config: PdfTemplateConfig) => {
    localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
    setPdfTemplateConfig(config);
    toast({
      title: 'PDF Template Saved',
      description: 'Your PDF template configuration has been saved successfully.',
    });
  };

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      companyName: user?.companyName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      zip: user?.zip || "",
    },
  });

  // Security form
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/protected/profile`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: SecurityFormValues) => {
      const res = await apiRequest("POST", `/api/protected/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onProfileSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data);
  }

  function onSecuritySubmit(data: SecurityFormValues) {
    changePasswordMutation.mutate(data);
  }

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center">
                <Settings className="h-6 w-6 mr-2" />
                Settings
              </h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList>
                <TabsTrigger value="profile" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Profile & Settings
                </TabsTrigger>
                <TabsTrigger value="pdf-templates" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Templates
                </TabsTrigger>
                <TabsTrigger value="appearance">
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pricing Configuration
                </TabsTrigger>
              </TabsList>
              
              {/* Profile & Settings Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your account profile information and contact details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="md:w-2/3 space-y-4">
                            <h3 className="text-lg font-medium">Personal Information</h3>
                            
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <FormField
                                control={profileForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="John" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={profileForm.control}
                              name="companyName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your Company LLC" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="john@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <Input placeholder="(555) 123-4567" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <h3 className="text-lg font-medium pt-4">Address Information</h3>
                            
                            <FormField
                              control={profileForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Street Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123 Main St" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <FormField
                                control={profileForm.control}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                      <Input placeholder="New York" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>State</FormLabel>
                                    <FormControl>
                                      <Input placeholder="NY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="zip"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>ZIP Code</FormLabel>
                                    <FormControl>
                                      <Input placeholder="10001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="md:w-1/3 space-y-4">
                            <div className="text-center">
                              <Avatar className="h-24 w-24 mx-auto mb-4">
                                <AvatarImage src="" alt={user?.firstName} />
                                <AvatarFallback>
                                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <Button variant="outline" size="sm">
                                Change Photo
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending}
                            className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Security Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>
                      Update your password and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...securityForm}>
                      <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                        <FormField
                          control={securityForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter current password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={securityForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter new password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={securityForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm new password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={changePasswordMutation.isPending}
                            variant="outline"
                          >
                            {changePasswordMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      Manage your notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="project-updates">Project Updates</Label>
                        <p className="text-sm text-gray-500">Notifications for project status changes</p>
                      </div>
                      <Switch id="project-updates" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="estimate-notifications">Estimate Notifications</Label>
                        <p className="text-sm text-gray-500">Notifications for estimate updates</p>
                      </div>
                      <Switch id="estimate-notifications" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="invoice-reminders">Invoice Reminders</Label>
                        <p className="text-sm text-gray-500">Reminders for overdue invoices</p>
                      </div>
                      <Switch id="invoice-reminders" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                        <p className="text-sm text-gray-500">Reminders for upcoming appointments</p>
                      </div>
                      <Switch id="appointment-reminders" defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Billing & Subscription</CardTitle>
                    <CardDescription>
                      Manage your subscription and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Business Plan</h3>
                        <p className="text-sm text-gray-500">$99/month - All features included</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                        <Button variant="outline" size="sm">
                          Change Plan
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Payment Method</h4>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-6 w-6 text-gray-400" />
                          <div>
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-sm text-gray-500">Expires 12/26</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Update
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Billing History</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>January 2024</span>
                          <span>$99.00</span>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>December 2023</span>
                          <span>$99.00</span>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* PDF Templates Tab */}
              <TabsContent value="pdf-templates" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>PDF Template Settings</CardTitle>
                    <CardDescription>
                      Customize your PDF estimate and invoice templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPdfConfig ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                      </div>
                    ) : (
                      <EnhancedPdfTemplateEditor
                        initialConfig={pdfTemplateConfig}
                        onSave={handleSavePdfTemplate}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize the appearance of your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="dark-mode">Dark Mode</Label>
                          <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                        </div>
                        <Switch id="dark-mode" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="compact-view">Compact View</Label>
                          <p className="text-sm text-gray-500">Use more compact spacing in lists</p>
                        </div>
                        <Switch id="compact-view" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing Configuration Tab */}
              <TabsContent value="pricing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Pricing</CardTitle>
                    <CardDescription>
                      Manage your service labor rates and pricing. These rates are used when creating estimates and invoices.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ServicePricingSection />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Material Pricing</CardTitle>
                    <CardDescription>
                      Configure material costs and markups. This feature is coming soon.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Material Pricing Coming Soon</h3>
                      <p className="text-gray-600 mb-4">
                        We're working on a comprehensive material pricing system that will allow you to:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 mb-6">
                        <li>• Set up material costs and markups</li>
                        <li>• Track supplier information</li>
                        <li>• Manage inventory levels</li>
                        <li>• Generate material lists automatically</li>
                      </ul>
                      <p className="text-sm text-gray-500">
                        For now, you can manage your service labor rates above.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}