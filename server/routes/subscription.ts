import { Router } from "express";
import { SubscriptionService } from "../services/subscription-service";

const router = Router();

// Get available subscription plans
router.get("/plans", async (req, res) => {
  try {
    const plans = await SubscriptionService.getAllPlans();
    res.json(plans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
});

// Get user's current subscription status
router.get("/status", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const subscription = await SubscriptionService.getContractorSubscription(req.user.id);
    
    if (!subscription) {
      return res.status(404).json({ error: "Contractor not found" });
    }

    const limits = await SubscriptionService.getPlanLimits(subscription.plan);
    
    res.json({
      contractor: {
        id: subscription.contractorId,
        plan: subscription.plan,
        subscriptionStatus: subscription.subscriptionStatus,
        planStartDate: subscription.planStartDate,
        planEndDate: subscription.planEndDate,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId
      },
      plan: limits,
      usage: {
        currentClientCount: subscription.currentClientCount,
        maxClients: limits?.clientLimit,
        clientsRemaining: limits?.clientLimit === null ? 'unlimited' : Math.max(0, (limits?.clientLimit || 0) - subscription.currentClientCount),
        currentAiUsage: subscription.aiUsageThisMonth,
        maxAiUsage: limits?.aiUsageLimit,
        aiUsageRemaining: limits?.aiUsageLimit === null ? 'unlimited' : Math.max(0, (limits?.aiUsageLimit || 0) - subscription.aiUsageThisMonth)
      }
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
});

// Check if user can perform action based on subscription
router.post("/check-limit", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ error: "Action is required" });
    }

    const result = await SubscriptionService.checkActionAllowed(req.user.id, action);

    res.json({
      allowed: result.allowed,
      reason: result.reason,
      message: result.message,
      limits: result.limits
    });
  } catch (error) {
    console.error("Error checking subscription limit:", error);
    res.status(500).json({ error: "Failed to check subscription limit" });
  }
});

// Get usage statistics
router.get("/usage", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const usageStats = await SubscriptionService.getUsageStats(req.user.id);
    res.json(usageStats);
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    res.status(500).json({ error: "Failed to fetch usage statistics" });
  }
});

// Update subscription plan (admin only)
router.put("/update-plan", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { newPlan, stripeCustomerId, stripeSubscriptionId } = req.body;

    if (!newPlan) {
      return res.status(400).json({ error: "New plan is required" });
    }

    const success = await SubscriptionService.updateContractorPlan(
      req.user.id,
      newPlan,
      stripeCustomerId,
      stripeSubscriptionId
    );

    if (success) {
      res.json({ message: "Plan updated successfully" });
    } else {
      res.status(500).json({ error: "Failed to update plan" });
    }
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    res.status(500).json({ error: "Failed to update subscription plan" });
  }
});

export default router; 