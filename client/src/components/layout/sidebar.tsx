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
  LogOut,
  Calculator,
  Lock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { LanguageSwitcher } from '../language-switcher';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import RemodraLogo from '../remodra-logo';
import { Badge } from '../ui/badge';

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

  // Define plan-based access control
  const getPlanAccess = () => {
    const plan = user?.plan || 'basic';
    
    const planAccess = {
      basic: {
        features: ['dashboard', 'calendar', 'estimates', 'invoices'],
        name: 'Basic Plan',
        color: 'bg-blue-500'
      },
      pro: {
        features: ['dashboard', 'calendar', 'estimates', 'invoices', 'projects', 'ai-assistant'],
        name: 'Pro Plan',
        color: 'bg-green-500'
      },
      business: {
        features: ['dashboard', 'calendar', 'estimates', 'invoices', 'projects', 'ai-assistant', 'clients', 'materials', 'timeclock', 'agents', 'tools'],
        name: 'Business Plan',
        color: 'bg-purple-500'
      }
    };
    
    return planAccess[plan as keyof typeof planAccess] || planAccess.basic;
  };

  const planAccess = getPlanAccess();

  const allNavigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon, feature: 'dashboard' },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon, feature: 'calendar' },
    { name: 'Clients', href: '/clients', icon: UsersIcon, feature: 'clients' },
    { name: 'Estimates', href: '/estimates', icon: FileTextIcon, feature: 'estimates' },
    { name: 'Invoices', href: '/invoices', icon: BanknoteIcon, feature: 'invoices' },
    { name: 'Projects', href: '/projects', icon: HammerIcon, feature: 'projects' },
    { name: 'Materials', href: '/materials', icon: Drill, feature: 'materials' },
    { name: 'Services', href: '/simple-pricing', icon: Settings, feature: 'services' },
    { name: 'Time Clock', href: '/timeclock', icon: Clock, feature: 'timeclock' },
    { name: 'Agents', href: '/agents', icon: Calculator, feature: 'agents' },
    { name: 'AI Assistant', href: '/ai-assistant', icon: BotIcon, feature: 'ai-assistant' },
    { name: 'Tools', href: '/tools', icon: Palette, feature: 'tools' },
    { name: 'Settings', href: '/settings', icon: SettingsIcon, feature: 'settings' },
  ];

  // Filter navigation items based on plan access
  const navigationItems = allNavigationItems.filter(item => 
    planAccess.features.includes(item.feature)
  );

  // Get locked features for upgrade prompts
  const lockedFeatures = allNavigationItems.filter(item => 
    !planAccess.features.includes(item.feature)
  );

  return (
    <div className="remodra-sidebar block flex flex-col">
      {/* Logo - Fixed Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-slate-600 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <RemodraLogo size={32} />
          <span className="text-xl font-bold text-amber-400">Remodra</span>
        </div>
      </div>



      {/* Navigation - Scrollable */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-h-0">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`remodra-nav-item flex items-center space-x-3 px-3 py-2 text-slate-300 rounded-lg transition-all duration-300 hover:text-amber-400 hover:bg-slate-700/50 ${isActive ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-900 font-semibold' : ''}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* Locked Features Section */}
        {lockedFeatures.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-slate-400 mb-2">Upgrade to Unlock</h3>
              {lockedFeatures.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center space-x-3 px-3 py-2 text-slate-500 rounded-lg cursor-not-allowed"
                >
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User Profile - Fixed Footer */}
      <div className="flex-shrink-0 p-4 border-t border-slate-600">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-amber-500 text-slate-900 text-sm font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-start">
            <Badge className={`${planAccess.color} text-white text-xs`}>
              {planAccess.name}
            </Badge>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-400/10"
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
