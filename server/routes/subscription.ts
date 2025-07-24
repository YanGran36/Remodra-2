import { Router } from "express";
import { db } from "../../db";
import { contractors, subscription_plans } from "../../shared/schema-sqlite";
import { eq } from "drizzle-orm";

const router = Router();

// Get available subscription plans
router.get("/plans", async (req, res) => {
  try {
    const plans = await db
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.is_active, true));
    
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

    const contractor = await db
      .select()
      .from(contractors)
      .where(eq(contractors.id, req.user.id))
      .limit(1);

    if (contractor.length === 0) {
      return res.status(404).json({ error: "Contractor not found" });
    }

    const user = contractor[0];
    
    res.json({
      plan: user.plan,
      subscriptionStatus: user.subscription_status,
      planStartDate: user.plan_start_date,
      planEndDate: user.plan_end_date,
      currentClientCount: user.current_client_count,
      aiUsageThisMonth: user.ai_usage_this_month,
      aiUsageResetDate: user.ai_usage_reset_date
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
});

// Update subscription status (for webhook handling)
router.post("/update-status", async (req, res) => {
  try {
    const { contractorId, status, plan, endDate } = req.body;

    if (!contractorId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [updated] = await db
      .update(contractors)
      .set({
        subscription_status: status,
        plan: plan || "basic",
        plan_end_date: endDate ? Date.now() + (endDate * 24 * 60 * 60 * 1000) : null,
        updated_at: Date.now()
      })
      .where(eq(contractors.id, contractorId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating subscription status:", error);
    res.status(500).json({ error: "Failed to update subscription status" });
  }
});

// Check if user can perform action based on subscription
router.post("/check-limit", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { action, resource } = req.body;

    const contractor = await db
      .select()
      .from(contractors)
      .where(eq(contractors.id, req.user.id))
      .limit(1);

    if (contractor.length === 0) {
      return res.status(404).json({ error: "Contractor not found" });
    }

    const user = contractor[0];

    // Check subscription status
    if (user.subscription_status !== "active") {
      return res.json({
        allowed: false,
        reason: "Subscription not active",
        message: "Please update your subscription to continue."
      });
    }

    // Check plan limits based on action
    let allowed = true;
    let reason = "";
    let message = "";

    switch (action) {
      case "create_client":
        const clientLimit = user.plan === "premium" ? 1000 : user.plan === "professional" ? 500 : 50;
        if (user.current_client_count >= clientLimit) {
          allowed = false;
          reason = "Client limit reached";
          message = `You've reached your client limit (${clientLimit}). Please upgrade your plan.`;
        }
        break;
      
      case "use_ai":
        const aiLimit = user.plan === "premium" ? 1000 : user.plan === "professional" ? 500 : 100;
        if (user.ai_usage_this_month >= aiLimit) {
          allowed = false;
          reason = "AI usage limit reached";
          message = `You've reached your AI usage limit (${aiLimit} requests/month). Please upgrade your plan.`;
        }
        break;
      
      case "create_project":
        const projectLimit = user.plan === "premium" ? 1000 : user.plan === "professional" ? 500 : 100;
        // This would need a project count field in the database
        allowed = true;
        break;
      
      default:
        allowed = true;
    }

    res.json({
      allowed,
      reason,
      message,
      currentUsage: {
        clients: user.current_client_count,
        aiUsage: user.ai_usage_this_month
      }
    });
  } catch (error) {
    console.error("Error checking subscription limit:", error);
    res.status(500).json({ error: "Failed to check subscription limit" });
  }
});

export default router; 