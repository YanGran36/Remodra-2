import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Bell, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/use-auth';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  children,
  showSearch = false,
  showNotifications = true,
  showUserMenu = true,
  className = ""
}: PageHeaderProps) {
  const { user } = useAuth();

  return (
    <div className={`relative ${className}`}>
      {/* Luxury Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-primary-950 dark:via-neutral-900 dark:to-secondary-950 opacity-50"></div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-pattern-grid opacity-5"></div>
      
      {/* Main Content */}
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 lg:p-8">
          {/* Title Section */}
          <div className="flex-1">
            <div className="flex items-center gap-4">
              {/* Title */}
              <div className="flex-1">
                <h1 className="text-2xl lg:text-2xl font-semibold text-foreground mb-2 tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-base text-muted-foreground font-normal leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  placeholder="Search..."
                  className="input-luxury pl-10 w-64 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm"
                />
              </div>
            )}

            {/* Children Content (like action buttons) */}
            {children && (
              <div className="flex items-center gap-2">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Luxury Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary-300 to-transparent dark:via-secondary-700"></div>
    </div>
  );
}
