import { useState, useEffect } from "react";
import { useAuth } from '../../hooks/use-auth';
import { useLanguage } from '../../hooks/use-language';
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
  Palette,
  Settings
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';


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
        ? "bg-gradient-to-r from-amber-400/20 to-yellow-600/20 text-amber-400 border border-amber-400/30 shadow-lg backdrop-blur-sm" 
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
      <div className="fixed top-4 left-4 lg:hidden z-50">
        <Button
          id="mobile-sidebar-toggle"
          variant="ghost"
          size="icon"
          className="bg-slate-800/90 backdrop-blur-md border border-slate-600 text-slate-300 hover:text-amber-400 hover:bg-slate-700/90 focus:outline-none shadow-lg rounded-xl"
          onClick={toggleSidebar}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar overlay */}
      <div 
        className={`remodra-mobile-overlay transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
      />

      {/* Mobile sidebar */}
      <aside 
        id="mobile-sidebar"
        className={`remodra-mobile-sidebar ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-600 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
          <div className="flex items-center">
            <img 
              src="/remodra-logo.png" 
              alt="Remodra Logo" 
              className="h-8 w-8 object-contain mr-4"
            />
            <span className="text-xl font-bold text-amber-400">Remodra</span>
          </div>
          <Button
            variant="ghost" 
            size="icon"
            className="text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded-lg"
            onClick={closeSidebar}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="py-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          <nav className="space-y-1">
            <Link href="/" className={getLinkClass("/")}>
              <LayoutDashboardIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link href="/calendar" className={getLinkClass("/calendar")}>
              <CalendarIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Calendar</span>
            </Link>
            <Link href="/clients" className={getLinkClass("/clients")}>
              <UsersIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Clients</span>
            </Link>
            <Link href="/estimates" className={getLinkClass("/estimates")}>
              <FileTextIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Estimates</span>
            </Link>
            <Link href="/invoices" className={getLinkClass("/invoices")}>
              <BanknoteIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Invoices</span>
            </Link>
            <Link href="/projects" className={getLinkClass("/projects")}>
              <HammerIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Projects</span>
            </Link>
            <Link href="/materials" className={getLinkClass("/materials")}>
              <Drill className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Materials</span>
            </Link>

            <Link href="/timeclock" className={getLinkClass("/timeclock")}>
              <Clock className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Time Clock</span>
            </Link>
            
            {/* Tools section with divider for better organization */}
            <div className="mt-6 mb-3 px-4">
              <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mt-3 mb-2">
                Tools & Settings
              </div>
            </div>
            
            <Link href="/ai-assistant" className={getLinkClass("/ai-assistant")}>
              <BotIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">AI Assistant</span>
            </Link>
            <Link href="/tools" className={getLinkClass("/tools")}>
              <Palette className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Tools</span>
            </Link>
            <Link href="/vendor-estimate-form-new" className={getLinkClass("/vendor-estimate-form-new")}>
              <ClipboardCheckIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Vendor Form</span>
            </Link>
            <Link href="/settings" className={getLinkClass("/settings")}>
              <SettingsIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Settings</span>
            </Link>
          </nav>
        </div>
        
        <div className="mt-auto border-t border-slate-600 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
          {/* User Info and Logout */}
          <div className="p-4">
            <div className="flex items-center">
              <Avatar className="h-12 w-12 mr-3 ring-2 ring-amber-400/30 shadow-lg">
                <AvatarImage src="" alt={user?.firstName} />
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-900 font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-200 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button 
                className="ml-2 p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-all duration-200 hover:scale-110"
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
