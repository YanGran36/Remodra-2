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
  ClipboardCheckIcon,
  Globe,
  TrophyIcon,
  Clock,
  Palette,
  Settings,
  FileText,
  CreditCard,
  MessageSquare,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { LanguageSwitcher } from '../language-switcher';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';


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

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Clients', href: '/clients', icon: UsersIcon },
    { name: 'Estimates', href: '/estimates', icon: FileTextIcon },
    { name: 'Invoices', href: '/invoices', icon: BanknoteIcon },
    { name: 'Projects', href: '/projects', icon: HammerIcon },
    { name: 'Materials', href: '/materials', icon: Drill },
    { name: 'Time Clock', href: '/timeclock', icon: Clock },
    { name: 'AI Assistant', href: '/ai-assistant', icon: BotIcon },
    { name: 'Tools', href: '/tools', icon: Palette },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="remodra-sidebar hidden lg:block">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-slate-600">
        <div className="flex items-center space-x-3">
          <img 
            src="/remodra-logo.png" 
            alt="Remodra Logo" 
            className="h-8 w-8 object-contain"
          />
          <span className="text-xl font-bold text-amber-400">Remodra</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`remodra-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-600">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-slate-900">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-amber-400"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
