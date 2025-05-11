import { useState, useEffect } from "react";
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
  MenuIcon,
  X,
  ClipboardCheckIcon,
  BarChart,
  Building,
  HardDrive
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";


export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
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

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebarElement = document.getElementById("mobile-sidebar");
      const toggleButton = document.getElementById("mobile-sidebar-toggle");
      
      if (
        sidebarElement && 
        !sidebarElement.contains(event.target as Node) && 
        toggleButton && 
        !toggleButton.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close sidebar when route changes
  useEffect(() => {
    closeSidebar();
  }, [location]);

  return (
    <>
      {/* Mobile menu toggle button */}
      <div className="absolute top-0 left-0 md:hidden p-4 z-30">
        <Button
          id="mobile-sidebar-toggle"
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={toggleSidebar}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
      />

      {/* Mobile sidebar */}
      <aside 
        id="mobile-sidebar"
        className={`fixed left-0 top-0 bottom-0 w-64 bg-sidebar-background text-sidebar-foreground z-30 transform transition-transform duration-200 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center">
            <div className="bg-primary rounded-md p-2 mr-3">
              <BuildingIcon className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold">ContractorHub</h1>
          </div>
          <Button
            variant="ghost" 
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={closeSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
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
            <Link href="/admin-dashboard" className={getLinkClass("/admin-dashboard")}>
              <BarChart className="mr-3 h-5 w-5" />
              <span>Panel Administrador</span>
            </Link>
            <Link href="/admin-architectural" className={getLinkClass("/admin-architectural")}>
              <HardDrive className="mr-3 h-5 w-5" />
              <span>Panel Arquitectónico</span>
            </Link>
            <Link href="/super-admin" className={getLinkClass("/super-admin")}>
              <Building className="mr-3 h-5 w-5" />
              <span>Panel Super Admin</span>
            </Link>
            <Link href="/settings" className={getLinkClass("/settings")}>
              <SettingsIcon className="mr-3 h-5 w-5" />
              <span>{t('navigation.settings')}</span>
            </Link>
          </nav>
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
    </>
  );
}
