import { db } from '../../db';
import { contractors, subscriptionPlans, clients, aiUsageLog } from '../../shared/schema';
import { eq, and, count, gte, desc } from 'drizzle-orm';

export interface SubscriptionPlan {
  id: number;
  planName: string;
  displayName: string;
  priceMonthly: string;
  clientLimit: number | null;
  aiUsageLimit: number | null;
  hasTimeClockAccess: boolean;
  hasStripeIntegration: boolean;
  hasCustomPortal: boolean;
  hasBrandedPortal: boolean;
  features: string[];
  isActive: boolean;
}

export interface ContractorSubscription {
  contractorId: number;
  plan: string;
  subscriptionStatus: string;
  planStartDate: Date | null;
  planEndDate: Date | null;
  currentClientCount: number;
  aiUsageThisMonth: number;
  aiUsageResetDate: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface UsageLimits {
  clientLimit: number | null;
  aiUsageLimit: number | null;
  hasTimeClockAccess: boolean;
  hasStripeIntegration: boolean;
  hasCustomPortal: boolean;
  hasBrandedPortal: boolean;
  hasAiCostAnalysis: boolean;
  planName: string;
}

export class SubscriptionService {
  // Standardized plan definitions
  private static readonly PLAN_DEFINITIONS: SubscriptionPlan[] = [
    {
      id: 1,
      planName: 'basic',
      displayName: 'Basic Plan',
      priceMonthly: '29.00',
      clientLimit: 10,
      aiUsageLimit: 0,
      hasTimeClockAccess: false,
      hasStripeIntegration: false,
      hasCustomPortal: false,
      hasBrandedPortal: false,
      features: ['Client Management', 'Basic Estimates', 'Project Tracking'],
      isActive: true
    },
    {
      id: 2,
      planName: 'pro',
      displayName: 'Pro Plan',
      priceMonthly: '59.00',
      clientLimit: 50,
      aiUsageLimit: 10,
      hasTimeClockAccess: true,
      hasStripeIntegration: false,
      hasCustomPortal: true,
      hasBrandedPortal: false,
      features: ['Everything in Basic', 'AI Cost Analysis', 'Time Clock', 'Advanced Reports'],
      isActive: true
    },
    {
      id: 3,
      planName: 'business',
      displayName: 'Business Plan',
      priceMonthly: '99.00',
      clientLimit: null, // unlimited
      aiUsageLimit: null, // unlimited
      hasTimeClockAccess: true,
      hasStripeIntegration: true,
      hasCustomPortal: true,
      hasBrandedPortal: true,
      features: ['Everything in Pro', 'Unlimited Clients', 'Unlimited AI', 'Stripe Integration', 'Branded Portal'],
      isActive: true
    }
  ];

  // Get all available subscription plans
  static async getAllPlans(): Promise<SubscriptionPlan[]> {
    try {
      // First try to get from database
      const dbPlans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
      
      if (dbPlans.length > 0) {
        return dbPlans.map((plan: any) => ({
          id: plan.id,
          planName: plan.planName,
          displayName: plan.displayName,
          priceMonthly: plan.priceMonthly.toString(),
          clientLimit: plan.clientLimit,
          aiUsageLimit: plan.aiUsageLimit,
          hasTimeClockAccess: plan.hasTimeClockAccess,
          hasStripeIntegration: plan.hasStripeIntegration,
          hasCustomPortal: plan.hasCustomPortal,
          hasBrandedPortal: plan.hasBrandedPortal,
          features: plan.features as string[],
          isActive: plan.isActive
        }));
      }

      // Fallback to hardcoded plans if database is empty
      return this.PLAN_DEFINITIONS;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return this.PLAN_DEFINITIONS;
    }
  }

  // Get contractor's subscription status
  static async getContractorSubscription(contractorId: number): Promise<ContractorSubscription | null> {
    try {
      const contractor = await db.query.contractors.findFirst({
        where: eq(contractors.id, contractorId)
      });

      if (!contractor) {
        return null;
      }

      // Get current client count
      const clientCountResult = await db.select({ count: count() })
        .from(clients)
        .where(eq(clients.contractorId, contractorId));

      const currentClientCount = clientCountResult[0]?.count || 0;

      // Get current month AI usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const aiUsageResult = await db.select({ count: count() })
        .from(aiUsageLog)
        .where(
          and(
            eq(aiUsageLog.contractorId, contractorId),
            gte(aiUsageLog.createdAt, startOfMonth)
          )
        );

      const aiUsageThisMonth = aiUsageResult[0]?.count || 0;

      return {
        contractorId: contractor.id,
        plan: contractor.plan || 'basic',
        subscriptionStatus: contractor.subscriptionStatus || 'active',
        planStartDate: contractor.planStartDate,
        planEndDate: contractor.planEndDate,
        currentClientCount,
        aiUsageThisMonth,
        aiUsageResetDate: contractor.aiUsageResetDate,
        stripeCustomerId: contractor.stripeCustomerId,
        stripeSubscriptionId: contractor.stripeSubscriptionId
      };
    } catch (error) {
      console.error('Error fetching contractor subscription:', error);
      return null;
    }
  }

  // Get plan limits for a specific plan
  static async getPlanLimits(planName: string): Promise<UsageLimits | null> {
    try {
      const plans = await this.getAllPlans();
      const plan = plans.find(p => p.planName === planName);
      
      if (!plan) {
        return null;
      }

      return {
        clientLimit: plan.clientLimit,
        aiUsageLimit: plan.aiUsageLimit,
        hasTimeClockAccess: plan.hasTimeClockAccess,
        hasStripeIntegration: plan.hasStripeIntegration,
        hasCustomPortal: plan.hasCustomPortal,
        hasBrandedPortal: plan.hasBrandedPortal,
        hasAiCostAnalysis: plan.aiUsageLimit !== null && plan.aiUsageLimit > 0,
        planName: plan.planName
      };
    } catch (error) {
      console.error('Error fetching plan limits:', error);
      return null;
    }
  }

  // Check if contractor can perform an action
  static async checkActionAllowed(
    contractorId: number, 
    action: 'create_client' | 'use_ai' | 'use_timeclock' | 'use_stripe' | 'use_custom_portal' | 'use_branded_portal'
  ): Promise<{ allowed: boolean; reason?: string; message?: string; limits?: UsageLimits }> {
    try {
      const subscription = await this.getContractorSubscription(contractorId);
      if (!subscription) {
        return { allowed: false, reason: 'Contractor not found' };
      }

      // Check subscription status
      if (subscription.subscriptionStatus !== 'active') {
        return {
          allowed: false,
          reason: 'Subscription not active',
          message: 'Please update your subscription to continue.'
        };
      }

      const limits = await this.getPlanLimits(subscription.plan);
      if (!limits) {
        return { allowed: false, reason: 'Plan not found' };
      }

      switch (action) {
        case 'create_client':
          if (limits.clientLimit !== null && subscription.currentClientCount >= limits.clientLimit) {
            return {
              allowed: false,
              reason: 'Client limit reached',
              message: `You've reached your client limit (${limits.clientLimit}). Please upgrade your plan.`,
              limits
            };
          }
          break;

        case 'use_ai':
          if (limits.aiUsageLimit !== null && subscription.aiUsageThisMonth >= limits.aiUsageLimit) {
            return {
              allowed: false,
              reason: 'AI usage limit reached',
              message: `You've reached your AI usage limit (${limits.aiUsageLimit} requests/month). Please upgrade your plan.`,
              limits
            };
          }
          break;

        case 'use_timeclock':
          if (!limits.hasTimeClockAccess) {
            return {
              allowed: false,
              reason: 'Time clock not available',
              message: 'Time clock functionality is not available in your current plan.',
              limits
            };
          }
          break;

        case 'use_stripe':
          if (!limits.hasStripeIntegration) {
            return {
              allowed: false,
              reason: 'Stripe integration not available',
              message: 'Stripe integration is not available in your current plan.',
              limits
            };
          }
          break;

        case 'use_custom_portal':
          if (!limits.hasCustomPortal) {
            return {
              allowed: false,
              reason: 'Custom portal not available',
              message: 'Custom client portal is not available in your current plan.',
              limits
            };
          }
          break;

        case 'use_branded_portal':
          if (!limits.hasBrandedPortal) {
            return {
              allowed: false,
              reason: 'Branded portal not available',
              message: 'Branded client portal is not available in your current plan.',
              limits
            };
          }
          break;
      }

      return { allowed: true, limits };
    } catch (error) {
      console.error('Error checking action allowance:', error);
      return { allowed: false, reason: 'System error' };
    }
  }

  // Log AI usage
  static async logAiUsage(
    contractorId: number,
    usageType: string,
    entityType?: string,
    entityId?: number,
    tokensUsed?: number,
    costUsd?: number,
    requestData?: any,
    responseData?: any
  ): Promise<boolean> {
    try {
      const usageMonth = new Date().toISOString().slice(0, 7); // Format: "2024-01"

      await db.insert(aiUsageLog).values({
        contractorId,
        usageType,
        entityType,
        entityId,
        tokensUsed,
        costUsd: costUsd?.toString(),
        requestData,
        responseData,
        usageMonth,
        createdAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error logging AI usage:', error);
      return false;
    }
  }

  // Update contractor's plan
  static async updateContractorPlan(
    contractorId: number,
    newPlan: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<boolean> {
    try {
      await db.update(contractors)
        .set({
          plan: newPlan,
          subscriptionStatus: 'active',
          planStartDate: new Date(),
          stripeCustomerId,
          stripeSubscriptionId,
          updatedAt: new Date()
        })
        .where(eq(contractors.id, contractorId));

      return true;
    } catch (error) {
      console.error('Error updating contractor plan:', error);
      return false;
    }
  }

  // Get usage statistics for a contractor
  static async getUsageStats(contractorId: number): Promise<{
    currentClientCount: number;
    aiUsageThisMonth: number;
    plan: string;
    limits: UsageLimits | null;
  }> {
    try {
      const subscription = await this.getContractorSubscription(contractorId);
      if (!subscription) {
        throw new Error('Contractor not found');
      }

      const limits = await this.getPlanLimits(subscription.plan);

      return {
        currentClientCount: subscription.currentClientCount,
        aiUsageThisMonth: subscription.aiUsageThisMonth,
        plan: subscription.plan,
        limits
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw error;
    }
  }
} 