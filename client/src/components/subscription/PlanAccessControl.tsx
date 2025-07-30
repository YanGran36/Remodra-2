import React from 'react';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Lock, Crown, Zap, Users } from 'lucide-react';
import { Link } from 'wouter';

interface PlanAccessControlProps {
  requiredPlan: 'basic' | 'pro' | 'business';
  children: React.ReactNode;
  featureName: string;
  fallback?: React.ReactNode;
}

export function PlanAccessControl({ requiredPlan, children, featureName, fallback }: PlanAccessControlProps) {
  const { user } = useAuth();
  const currentPlan = user?.plan || 'basic';

  const planHierarchy = {
    basic: 1,
    pro: 2,
    business: 3
  };

  const hasAccess = planHierarchy[currentPlan as keyof typeof planHierarchy] >= planHierarchy[requiredPlan];

  const getPlanInfo = (plan: string) => {
    const plans = {
      basic: { name: 'Basic Plan', price: 29, icon: Users, color: 'bg-blue-500' },
      pro: { name: 'Pro Plan', price: 59, icon: Zap, color: 'bg-green-500' },
      business: { name: 'Business Plan', price: 99, icon: Crown, color: 'bg-purple-500' }
    };
    return plans[plan as keyof typeof plans];
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const requiredPlanInfo = getPlanInfo(requiredPlan);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
          <Lock className="h-8 w-8 text-slate-400" />
        </div>
        <CardTitle className="text-xl font-bold text-slate-200">
          Feature Locked
        </CardTitle>
        <p className="text-slate-400">
          {featureName} requires {requiredPlanInfo.name}
        </p>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Badge className={`${requiredPlanInfo.color} text-white`}>
            {requiredPlanInfo.name}
          </Badge>
          <span className="text-slate-300">${requiredPlanInfo.price}/month</span>
        </div>
        
        <div className="space-y-2">
          <Link href="/auth">
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">
              Upgrade Now
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" className="w-full">
              View All Plans
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function usePlanAccess() {
  const { user } = useAuth();
  const currentPlan = user?.plan || 'basic';

  const planHierarchy = {
    basic: 1,
    pro: 2,
    business: 3
  };

  const hasAccess = (requiredPlan: 'basic' | 'pro' | 'business') => {
    return planHierarchy[currentPlan as keyof typeof planHierarchy] >= planHierarchy[requiredPlan];
  };

  const getPlanFeatures = () => {
    const features = {
      basic: ['dashboard', 'calendar', 'estimates', 'invoices'],
      pro: ['dashboard', 'calendar', 'estimates', 'invoices', 'projects', 'ai-assistant'],
      business: ['dashboard', 'calendar', 'estimates', 'invoices', 'projects', 'ai-assistant', 'clients', 'materials', 'timeclock', 'agents', 'tools']
    };
    return features[currentPlan as keyof typeof features] || features.basic;
  };

  return {
    currentPlan,
    hasAccess,
    getPlanFeatures,
    isBasic: currentPlan === 'basic',
    isPro: currentPlan === 'pro',
    isBusiness: currentPlan === 'business'
  };
} 