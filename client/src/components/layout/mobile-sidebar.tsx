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
  FileText,
  Building,
  HardDrive,
  Clock,
  Palette
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
    return `flex items-center px-4 py-3 mx-2 my-1 rounded-xl transition-all duration-300 ease-in-out group ${
      isActivePath(path) 
        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30 shadow-lg backdrop-blur-sm" 
        : "text-slate-300 hover:bg-white/10 hover:text-white hover:shadow-md hover:scale-105 hover:translate-x-1"
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
      <div className="fixed top-0 left-0 lg:hidden p-4 z-30">
        <Button
          id="mobile-sidebar-toggle"
          variant="ghost"
          size="icon"
          className="bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 hover:text-slate-900 hover:bg-white/20 focus:outline-none shadow-lg rounded-xl"
          onClick={toggleSidebar}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
      />

      {/* Mobile sidebar */}
      <aside 
        id="mobile-sidebar"
        className={`fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white z-30 transform transition-all duration-300 ease-in-out lg:hidden shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-3 mr-4 shadow-lg">
              <BuildingIcon className="text-white h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ContractorHub
            </h1>
          </div>
          <Button
            variant="ghost" 
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
            onClick={closeSidebar}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="py-2 flex-1 overflow-y-auto">
          <nav>
            <Link href="/" className={getLinkClass("/")}>
              <LayoutDashboardIcon className="mr-3 h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link href="/calendar" className={getLinkClass("/calendar")}>
              <CalendarIcon className="mr-3 h-5 w-5" />
              <span>Calendar</span>
            </Link>
            <Link href="/clients" className={getLinkClass("/clients")}>
              <UsersIcon className="mr-3 h-5 w-5" />
              <span>Clients</span>
            </Link>
            <Link href="/estimates" className={getLinkClass("/estimates")}>
              <FileTextIcon className="mr-3 h-5 w-5" />
              <span>Estimates</span>
            </Link>
            <Link href="/invoices" className={getLinkClass("/invoices")}>
              <BanknoteIcon className="mr-3 h-5 w-5" />
              <span>Invoices</span>
            </Link>
            <Link href="/projects" className={getLinkClass("/projects")}>
              <HammerIcon className="mr-3 h-5 w-5" />
              <span>Projects</span>
            </Link>
            <Link href="/materials" className={getLinkClass("/materials")}>
              <Drill className="mr-3 h-5 w-5" />
              <span>Materials</span>
            </Link>
            <Link href="/timeclock" className={getLinkClass("/timeclock")}>
              <Clock className="mr-3 h-5 w-5" />
              <span>Time Clock</span>
            </Link>
            
            {/* Tools section with divider for better organization */}
            <div className="mt-2 mb-2 px-3">
              <div className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
                Tools
              </div>
            </div>
            
            <Link href="/tools-dashboard" className={getLinkClass("/tools-dashboard")}>
              <FileText className="mr-3 h-5 w-5" />
              <span>Tools</span>
            </Link>
            <Link href="/ai-assistant" className={getLinkClass("/ai-assistant")}>
              <BotIcon className="mr-3 h-5 w-5" />
              <span>AI Assistant</span>
            </Link>
            <Link href="/vendor-estimate-form-new" className={getLinkClass("/vendor-estimate-form-new")}>
              <ClipboardCheckIcon className="mr-3 h-5 w-5" />
              <span>Vendor Form</span>
            </Link>
            <Link href="/admin-dashboard" className={getLinkClass("/admin-dashboard")}>
              <BarChart className="mr-3 h-5 w-5" />
              <span>Admin Dashboard</span>
            </Link>
            <Link href="/admin-architectural" className={getLinkClass("/admin-architectural")}>
              <HardDrive className="mr-3 h-5 w-5" />
              <span>Architectural Dashboard</span>
            </Link>
            <Link href="/super-admin" className={getLinkClass("/super-admin")}>
              <Building className="mr-3 h-5 w-5" />
              <span>Super Admin Dashboard</span>
            </Link>
            <Link href="/settings" className={getLinkClass("/settings")}>
              <SettingsIcon className="mr-3 h-5 w-5" />
              <span>Settings</span>
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
                aria-label="Logout"
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
