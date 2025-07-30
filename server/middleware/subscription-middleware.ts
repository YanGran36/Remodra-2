import { Request, Response, NextFunction } from 'express';
import { SubscriptionService, UsageLimits } from '../services/subscription-service';

declare global {
  namespace Express {
    interface Request {
      subscriptionLimits?: UsageLimits;
      contractor?: any;
    }
  }
}

// Middleware to check subscription access for specific features
export const requireSubscriptionFeature = (feature: 'timeclock' | 'stripe' | 'custom_portal' | 'branded_portal') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const actionMap = {
        timeclock: 'use_timeclock',
        stripe: 'use_stripe',
        custom_portal: 'use_custom_portal',
        branded_portal: 'use_branded_portal'
      } as const;

      const action = actionMap[feature];
      const result = await SubscriptionService.checkActionAllowed(req.user.id, action);

      if (!result.allowed) {
        return res.status(403).json({
          error: result.reason,
          message: result.message,
          upgradeRequired: true,
          currentPlan: req.user.plan
        });
      }

      req.subscriptionLimits = result.limits;
      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      res.status(500).json({ error: 'Subscription verification failed' });
    }
  };
};

// Middleware to check client limit before creating new clients
export const checkClientLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await SubscriptionService.checkActionAllowed(req.user.id, 'create_client');

    if (!result.allowed) {
      return res.status(403).json({
        error: result.reason,
        message: result.message,
        upgradeRequired: true,
        currentPlan: req.user.plan
      });
    }

    req.subscriptionLimits = result.limits;
    next();
  } catch (error) {
    console.error('Client limit check error:', error);
    res.status(500).json({ error: 'Client limit verification failed' });
  }
};

// Middleware to check AI usage limit
export const checkAiUsageLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await SubscriptionService.checkActionAllowed(req.user.id, 'use_ai');

    if (!result.allowed) {
      return res.status(403).json({
        error: result.reason,
        message: result.message,
        upgradeRequired: true,
        currentPlan: req.user.plan
      });
    }

    req.subscriptionLimits = result.limits;
    next();
  } catch (error) {
    console.error('AI usage limit check error:', error);
    res.status(500).json({ error: 'AI usage verification failed' });
  }
};

// Middleware to add subscription info to request
export const addSubscriptionInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return next();
    }

    const subscription = await SubscriptionService.getContractorSubscription(req.user.id);
    const limits = subscription ? await SubscriptionService.getPlanLimits(subscription.plan) : null;

    req.contractor = {
      ...req.user,
      subscription,
      limits
    };

    next();
  } catch (error) {
    console.error('Error adding subscription info:', error);
    next(); // Continue even if subscription info fails
  }
};

// Middleware to check if subscription is active
export const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await SubscriptionService.getContractorSubscription(req.user.id);
    
    if (!subscription) {
      return res.status(403).json({ error: 'No subscription found' });
    }

    if (subscription.subscriptionStatus !== 'active') {
      return res.status(403).json({
        error: 'Subscription not active',
        message: 'Please update your subscription to continue.',
        subscriptionStatus: subscription.subscriptionStatus
      });
    }

    next();
  } catch (error) {
    console.error('Active subscription check error:', error);
    res.status(500).json({ error: 'Subscription verification failed' });
  }
}; 