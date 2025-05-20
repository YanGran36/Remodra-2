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
  DollarSign
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import EnhancedPdfTemplateEditor from "@/components/pdf/enhanced-pdf-template-editor";
import { PdfTemplateConfig } from "@/components/pdf/pdf-template-settings";

const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const securityFormSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters."),
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SecurityFormValues = z.infer<typeof securityFormSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [pdfTemplateConfig, setPdfTemplateConfig] = useState<Partial<PdfTemplateConfig> | undefined>(undefined);
  const [isLoadingPdfConfig, setIsLoadingPdfConfig] = useState(true);
  
  // Cargar la configuración guardada de la plantilla PDF
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

  // Función para guardar la configuración de la plantilla PDF
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="h-6 w-6 mr-2" />
              Settings
            </h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security">
                <CreditCard className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="pdf-templates" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                PDF Templates
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <BellRing className="h-4 w-4 mr-2" />
                Notifications
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
            
            {/* Profile Tab */}
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
                      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                        <div className="space-y-4 md:w-2/3">
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
                                  <Input placeholder="Acme Construction" {...field} />
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
                                  <Input placeholder="john.doe@example.com" {...field} />
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
                        </div>
                        
                        <div className="md:w-1/3 flex flex-col items-center justify-start">
                          <Avatar className="h-32 w-32">
                            <AvatarImage src="" alt={`${user?.firstName} ${user?.lastName}`} />
                            <AvatarFallback className="text-3xl">
                              {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")}
                            </AvatarFallback>
                          </Avatar>
                          <Button variant="outline" className="mt-4">
                            Change Photo
                          </Button>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Business Address</h3>
                        <div className="space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Main Street" {...field} />
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
                                    <Input placeholder="Springfield" {...field} />
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
                                    <Input placeholder="IL" {...field} />
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
                                    <Input placeholder="62701" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="flex items-center"
                        disabled={updateProfileMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Password & Security</CardTitle>
                  <CardDescription>
                    Update your password and manage account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-8">
                      <div className="space-y-4">
                        <FormField
                          control={securityForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={securityForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Password must be at least 6 characters long
                                </FormDescription>
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
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="flex items-center"
                        disabled={changePasswordMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account by enabling two-factor authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Enable Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-500">
                        Receive a verification code via SMS or authentication app
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                  <Alert>
                    <AlertTitle>Coming soon</AlertTitle>
                    <AlertDescription>
                      Two-factor authentication will be available in a future update.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* PDF Templates Tab */}
            <TabsContent value="pdf-templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>PDF Template Configuration</CardTitle>
                  <CardDescription>
                    Customize your PDF templates for estimates, invoices and other documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPdfConfig ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <span className="ml-3">Loading template configuration...</span>
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
            
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how and when you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Email Notifications</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">New Estimate Requests</h4>
                          <p className="text-sm text-gray-500">Get notified when a client requests an estimate</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Invoice Status Updates</h4>
                          <p className="text-sm text-gray-500">Get notified when an invoice is viewed or paid</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Project Updates</h4>
                          <p className="text-sm text-gray-500">Get notified about project status changes</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Marketing & Tips</h4>
                          <p className="text-sm text-gray-500">Receive contractor tips and feature updates</p>
                        </div>
                        <Switch />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">SMS Notifications</h3>
                      <Alert>
                        <AlertTitle>Coming soon</AlertTitle>
                        <AlertDescription>
                          SMS notifications will be available in a future update.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Notification Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theme & Appearance</CardTitle>
                  <CardDescription>
                    Customize how ContractorHub looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Theme Mode</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="border rounded-lg p-3 cursor-pointer bg-white flex flex-col items-center justify-center hover:border-primary">
                          <div className="h-20 w-full rounded-md border mb-2 bg-white"></div>
                          <span className="text-sm font-medium">Light</span>
                        </div>
                        <div className="border rounded-lg p-3 cursor-pointer bg-white flex flex-col items-center justify-center hover:border-primary">
                          <div className="h-20 w-full rounded-md border mb-2 bg-gray-900"></div>
                          <span className="text-sm font-medium">Dark</span>
                        </div>
                        <div className="border rounded-lg p-3 cursor-pointer bg-white flex flex-col items-center justify-center hover:border-primary border-primary">
                          <div className="h-20 w-full rounded-md border mb-2 bg-gradient-to-b from-white to-gray-900"></div>
                          <span className="text-sm font-medium">System</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Color Accent</h3>
                      <Alert>
                        <AlertTitle>Coming soon</AlertTitle>
                        <AlertDescription>
                          Custom accent colors will be available in a future update.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Appearance Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Pricing Configuration Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Configuration</CardTitle>
                  <CardDescription>
                    Configure your pricing for all services and materials in one place. These prices will be used in all estimates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Button variant="outline" onClick={() => window.location.href = '/pricing-config'}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Go to Pricing Configuration Page
                    </Button>
                  </div>
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      All prices configured in the Pricing Configuration page will be used automatically in all estimates and invoices.
                      Make sure your prices are accurate before creating estimates for clients.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}