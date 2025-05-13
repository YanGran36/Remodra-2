import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BotIcon, 
  Palette, 
  ClipboardCheckIcon, 
  ArrowRight,
  PaintBucket,
  FileText,
  Settings,
  Layout,
  Brush
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function ToolsDashboard() {
  const { t } = useLanguage();
  
  const tools = [
    {
      id: "pdf-templates",
      title: "PDF Templates",
      description: "Customize document appearance with colors, fonts, and content options",
      icon: <Palette className="h-12 w-12 text-primary" />,
      link: "/pdf-template-gallery",
      color: "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
      borderColor: "border-blue-200 dark:border-blue-800",
      actions: [
        {
          label: "Browse Templates",
          link: "/pdf-template-gallery"
        },
        {
          label: "Modern Editor",
          link: "/pdf-template-luxury"
        },
        {
          label: "Classic Editor",
          link: "/pdf-template"
        }
      ]
    },
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
    }
  ];

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold">Tools & Customization</h1>
        <p className="text-muted-foreground">
          Customize documents and use AI-powered tools to enhance your workflow
        </p>
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
              <CardTitle className="text-xl">{tool.title}</CardTitle>
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

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Default Estimate Template</CardTitle>
              <CardDescription>Last modified: {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-xs text-muted-foreground">Primary Color</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Standard Layout</span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/pdf-templates" className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  Edit Template
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-500/5 to-teal-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Default Invoice Template</CardTitle>
              <CardDescription>Last modified: {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">Primary Color</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Standard Layout</span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/pdf-templates" className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  Edit Template
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Browse Template Gallery</CardTitle>
              <CardDescription>Explore professional designs</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <Brush className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Professional Designs</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Layout className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Multiple Layouts</span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/pdf-template-gallery" className="w-full">
                <Button variant="default" size="sm" className="w-full">
                  View Gallery
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}