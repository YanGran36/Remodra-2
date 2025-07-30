import { db } from '../db';
import { subscriptionPlans } from '../shared/schema';
import { eq } from 'drizzle-orm';

export async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...');

  const plans = [
    {
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

  try {
    for (const plan of plans) {
      // Check if plan already exists
      const existingPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.planName, plan.planName)
      });

      if (existingPlan) {
        // Update existing plan
        await db.update(subscriptionPlans)
          .set({
            displayName: plan.displayName,
            priceMonthly: plan.priceMonthly,
            clientLimit: plan.clientLimit,
            aiUsageLimit: plan.aiUsageLimit,
            hasTimeClockAccess: plan.hasTimeClockAccess,
            hasStripeIntegration: plan.hasStripeIntegration,
            hasCustomPortal: plan.hasCustomPortal,
            hasBrandedPortal: plan.hasBrandedPortal,
            features: plan.features,
            isActive: plan.isActive
          })
          .where(eq(subscriptionPlans.planName, plan.planName));
        
        console.log(`✅ Updated plan: ${plan.planName}`);
      } else {
        // Insert new plan
        await db.insert(subscriptionPlans).values({
          ...plan,
          createdAt: new Date()
        });
        
        console.log(`✅ Created plan: ${plan.planName}`);
      }
    }

    console.log('🎉 Subscription plans seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSubscriptionPlans()
    .then(() => {
      console.log('Subscription plans seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Subscription plans seeding failed:', error);
      process.exit(1);
    });
} 