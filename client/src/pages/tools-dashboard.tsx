import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  BotIcon, 
  Palette, 
  ClipboardCheckIcon, 
  ArrowRight,
  PaintBucket,
  FileText,
  Settings,
  Layout,
  Brush,
  Users
} from "lucide-react";
import { useLanguage } from '../hooks/use-language';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';

export default function ToolsDashboard() {
  const { t } = useLanguage();
  
  const tools = [
    {
      id: "ai-assistant",
      title: t('navigation.aiAssistant'),
      description: "Get intelligent recommendations and analysis for your projects",
      icon: <BotIcon className="h-12 w-12 text-primary" />,
      link: "/ai-assistant",
      color: "bg-gradient-to-br from-green-500/10 to-teal-500/10",
      borderColor: "border-green-200 dark:border-green-800",
      actions: [
        {
          label: "Open AI Assistant",
          link: "/ai-assistant"
        }
      ]
    },
    {
      id: "vendor-form",
      title: t('navigation.vendorForm'),
      description: "Create professional vendor estimate forms with dynamic fields",
      icon: <ClipboardCheckIcon className="h-12 w-12 text-primary" />,
      link: "/vendor-estimate-form-new",
      color: "bg-gradient-to-br from-amber-500/10 to-orange-500/10",
      borderColor: "border-amber-200 dark:border-amber-800",
      actions: [
        {
          label: "Create Vendor Form",
          link: "/vendor-estimate-form-new"
        }
      ]
    },
    {
      id: "agent-management",
      title: "Agent Management",
      description: "Manage field agents, schedule appointments, and track agent availability",
      icon: <Users className="h-12 w-12 text-primary" />,
      link: "/agents",
      color: "bg-gradient-to-br from-blue-500/10 to-indigo-500/10",
      borderColor: "border-blue-200 dark:border-blue-800",
      actions: [
        {
          label: "Manage Agents",
          link: "/agents"
        }
      ]
    },
    {
      id: "page-review",
      title: "Page Review",
      description: "Review and manage all pages in the application to identify which ones to keep or delete",
      icon: <FileText className="h-12 w-12 text-primary" />,
      link: "/page-review",
      color: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-200 dark:border-purple-800",
      actions: [
        {
          label: "Review Pages",
          link: "/page-review"
        }
      ]
    }
  ];

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <div className="remodra-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Tools & Customization</h1>
              <p className="text-muted-foreground">Customize your Remodra experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {tools.map((tool) => (
                <Card 
                  key={tool.id} 
                  className={`border ${tool.borderColor} ${tool.color} overflow-hidden transition-all hover:shadow-md`}
                >
                  <CardHeader className="pb-2">
                    <div className="mb-4">
                      {tool.icon}
                    </div>
                    <CardTitle className="card-title">{tool.title}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex flex-col items-stretch gap-2 pt-2">
                    {tool.actions.map((action, i) => (
                      <Link key={i} href={action.link} className="w-full">
                        <Button variant="default" className="w-full justify-between">
                          {action.label}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    ))}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Recent Templates section removed as requested */}
          </div>
        </div>
      </div>
    </div>
  );
}