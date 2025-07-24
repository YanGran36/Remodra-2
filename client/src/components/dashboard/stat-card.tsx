import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  iconColor?: string;
  trend?: string;
  className?: string;
  variant?: 'default' | 'premium' | 'success' | 'warning' | 'error';
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-primary-600',
  trend,
  className = "",
  variant = 'default'
}: StatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'premium':
        return {
          card: 'card-luxury bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-950 dark:to-secondary-900 border-secondary-200 dark:border-secondary-800',
          icon: 'text-secondary-600 dark:text-secondary-400',
          value: 'text-secondary-900 dark:text-secondary-100',
          title: 'text-secondary-700 dark:text-secondary-300'
        };
      case 'success':
        return {
          card: 'card-luxury bg-gradient-to-br from-success-50 to-success-100 dark:from-success-950 dark:to-success-900 border-success-200 dark:border-success-800',
          icon: 'text-success-600 dark:text-success-400',
          value: 'text-success-900 dark:text-success-100',
          title: 'text-success-700 dark:text-success-300'
        };
      case 'warning':
        return {
          card: 'card-luxury bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-950 dark:to-warning-900 border-warning-200 dark:border-warning-800',
          icon: 'text-warning-600 dark:text-warning-400',
          value: 'text-warning-900 dark:text-warning-100',
          title: 'text-warning-700 dark:text-warning-300'
        };
      case 'error':
        return {
          card: 'card-luxury bg-gradient-to-br from-error-50 to-error-100 dark:from-error-950 dark:to-error-900 border-error-200 dark:border-error-800',
          icon: 'text-error-600 dark:text-error-400',
          value: 'text-error-900 dark:text-error-100',
          title: 'text-error-700 dark:text-error-300'
        };
      default:
        return {
          card: 'card-luxury bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 border-primary-200 dark:border-primary-800',
          icon: 'text-primary-600 dark:text-primary-400',
          value: 'text-primary-900 dark:text-primary-100',
          title: 'text-primary-700 dark:text-primary-300'
        };
    }
  };

  const styles = getVariantStyles();

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return '↗';
      case 'negative':
        return '↘';
      default:
        return '→';
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-success-600 dark:text-success-400';
      case 'negative':
        return 'text-error-600 dark:text-error-400';
      default:
        return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  return (
    <Card className={`${styles.card} ${className} group hover:shadow-luxury-lg transition-all duration-500`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Icon */}
          {Icon && (
            <div className={`p-3 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm ${styles.icon} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          
          {/* Change Badge */}
          {change && (
            <Badge className={`badge-luxury text-xs px-2 py-1 ${getChangeColor()} bg-white/50 dark:bg-black/20 backdrop-blur-sm`}>
              <span className="mr-1">{getChangeIcon()}</span>
              {change}
            </Badge>
          )}
        </div>

        {/* Value */}
        <div className="mt-4">
          <div className={`text-2xl font-semibold ${styles.value} group-hover:scale-105 transition-transform duration-300`}>
            {value}
          </div>
          
          {/* Title */}
          <p className={`text-sm font-medium mt-1 ${styles.title}`}>
            {title}
          </p>
        </div>

        {/* Trend */}
        {trend && (
          <div className="mt-3 pt-3 border-t border-white/20 dark:border-black/20">
            <p className={`text-xs ${styles.title}`}>
              {trend}
            </p>
          </div>
        )}

        {/* Shimmer Effect on Hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="shimmer"></div>
        </div>
      </CardContent>
    </Card>
  );
}
