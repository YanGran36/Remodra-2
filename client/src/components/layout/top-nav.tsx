import { Link, useLocation } from "wouter";
import { Bell, Settings, Search, User, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { LanguageSwitcher } from "../language-switcher";
import { useAuth } from "../../hooks/use-auth";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/clients", label: "Clients" },
  { href: "/estimates", label: "Estimates" },
  { href: "/invoices", label: "Invoices" },
  { href: "/projects", label: "Projects" },
  { href: "/materials", label: "Materials" },
  { href: "/timeclock", label: "Time Clock" },
  { href: "/ai-assistant", label: "AI Assistant" },
  { href: "/tools", label: "Tools" },
  { href: "/settings", label: "Settings" },
];

export default function TopNav() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const getInitials = () => {
    if (!user) return "";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="remodra-topnav">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="flex-1 max-w-lg mx-4 lg:mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search..."
              className="remodra-input pl-10"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-amber-400 relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"></span>
          </Button>

          {/* Language Switcher */}
          <LanguageSwitcher variant="ghost" showText={false} size="sm" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.firstName} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-900 font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-600 w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-slate-200">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-slate-400">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 