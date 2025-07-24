import { db } from "./index";
import { service_pricing } from "../shared/schema-sqlite";
import { eq } from "drizzle-orm";

async function seedServices() {
  try {
    console.log("🌱 Seeding basic remodeling services...");
    
    const now = Date.now();
    
    // Get all contractors
    const contractors = await db.query.contractors.findMany();
    
    if (contractors.length === 0) {
      console.log("No contractors found. Please run the main seed script first.");
      return;
    }
    
    console.log(`Found ${contractors.length} contractors. Adding services for each...`);
    
    for (const contractor of contractors) {
      console.log(`Adding services for contractor: ${contractor.first_name} ${contractor.last_name} (ID: ${contractor.id})`);
      
      // Check if contractor already has services
      const existingServices = await db.query.service_pricing.findMany({
        where: (service_pricing, { eq }) => eq(service_pricing.contractor_id, contractor.id)
      });
      
      if (existingServices.length > 0) {
        console.log(`Contractor ${contractor.id} already has ${existingServices.length} services. Skipping...`);
        continue;
      }
      
      // Basic remodeling services with realistic pricing
      const services = [
        {
          contractor_id: contractor.id,
          name: "Fence Installation",
          service_type: "fence",
          labor_rate: 25.00, // $25 per linear foot
          unit: "ft",
          labor_calculation_method: "by_length",
          created_at: now,
          updated_at: now
        },
        {
          contractor_id: contractor.id,
          name: "Roof Replacement",
          service_type: "roof",
          labor_rate: 8.50, // $8.50 per square foot
          unit: "sqft",
          labor_calculation_method: "by_area",
          created_at: now,
          updated_at: now
        },
        {
          contractor_id: contractor.id,
          name: "Siding Installation",
          service_type: "siding",
          labor_rate: 12.00, // $12 per square foot
          unit: "sqft",
          labor_calculation_method: "by_area",
          created_at: now,
          updated_at: now
        },
        {
          contractor_id: contractor.id,
          name: "Deck Construction",
          service_type: "deck",
          labor_rate: 15.00, // $15 per square foot
          unit: "sqft",
          labor_calculation_method: "by_area",
          created_at: now,
          updated_at: now
        },
        {
          contractor_id: contractor.id,
          name: "Window Replacement",
          service_type: "windows",
          labor_rate: 150.00, // $150 per window
          unit: "unit",
          labor_calculation_method: "fixed",
          created_at: now,
          updated_at: now
        },
        {
          contractor_id: contractor.id,
          name: "Gutter Installation",
          service_type: "gutters",
          labor_rate: 8.00, // $8 per linear foot
          unit: "ft",
          labor_calculation_method: "by_length",
          created_at: now,
          updated_at: now
        },
        {
          contractor_id: contractor.id,
          name: "Bathroom Remodel",
          service_type: "bathroom",
          labor_rate: 75.00, // $75 per square foot
          unit: "sqft",
          labor_calculation_method: "by_area",
          created_at: now,
          updated_at: now
        },
        {
          contractor_id: contractor.id,
          name: "Kitchen Remodel",
          service_type: "kitchen",
          labor_rate: 85.00, // $85 per square foot
          unit: "sqft",
          labor_calculation_method: "by_area",
          created_at: now,
          updated_at: now
        },
        {
          contractor_id: contractor.id,
          name: "Basement Finishing",
          service_type: "basement",
          labor_rate: 45.00, // $45 per square foot
          unit: "sqft",
          labor_calculation_method: "by_area",
          created_at: now,
          updated_at: now
        },
        {
          contractor_id: contractor.id,
          name: "Patio Construction",
          service_type: "patio",
          labor_rate: 18.00, // $18 per square foot
          unit: "sqft",
          labor_calculation_method: "by_area",
          created_at: now,
          updated_at: now
        }
      ];
      
      // Insert services for this contractor
      const insertedServices = await db.insert(service_pricing).values(services).returning();
      
      console.log(`✅ Added ${insertedServices.length} services for contractor ${contractor.id}`);
    }
    
    console.log("🎉 Service seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding services:", error);
  }
}

// Run the seed function
seedServices().then(() => {
  console.log("Service seeding process finished.");
  process.exit(0);
}).catch((error) => {
  console.error("Service seeding failed:", error);
  process.exit(1);
}); 