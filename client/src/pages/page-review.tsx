import { useState, useEffect } from "react";
import { 
  FileText, 
  Trash2, 
  Eye, 
  Code, 
  Calendar,
  Users,
  Settings,
  DollarSign,
  ClipboardCheck,
  Bot,
  Building,
  Clock,
  Mail,
  MapPin,
  Palette,
  Layout,
  Archive,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Search,
  SortAsc,
  SortDesc
} from "lucide-react";
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Alert, AlertDescription } from '../components/ui/alert';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import PageHeader from '../components/shared/page-header';

interface PageInfo {
  name: string;
  path: string;
  size: string;
  lines: number;
  category: string;
  status: 'active' | 'deprecated' | 'duplicate' | 'test' | 'broken';
  description: string;
  route?: string;
}

export default function PageReview() {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [filteredPages, setFilteredPages] = useState<PageInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Define all pages with their metadata
  const allPages: PageInfo[] = [
    // Core Pages
    {
      name: "Dashboard",
      path: "dashboard.tsx",
      size: "25KB",
      lines: 577,
      category: "Core",
      status: "active",
      description: "Main dashboard with overview and statistics",
      route: "/dashboard"
    },
    {
      name: "Authentication",
      path: "auth-page.tsx",
      size: "13KB",
      lines: 339,
      category: "Core",
      status: "active",
      description: "User authentication and login page",
      route: "/auth"
    },
    {
      name: "Landing Page",
      path: "landing.tsx",
      size: "11KB",
      lines: 283,
      category: "Core",
      status: "active",
      description: "Public landing page for the application",
      route: "/"
    },

    // Estimates
    {
      name: "Estimates List",
      path: "estimates-page.tsx",
      size: "27KB",
      lines: 610,
      category: "Estimates",
      status: "active",
      description: "Main estimates listing and management page",
      route: "/estimates"
    },
    {
      name: "Estimate Detail",
      path: "estimate-detail-page.tsx",
      size: "21KB",
      lines: 559,
      category: "Estimates",
      status: "active",
      description: "Detailed view of a single estimate",
      route: "/estimates/:id"
    },
    {
      name: "Estimate Print",
      path: "estimate-print-page.tsx",
      size: "9.1KB",
      lines: 221,
      category: "Estimates",
      status: "active",
      description: "Print-friendly estimate view",
      route: "/estimates/:id/print"
    },
    {
      name: "Create Estimate",
      path: "estimate-create-service-page.tsx",
      size: "37KB",
      lines: 937,
      category: "Estimates",
      status: "active",
      description: "Create new estimate with service selection",
      route: "/estimates/create"
    },
    {
      name: "Multi-Service Estimate",
      path: "multi-service-estimate-page.tsx",
      size: "35KB",
      lines: 816,
      category: "Estimates",
      status: "active",
      description: "Create estimates with multiple services",
      route: "/estimates/multi-service"
    },
    {
      name: "Professional Estimate",
      path: "professional-estimate-page.tsx",
      size: "28KB",
      lines: 782,
      category: "Estimates",
      status: "active",
      description: "Professional estimate creation interface",
      route: "/estimates/professional"
    },
    {
      name: "Premium Estimate",
      path: "premium-estimate-page.tsx",
      size: "17KB",
      lines: 499,
      category: "Estimates",
      status: "active",
      description: "Premium estimate creation with advanced features",
      route: "/estimates/premium"
    },

    // Clients
    {
      name: "Clients List",
      path: "clients-page.tsx",
      size: "16KB",
      lines: 401,
      category: "Clients",
      status: "active",
      description: "Main clients listing and management",
      route: "/clients"
    },
    {
      name: "Clients List (New)",
      path: "clients-page-new.tsx",
      size: "20KB",
      lines: 528,
      category: "Clients",
      status: "active",
      description: "Updated clients listing with enhanced features",
      route: "/clients-new"
    },
    {
      name: "Client Portal",
      path: "client-portal.tsx",
      size: "33KB",
      lines: 749,
      category: "Clients",
      status: "active",
      description: "Client-facing portal for viewing estimates and invoices",
      route: "/client-portal"
    },
    {
      name: "Client Messages",
      path: "client-messages.tsx",
      size: "16KB",
      lines: 479,
      category: "Clients",
      status: "active",
      description: "Client messaging and communication interface",
      route: "/client-messages"
    },

    // Invoices
    {
      name: "Invoices List",
      path: "invoices-page.tsx",
      size: "21KB",
      lines: 482,
      category: "Invoices",
      status: "active",
      description: "Main invoices listing and management",
      route: "/invoices"
    },
    {
      name: "Invoice Detail",
      path: "invoice-detail-page.tsx",
      size: "22KB",
      lines: 595,
      category: "Invoices",
      status: "active",
      description: "Detailed view of a single invoice",
      route: "/invoices/:id"
    },

    // Projects
    {
      name: "Projects",
      path: "projects-page.tsx",
      size: "22KB",
      lines: 530,
      category: "Projects",
      status: "active",
      description: "Project management and tracking",
      route: "/projects"
    },
    {
      name: "Projects Debug",
      path: "projects-debug.tsx",
      size: "2.1KB",
      lines: 58,
      category: "Projects",
      status: "test",
      description: "Debug interface for projects",
      route: "/projects-debug"
    },

    // Calendar & Events
    {
      name: "Calendar",
      path: "calendar-page.tsx",
      size: "43KB",
      lines: 887,
      category: "Calendar",
      status: "active",
      description: "Calendar and event management",
      route: "/calendar"
    },

    // Time Clock
    {
      name: "Time Clock",
      path: "timeclock-page.tsx",
      size: "25KB",
      lines: 522,
      category: "Time Clock",
      status: "active",
      description: "Employee time tracking interface",
      route: "/timeclock"
    },
    {
      name: "Standalone Time Clock",
      path: "standalone-timeclock.tsx",
      size: "25KB",
      lines: 571,
      category: "Time Clock",
      status: "active",
      description: "Standalone time clock interface",
      route: "/standalone-timeclock"
    },
    {
      name: "Time Clock Select Action",
      path: "time-clock-select-action.tsx",
      size: "5.8KB",
      lines: 150,
      category: "Time Clock",
      status: "active",
      description: "Time clock action selection interface",
      route: "/timeclock/select-action"
    },

    // Admin & Management
    {
      name: "Admin Dashboard",
      path: "admin-dashboard.tsx",
      size: "44KB",
      lines: 1007,
      category: "Admin",
      status: "active",
      description: "Main admin dashboard",
      route: "/admin"
    },
    {
      name: "Admin Dashboard (Architectural)",
      path: "admin-dashboard-architectural.tsx",
      size: "23KB",
      lines: 628,
      category: "Admin",
      status: "active",
      description: "Architectural admin dashboard",
      route: "/admin/architectural"
    },
    {
      name: "Super Admin Dashboard",
      path: "super-admin-dashboard.tsx",
      size: "30KB",
      lines: 800,
      category: "Admin",
      status: "active",
      description: "Super admin dashboard for system management",
      route: "/super-admin"
    },
    {
      name: "Super Admin Dashboard (Fixed)",
      path: "super-admin-dashboard-fixed.tsx",
      size: "36KB",
      lines: 804,
      category: "Admin",
      status: "active",
      description: "Fixed version of super admin dashboard",
      route: "/super-admin-fixed"
    },
    {
      name: "Super Admin Add Contractor",
      path: "super-admin-add-contractor.tsx",
      size: "4.3KB",
      lines: 103,
      category: "Admin",
      status: "active",
      description: "Add new contractor interface",
      route: "/super-admin/add-contractor"
    },

    // Agent Management
    {
      name: "Agent Management",
      path: "agent-management-page.tsx",
      size: "21KB",
      lines: 582,
      category: "Agents",
      status: "active",
      description: "Field agent management and scheduling",
      route: "/agents"
    },
    {
      name: "Agent Estimate Form",
      path: "agent-estimate-form-page.tsx",
      size: "46KB",
      lines: 1039,
      category: "Agents",
      status: "active",
      description: "Agent estimate form creation",
      route: "/agents/estimate-form"
    },
    {
      name: "Agent Service Estimate",
      path: "agent-service-estimate-page.tsx",
      size: "77KB",
      lines: 1761,
      category: "Agents",
      status: "active",
      description: "Agent service estimate creation",
      route: "/agents/service-estimate"
    },

    // Vendor Forms
    {
      name: "Vendor Estimate Form (New)",
      path: "vendor-estimate-form-page-new.tsx",
      size: "61KB",
      lines: 1540,
      category: "Vendor Forms",
      status: "active",
      description: "New vendor estimate form with enhanced features",
      route: "/vendor-estimate-form-new"
    },
    {
      name: "Vendor Estimate Form (Backup)",
      path: "vendor-estimate-form-page-backup.tsx",
      size: "20KB",
      lines: 500,
      category: "Vendor Forms",
      status: "deprecated",
      description: "Backup version of vendor estimate form",
      route: "/vendor-estimate-form-backup"
    },
    {
      name: "Vendor Estimate Form (Broken)",
      path: "vendor-estimate-form-page-broken.tsx",
      size: "58KB",
      lines: 1200,
      category: "Vendor Forms",
      status: "broken",
      description: "Broken version of vendor estimate form",
      route: "/vendor-estimate-form-broken"
    },
    {
      name: "Vendor Estimate Form (Clean)",
      path: "vendor-estimate-form-page-clean.tsx",
      size: "27KB",
      lines: 600,
      category: "Vendor Forms",
      status: "active",
      description: "Clean version of vendor estimate form",
      route: "/vendor-estimate-form-clean"
    },
    {
      name: "Vendor Estimate Form (Simple)",
      path: "vendor-estimate-form-simple.tsx",
      size: "6.2KB",
      lines: 150,
      category: "Vendor Forms",
      status: "active",
      description: "Simple vendor estimate form",
      route: "/vendor-estimate-form-simple"
    },
    {
      name: "Vendor Estimate (Simple)",
      path: "vendor-estimate-simple.tsx",
      size: "15KB",
      lines: 300,
      category: "Vendor Forms",
      status: "active",
      description: "Simple vendor estimate interface",
      route: "/vendor-estimate-simple"
    },

    // Settings & Configuration
    {
      name: "Settings",
      path: "settings-page.tsx",
      size: "31KB",
      lines: 741,
      category: "Settings",
      status: "active",
      description: "Main settings and configuration page",
      route: "/settings"
    },
    {
      name: "Settings (Broken)",
      path: "settings-page-broken.tsx",
      size: "39KB",
      lines: 931,
      category: "Settings",
      status: "broken",
      description: "Broken version of settings page",
      route: "/settings-broken"
    },
    {
      name: "Tools Dashboard",
      path: "tools-dashboard.tsx",
      size: "3.4KB",
      lines: 108,
      category: "Settings",
      status: "active",
      description: "Tools and customization dashboard",
      route: "/tools"
    },
    {
      name: "Pricing Configuration",
      path: "pricing-config-page.tsx",
      size: "29KB",
      lines: 709,
      category: "Settings",
      status: "active",
      description: "Pricing configuration and management",
      route: "/pricing-config"
    },
    {
      name: "PDF Template Editor",
      path: "pdf-template-editor-page.tsx",
      size: "1.3KB",
      lines: 47,
      category: "Settings",
      status: "active",
      description: "PDF template editing interface",
      route: "/pdf-template-editor"
    },

    // Billing & Pricing
    {
      name: "Billing",
      path: "billing.tsx",
      size: "16KB",
      lines: 438,
      category: "Billing",
      status: "active",
      description: "Billing and subscription management",
      route: "/billing"
    },
    {
      name: "Pricing",
      path: "pricing.tsx",
      size: "12KB",
      lines: 304,
      category: "Billing",
      status: "active",
      description: "Pricing plans and features",
      route: "/pricing"
    },
    {
      name: "Simple Pricing",
      path: "simple-pricing-page.tsx",
      size: "11KB",
      lines: 250,
      category: "Billing",
      status: "active",
      description: "Simple pricing page",
      route: "/simple-pricing"
    },

    // AI & Tools
    {
      name: "AI Assistant",
      path: "ai-assistant-page.tsx",
      size: "21KB",
      lines: 441,
      category: "AI & Tools",
      status: "active",
      description: "AI-powered assistant and analysis",
      route: "/ai-assistant"
    },

    // Materials & Services
    {
      name: "Materials",
      path: "materials-page.tsx",
      size: "29KB",
      lines: 670,
      category: "Materials",
      status: "active",
      description: "Materials management and pricing",
      route: "/materials"
    },
    {
      name: "Company Services",
      path: "company-services-page.tsx",
      size: "1.4KB",
      lines: 41,
      category: "Materials",
      status: "active",
      description: "Company services management",
      route: "/company-services"
    },

    // Property & Measurements
    {
      name: "Property Measurements",
      path: "property-measurements-page.tsx",
      size: "31KB",
      lines: 751,
      category: "Property",
      status: "active",
      description: "Property measurement and assessment",
      route: "/property-measurements"
    },

    // Public Views
    {
      name: "Public Estimate View",
      path: "public-estimate-view.tsx",
      size: "35KB",
      lines: 904,
      category: "Public",
      status: "active",
      description: "Public estimate viewing interface",
      route: "/estimate/:id/public"
    },
    {
      name: "Public Invoice View",
      path: "public-invoice-view.tsx",
      size: "20KB",
      lines: 580,
      category: "Public",
      status: "active",
      description: "Public invoice viewing interface",
      route: "/invoice/:id/public"
    },

    // Lead Capture
    {
      name: "Lead Capture",
      path: "lead-capture-page.tsx",
      size: "1.2KB",
      lines: 45,
      category: "Leads",
      status: "active",
      description: "Lead capture and management",
      route: "/lead-capture"
    },

    // Employee Management
    {
      name: "Employee Select",
      path: "employee-select-page.tsx",
      size: "3.1KB",
      lines: 87,
      category: "Employees",
      status: "active",
      description: "Employee selection interface",
      route: "/employee-select"
    },

    // Test & Development Pages
    {
      name: "Simple Login",
      path: "simple-login.tsx",
      size: "4.2KB",
      lines: 123,
      category: "Test",
      status: "test",
      description: "Simple login test page",
      route: "/simple-login"
    },
    {
      name: "Estimate Create (Simple)",
      path: "estimate-create-page.tsx",
      size: "4.2KB",
      lines: 128,
      category: "Test",
      status: "test",
      description: "Simple estimate creation test",
      route: "/estimate-create-simple"
    },
    {
      name: "Estimate Simple Test",
      path: "estimate-simple-test.tsx",
      size: "5.5KB",
      lines: 173,
      category: "Test",
      status: "test",
      description: "Simple estimate test page",
      route: "/estimate-simple-test"
    },
    {
      name: "Achievements",
      path: "achievements-page.tsx",
      size: "732B",
      lines: 23,
      category: "Test",
      status: "test",
      description: "Achievements system test page",
      route: "/achievements"
    },

    // System Pages
    {
      name: "Not Found",
      path: "not-found.tsx",
      size: "1000B",
      lines: 28,
      category: "System",
      status: "active",
      description: "404 error page",
      route: "/404"
    },
  ];

  useEffect(() => {
    setPages(allPages);
    setFilteredPages(allPages);
  }, []);

  // Filter pages
  useEffect(() => {
    let filtered = pages.filter(page => {
      const matchesSearch = page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           page.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           page.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || page.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || page.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    setFilteredPages(filtered);
  }, [pages, searchTerm, categoryFilter, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "deprecated":
        return <Archive className="h-4 w-4 text-yellow-500" />;
      case "broken":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "test":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case "duplicate":
        return <Info className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      deprecated: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      broken: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      test: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      duplicate: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      "Core": <Layout className="h-4 w-4" />,
      "Estimates": <ClipboardCheck className="h-4 w-4" />,
      "Clients": <Users className="h-4 w-4" />,
      "Invoices": <DollarSign className="h-4 w-4" />,
      "Projects": <Building className="h-4 w-4" />,
      "Calendar": <Calendar className="h-4 w-4" />,
      "Time Clock": <Clock className="h-4 w-4" />,
      "Admin": <Settings className="h-4 w-4" />,
      "Agents": <Users className="h-4 w-4" />,
      "Vendor Forms": <FileText className="h-4 w-4" />,
      "Settings": <Settings className="h-4 w-4" />,
      "Billing": <DollarSign className="h-4 w-4" />,
      "AI & Tools": <Bot className="h-4 w-4" />,
      "Materials": <Palette className="h-4 w-4" />,
      "Property": <MapPin className="h-4 w-4" />,
      "Public": <Eye className="h-4 w-4" />,
      "Leads": <Mail className="h-4 w-4" />,
      "Employees": <Users className="h-4 w-4" />,
      "Test": <Code className="h-4 w-4" />,
      "System": <Settings className="h-4 w-4" />
    };
    return icons[category] || <FileText className="h-4 w-4" />;
  };

  const categories = Array.from(new Set(pages.map(page => page.category))).sort();
  const statuses = Array.from(new Set(pages.map(page => page.status))).sort();

  const stats = {
    total: pages.length,
    active: pages.filter(p => p.status === "active").length,
    deprecated: pages.filter(p => p.status === "deprecated").length,
    broken: pages.filter(p => p.status === "broken").length,
    test: pages.filter(p => p.status === "test").length,
    duplicate: pages.filter(p => p.status === "duplicate").length
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />
      <div className="lg:pl-72 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
          <PageHeader 
            title="Page Review" 
            subtitle="Review and manage all pages in the application"
          />

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pages</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Deprecated</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.deprecated}</p>
                  </div>
                  <Archive className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Broken</p>
                    <p className="text-2xl font-bold text-red-600">{stats.broken}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Test</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.test}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duplicates</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.duplicate}</p>
                  </div>
                  <Info className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search pages by name, description, or path..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pages Table */}
          <Card>
            <CardHeader>
              <CardTitle className="card-title">Pages ({filteredPages.length})</CardTitle>
              <CardDescription>
                Review all pages in the application. Use the filters above to narrow down the list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Lines</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPages.map((page) => (
                      <TableRow key={page.path}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {getCategoryIcon(page.category)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm">{page.name}</p>
                              <p className="text-xs text-muted-foreground">{page.path}</p>
                              <p className="text-xs text-muted-foreground mt-1">{page.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {getCategoryIcon(page.category)}
                            {page.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(page.status)}
                            {getStatusBadge(page.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{page.size}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{page.lines.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          {page.route ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {page.route}
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">No route</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {page.status !== "active" && (
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Suggested actions based on page analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.broken > 0 && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{stats.broken} broken pages</strong> should be fixed or removed to improve app stability.
                    </AlertDescription>
                  </Alert>
                )}
                
                {stats.deprecated > 0 && (
                  <Alert>
                    <Archive className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{stats.deprecated} deprecated pages</strong> can be safely removed to clean up the codebase.
                    </AlertDescription>
                  </Alert>
                )}
                
                {stats.test > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{stats.test} test pages</strong> should be moved to a separate test directory or removed from production.
                    </AlertDescription>
                  </Alert>
                )}
                
                {stats.duplicate > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{stats.duplicate} duplicate pages</strong> should be consolidated to reduce maintenance overhead.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
