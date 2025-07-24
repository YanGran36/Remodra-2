import { useState, Suspense, lazy, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Calendar, 
  CalendarCheck, 
  DollarSign, 
  FileText, 
  BellIcon,
  Search,
  ArrowRight,
  FileEdit,
  UserPlus,
  CalendarPlus,
  CheckCircle,
  Phone,
  MessageSquare,
  MapPin,
  Trophy,
  User,
  Clock,
  Building,
  Receipt,
  TrendingUp,
  Users,
  Target,
  Home,
  Hammer,
  Wrench,
  Paintbrush,
  Plus,
  Activity,
  ClipboardList
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import PageHeader from '../components/shared/page-header';
import StatCard from '../components/dashboard/stat-card';
import ScheduleItem from '../components/dashboard/schedule-item';
import ProjectCard from '../components/dashboard/project-card';
import ActivityItem from '../components/dashboard/activity-item';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/use-auth';
import { useLanguage } from '../hooks/use-language';
import TopNav from '../components/layout/top-nav';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import ClientForm from '../components/clients/client-form';
import EventDialog from '../components/events/event-dialog';
import { useClients, ClientInput } from '../hooks/use-clients';

// Lazy load the achievement component to improve initial load time
const AchievementSummary = lazy(() => import("../components/achievements/AchievementSummary").then(module => ({
  default: module.AchievementSummary
})));

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [, setLocation] = useLocation();
  
  // State for form dialogs
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  // Fetch all data for search
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/protected/clients"] });
  const { data: projects = [] } = useQuery<any[]>({ queryKey: ["/api/protected/projects"] });
  const { data: events = [] } = useQuery<any[]>({ queryKey: ["/api/protected/events"] });
  const { data: estimates = [] } = useQuery<any[]>({ queryKey: ["/api/protected/estimates"] });
  const { data: invoices = [] } = useQuery<any[]>({ queryKey: ["/api/protected/invoices"] });

  // Client form handlers
  const { createClient, isCreating } = useClients();
  
  const handleClientFormSubmit = (data: ClientInput) => {
    createClient(data);
    setIsClientFormOpen(false);
  };

  const handleNewClient = () => {
    setIsClientFormOpen(true);
  };

  const handleNewEvent = () => {
    setIsEventDialogOpen(true);
  };

  const handleQuickEstimate = () => {
    setLocation('/estimates/create-professional');
  };

  // Search functionality
  const searchResults = searchQuery.trim() ? {
    clients: clients.filter((client: any) => 
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery) ||
      client.address?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0,5),
    projects: projects.filter((project: any) =>
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    events: events.filter((event: any) =>
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    estimates: estimates.filter((estimate: any) =>
      estimate.estimateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0,5),
    invoices: invoices.filter((invoice: any) =>
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
  } : { clients: [], projects: [], events: [], estimates: [], invoices: [] };

  const totalResults = Object.values(searchResults).flat().length;

  useEffect(() => {
    setShowSearchResults(searchQuery.trim().length > 0);
  }, [searchQuery]);

  // Calculate real dashboard statistics
  const today = new Date();
  const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  // Real upcoming jobs data from events
  const upcomingEvents = events.filter((event: any) => {
    const eventDate = new Date(event.startTime);
    return eventDate >= today && event.status !== 'cancelled';
  });

  const upcomingJobs = {
    total: upcomingEvents.length,
    thisWeek: upcomingEvents.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return eventDate <= oneWeekFromNow;
    }).length,
    nextWeek: upcomingEvents.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return eventDate > oneWeekFromNow && eventDate <= twoWeeksFromNow;
    }).length
  };

  // Real pending invoices data
  const pendingInvoicesList = invoices.filter((invoice: any) => 
    invoice.status === 'pending' || invoice.status === 'sent'
  );
  
  const totalPendingAmount = pendingInvoicesList.reduce((sum: number, invoice: any) => sum + (parseFloat(invoice.total) || 0), 0);

  const pendingInvoices = {
    total: `$${totalPendingAmount.toLocaleString()}`,
    dueThisWeek: pendingInvoicesList.filter((invoice: any) => {
      const dueDate = new Date(invoice.dueDate);
      return dueDate <= oneWeekFromNow;
    }).length,
    overdue: pendingInvoicesList.filter((invoice: any) => {
      const dueDate = new Date(invoice.dueDate);
      return dueDate < today;
    }).length
  };

  // Real pending estimates data
  const pendingEstimatesList = estimates.filter((estimate: any) => 
    estimate.status === 'pending' || estimate.status === 'sent' || estimate.status === 'draft'
  );

  const pendingEstimates = {
    total: pendingEstimatesList.length,
    sent: pendingEstimatesList.filter((est: any) => est.status === 'sent').length,
    draft: pendingEstimatesList.filter((est: any) => est.status === 'draft').length
  };

  // Real today's schedule from events
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  
  const todayEvents = events.filter((event: any) => {
    const eventDate = new Date(event.startTime);
    return eventDate >= todayStart && eventDate < todayEnd && event.status !== 'cancelled';
  }).sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const todaySchedule = todayEvents.map((event: any) => {
    const startTime = new Date(event.startTime);
    const client = clients.find((c: any) => c.id === event.clientId);
    
    return {
      time: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      timeColor: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      title: event.title,
      location: `${event.address || ''} ${event.city || ''} ${event.state || ''}`,
      contact: client ? {
        name: `${client.firstName} ${client.lastName}`,
        avatar: "",
        initials: `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`
      } : undefined,
      orderNumber: undefined
    };
  });

  // Real active projects data
  const activeProjectsList = projects.filter((project: any) => 
    project.status === 'active' || project.status === 'in_progress'
  ).slice(0, 3);

  const activeProjects = activeProjectsList.map((project: any) => {
    const client = clients.find((c: any) => c.id === project.clientId);
    
    return {
      id: project.id,
      title: project.title,
      status: project.status,
      progress: project.progress || 0,
      client: client ? `${client.firstName} ${client.lastName}` : "Unknown Client",
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget || 0    };
  });

  // Real recent activity data
  const recentActivity = [
    ...events.map((event: any) => ({
      type: 'event',
      title: event.title,
      description: `Scheduled for ${new Date(event.startTime).toLocaleDateString()}`,
      timestamp: new Date(event.createdAt).toLocaleDateString(),
      icon: <Calendar className="h-4 w-4" />,
      iconBgColor: "bg-accent/20",
      iconColor: "text-accent"
    })),
    ...estimates.map((estimate: any) => ({
      type: 'estimate',
      title: estimate.estimateNumber,
      description: `Estimate ${estimate.status}`,
      timestamp: new Date(estimate.createdAt).toLocaleDateString(),
      icon: <FileText className="h-4 w-4" />,
      iconBgColor: "bg-primary/20",
      iconColor: "text-primary"
    })),
    ...invoices.map((invoice: any) => ({
      type: 'invoice',
      title: invoice.invoiceNumber,
      description: `Invoice ${invoice.status}`,
      timestamp: new Date(invoice.createdAt).toLocaleDateString(),
      icon: <Receipt className="h-4 w-4" />,
      iconBgColor: "bg-success/20",
      iconColor: "text-success"
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <main className="p-8 space-y-8">
          {/* Header with Remodra branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/remodra-logo.png" 
                alt="Remodra Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="remodra-title mb-3">
              Welcome back, {user?.firstName || 'Contractor'}!
            </h1>
            <p className="remodra-subtitle">
              Let's build something amazing today
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button className="remodra-button-outline" onClick={handleNewClient}>
              <UserPlus className="h-5 w-5 mr-2" />
              New Client
            </Button>
            <Button className="remodra-button-outline" onClick={handleNewEvent}>
              <CalendarPlus className="h-5 w-5 mr-2" />
              New Event
            </Button>
            <Button className="remodra-button-outline" onClick={handleQuickEstimate}>
              <Wrench className="h-5 w-5 mr-2" />
              Quick Estimate
            </Button>
          </div>



          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{upcomingJobs.total}</div>
              <div className="remodra-stats-label">Upcoming Jobs</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{pendingInvoices.total}</div>
              <div className="remodra-stats-label">Pending Invoices</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{pendingEstimates.total}</div>
              <div className="remodra-stats-label">Pending Estimates</div>
              <div className="remodra-stats-accent"></div>
            </div>
            <div className="remodra-stats-card">
              <div className="remodra-stats-number">{activeProjects.length}</div>
              <div className="remodra-stats-label">Active Projects</div>
              <div className="remodra-stats-accent"></div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Schedule */}
            <div className="lg:col-span-2">
              <div className="remodra-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-amber-400">Today's Schedule</h2>
                  <Badge className="remodra-badge">
                    {todaySchedule.length} Events
                  </Badge>
                </div>
                
                {todaySchedule.length === 0 ? (
                  <div className="remodra-empty">
                    <div className="remodra-empty-icon">📅</div>
                    <div className="remodra-empty-title">No Events Today</div>
                    <div className="remodra-empty-description">Enjoy your day off or add some events to your calendar</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaySchedule.map((event, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600 hover:border-amber-500/50 transition-all duration-300">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${event.timeColor}`}>
                          {event.time}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-200">{event.title}</h3>
                          <p className="text-slate-400 text-sm">{event.location}</p>
                          {event.contact && (
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-amber-500 text-slate-900">
                                  {event.contact.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-slate-400 text-sm">{event.contact.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Projects */}
            <div>
              <div className="remodra-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-amber-400">Active Projects</h2>
                  <Badge className="remodra-badge">
                    {activeProjects.length}
                  </Badge>
                </div>
                
                {activeProjects.length === 0 ? (
                  <div className="remodra-empty">
                    <div className="remodra-empty-icon">🏗️</div>
                    <div className="remodra-empty-title">No Active Projects</div>
                    <div className="remodra-empty-description">Start a new project to see it here</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeProjects.map((project) => (
                      <div key={project.id} className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600 hover:border-amber-500/50 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-200">{project.title}</h3>
                          <Badge className="remodra-badge-outline">
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{project.client}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amber-400">${project.budget.toLocaleString()}</span>
                          <span className="text-slate-400">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="remodra-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-400">Recent Activity</h2>
              <Button className="remodra-button-outline" onClick={() => window.location.href = '/dashboard'}>
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600 hover:border-amber-500/50 transition-all duration-300">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.iconBgColor}`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200">{activity.description}</p>
                    <p className="text-slate-400 text-sm">{activity.timestamp}</p>
                  </div>
                  <Badge className="remodra-badge-outline">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

             {/* Client Form Dialog */}
       <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>Add New Client</DialogTitle>
           </DialogHeader>
           <ClientForm 
             onSubmit={handleClientFormSubmit} 
             isSubmitting={isCreating}
             onCancel={() => setIsClientFormOpen(false)}
           />
         </DialogContent>
       </Dialog>

       {/* Event Dialog */}
       <EventDialog 
         isOpen={isEventDialogOpen} 
         onClose={() => setIsEventDialogOpen(false)}
       />
    </div>
  );
}
