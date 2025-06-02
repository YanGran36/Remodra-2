import { useState } from "react";
import { Link } from "wouter";
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
  CheckCircle,
  Phone,
  MessageSquare,
  MapPin,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import StatCard from "@/components/dashboard/stat-card";
import ScheduleItem from "@/components/dashboard/schedule-item";
import ProjectCard from "@/components/dashboard/project-card";
import ActivityItem from "@/components/dashboard/activity-item";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { AchievementSummary } from "@/components/achievements/AchievementSummary";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Sample data - in a real app, this would come from an API call
  const upcomingJobs = {
    total: 8,
    thisWeek: 5,
    nextWeek: 3
  };

  const pendingInvoices = {
    total: "$12,650",
    dueThisWeek: "$4,200",
    overdue: "$2,340"
  };

  const pendingEstimates = {
    total: 5,
    sent: 3,
    draft: 2
  };

  const todaySchedule = [
    {
      time: "9:00 AM",
      timeColor: "bg-blue-100 text-blue-800",
      title: "Site visit - Johnson Kitchen Remodel",
      location: "1234 Oak Street, Springfield",
      contact: {
        name: "Sarah Johnson",
        avatar: "",
        initials: "SJ"
      }
    },
    {
      time: "11:30 AM",
      timeColor: "bg-green-100 text-green-800",
      title: "Material pickup - Home Supply Co.",
      location: "520 Industrial Blvd",
      orderNumber: "45622"
    },
    {
      time: "2:00 PM",
      timeColor: "bg-purple-100 text-purple-800",
      title: "Estimate Presentation - Taylor Bathroom Renovation",
      location: "567 Maple Drive, Springfield",
      contact: {
        name: "Mark Taylor",
        avatar: "",
        initials: "MT"
      }
    }
  ];

  const activeProjects = [
    {
      title: "Johnson Kitchen Remodel",
      startDate: "May, 10 2023",
      status: "In Progress" as const,
      progress: 65,
      team: [
        { name: "Sarah Johnson", initials: "SJ" },
        { name: "Bob Miller", initials: "BM" }
      ]
    },
    {
      title: "Davis Deck Construction",
      startDate: "April 22, 2023",
      status: "Materials Pending" as const,
      progress: 40,
      team: [
        { name: "James Davis", initials: "JD" },
        { name: "Maria Lopez", initials: "ML" }
      ]
    },
    {
      title: "Taylor Bathroom Renovation",
      startDate: "May 15, 2023",
      status: "On Schedule" as const,
      progress: 25,
      team: [
        { name: "Mark Taylor", initials: "MT" }
      ]
    }
  ];

  const recentActivity = [
    {
      icon: <FileEdit className="h-4 w-4" />,
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      title: <><span className="font-medium">Invoice #INV-2023-054</span> was marked as <span className="text-green-600 font-medium">Paid</span></>,
      description: "Johnson Kitchen Remodel • $2,450.00",
      timestamp: "Today at 10:23 AM"
    },
    {
      icon: <FileText className="h-4 w-4" />,
      iconBgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      title: <><span className="font-medium">Estimate #EST-2023-028</span> was created for <span className="font-medium">Mark Taylor</span></>,
      description: "Bathroom Renovation • $8,750.00",
      timestamp: "Yesterday at 4:12 PM"
    },
    {
      icon: <UserPlus className="h-4 w-4" />,
      iconBgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
      title: <><span className="font-medium">New client</span> added to database</>,
      description: "Robert Wilson • (555) 123-4567",
      timestamp: "Yesterday at 2:45 PM"
    },
    {
      icon: <CheckCircle className="h-4 w-4" />,
      iconBgColor: "bg-green-100",
      iconColor: "text-green-600",
      title: <><span className="font-medium">Project milestone completed</span></>,
      description: "Davis Deck Construction • Foundation completed",
      timestamp: "May 16, 2023 at 3:30 PM"
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="page-layout">
          <header className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('navigation.dashboard')}</h1>
              <p className="text-gray-600">{t('dashboard.welcomeBack')}, {user?.firstName}. {t('dashboard.todayActivity')}</p>
            </div>
            
            <div className="flex space-x-4">
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative bg-white p-2 rounded-full text-gray-500 hover:text-gray-700">
                  <BellIcon className="h-5 w-5" />
                  <Badge className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center rounded-full">3</Badge>
                </Button>
              </div>
              <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm">
                <Search className="text-gray-400 mr-2 h-4 w-4" />
                <Input 
                  type="text" 
                  placeholder={t('common.search')} 
                  className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm w-40 p-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </header>

          {/* Dashboard stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard 
              icon={<CalendarCheck className="h-5 w-5" />}
              iconColor="text-primary"
              iconBgColor="bg-primary/15"
              title={t('dashboard.upcomingJobs')}
              value={upcomingJobs.total}
              details={[
                { label: t('dashboard.thisWeek'), value: upcomingJobs.thisWeek },
                { label: t('dashboard.nextWeek'), value: upcomingJobs.nextWeek }
              ]}
            />
            
            <StatCard 
              icon={<DollarSign className="h-5 w-5" />}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              title={t('dashboard.pendingInvoices')}
              value={pendingInvoices.total}
              details={[
                { label: t('dashboard.dueThisWeek'), value: pendingInvoices.dueThisWeek },
                { label: t('dashboard.overdue'), value: pendingInvoices.overdue, className: "text-red-600" }
              ]}
            />
            
            <StatCard 
              icon={<FileText className="h-5 w-5" />}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
              title={t('dashboard.pendingEstimates')}
              value={pendingEstimates.total}
              details={[
                { label: t('dashboard.sent'), value: pendingEstimates.sent },
                { label: t('dashboard.draft'), value: pendingEstimates.draft }
              ]}
            />
          </div>

          {/* Today's Schedule */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('dashboard.todaySchedule')}</h2>
              <Link href="/calendar" className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
                {t('dashboard.viewCalendar')}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-0 divide-y divide-gray-100">
                {todaySchedule.map((item, index) => (
                  <ScheduleItem 
                    key={index}
                    time={item.time}
                    timeColor={item.timeColor}
                    title={item.title}
                    location={item.location}
                    contact={item.contact}
                    orderNumber={item.orderNumber}
                    onPhoneClick={() => {}}
                    onMessageClick={item.contact ? () => {} : undefined}
                    onMapClick={() => {}}
                  />
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Project Status */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('dashboard.activeProjects')}</h2>
              <Link href="/projects" className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
                {t('dashboard.viewAllProjects')}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.map((project, index) => (
                <ProjectCard 
                  key={index}
                  title={project.title}
                  startDate={project.startDate}
                  status={project.status}
                  progress={project.progress}
                  team={project.team}
                  onViewDetails={() => {}}
                />
              ))}
            </div>
          </section>

          {/* Gamification Summary and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Achievement Summary */}
            <AchievementSummary />
            
            {/* Recent Activity */}
            <div className="col-span-full lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">{t('dashboard.recentActivity')}</h2>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="19" cy="12" r="1"/>
                    <circle cx="5" cy="12" r="1"/>
                  </svg>
                </Button>
              </div>

              <Card className="shadow-sm border border-gray-100 h-full">
                <CardContent className="p-0 divide-y divide-gray-100">
                  {recentActivity.map((activity, index) => (
                    <ActivityItem 
                      key={index}
                      icon={activity.icon}
                      iconBgColor={activity.iconBgColor}
                      iconColor={activity.iconColor}
                      title={activity.title}
                      description={activity.description}
                      timestamp={activity.timestamp}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
