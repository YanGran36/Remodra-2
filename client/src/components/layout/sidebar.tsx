import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Link, useLocation } from "wouter";
import { 
  BuildingIcon, 
  LayoutDashboardIcon, 
  CalendarIcon, 
  UsersIcon, 
  FileTextIcon, 
  BanknoteIcon, 
  HammerIcon, 
  Drill, 
  BotIcon, 
  SettingsIcon, 
  LogOutIcon,
  ClipboardCheckIcon,
  Globe
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Separator } from "@/components/ui/separator";


export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActivePath = (path: string) => {
    return location === path;
  };

  const getLinkClass = (path: string) => {
    return `flex items-center px-4 py-3 ${
      isActivePath(path) 
        ? "bg-sidebar-accent text-sidebar-foreground" 
        : "text-gray-300 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    }`;
  };

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
  };

  return (
    <aside className="bg-sidebar-background text-sidebar-foreground w-64 flex-shrink-0 hidden md:flex flex-col h-screen">
      <div className="p-4 flex items-center border-b border-sidebar-border">
        <div className="bg-primary rounded-md p-2 mr-3">
          <BuildingIcon className="text-white h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">ContractorHub</h1>
      </div>
      
      <div className="py-2 flex-1 overflow-y-auto">
        <nav>
          <Link href="/" className={getLinkClass("/")}>
            <LayoutDashboardIcon className="mr-3 h-5 w-5" />
            <span>{t('navigation.dashboard')}</span>
          </Link>
          <Link href="/calendar" className={getLinkClass("/calendar")}>
            <CalendarIcon className="mr-3 h-5 w-5" />
            <span>{t('navigation.calendar')}</span>
          </Link>
          <Link href="/clients" className={getLinkClass("/clients")}>
            <UsersIcon className="mr-3 h-5 w-5" />
            <span>{t('navigation.clients')}</span>
          </Link>
          <Link href="/estimates" className={getLinkClass("/estimates")}>
            <FileTextIcon className="mr-3 h-5 w-5" />
            <span>{t('navigation.estimates')}</span>
          </Link>
          <Link href="/invoices" className={getLinkClass("/invoices")}>
            <BanknoteIcon className="mr-3 h-5 w-5" />
            <span>{t('navigation.invoices')}</span>
          </Link>
          <Link href="/projects" className={getLinkClass("/projects")}>
            <HammerIcon className="mr-3 h-5 w-5" />
            <span>{t('navigation.projects')}</span>
          </Link>
          <Link href="/materials" className={getLinkClass("/materials")}>
            <Drill className="mr-3 h-5 w-5" />
            <span>{t('navigation.materials')}</span>
          </Link>
          <Link href="/ai-assistant" className={getLinkClass("/ai-assistant")}>
            <BotIcon className="mr-3 h-5 w-5" />
            <span>{t('navigation.aiAssistant')}</span>
          </Link>
          <Link href="/vendor-estimate-form-new" className={getLinkClass("/vendor-estimate-form-new")}>
            <ClipboardCheckIcon className="mr-3 h-5 w-5" />
            <span>{t('navigation.vendorForm')}</span>
          </Link>
          {/* Enlace a Google Sheets eliminado */}
          <Link href="/settings" className={getLinkClass("/settings")}>
            <SettingsIcon className="mr-3 h-5 w-5" />
            <span>{t('navigation.settings')}</span>
          </Link>
        </nav>
      </div>
      
      {/* Language Switcher Section */}
      <div className="border-t border-sidebar-border">
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="mr-2 h-4 w-4 text-gray-400" />
              <span className="text-sm">{t('settings.language')}</span>
            </div>
            <LanguageSwitcher variant="ghost" showText={false} size="sm" />
          </div>
        </div>
      </div>
      
      <div className="mt-auto border-t border-sidebar-border">
        {/* User Info and Logout */}
        <div className="p-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src="" alt={user?.firstName} />
              <AvatarFallback className="bg-primary">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <button 
              className="ml-auto text-gray-400 hover:text-white"
              onClick={handleLogout}
              aria-label={t('navigation.logout')}
            >
              <LogOutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
