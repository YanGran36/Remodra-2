import { db } from "../db";
import { contractors } from "../shared/schema-sqlite";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedTestUser() {
  try {
    console.log("🌱 Seeding test user...");
    
    const hashedPassword = await hashPassword("test123");
    const now = new Date();
    
    const testUser = {
      email: "test@remodra.com",
      password: hashedPassword,
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      companyName: "Test Construction Co",
      phone: "555-123-4567",
      role: "contractor",
      plan: "basic",
      subscriptionStatus: "active",
      currentClientCount: 0,
      aiUsageThisMonth: 0,
      aiUsageResetDate: now,
      settings: "{}",
      language: "en",
      createdAt: now,
      updatedAt: now
    };

    // Check if user already exists
    const existingUser = await db.query.contractors.findFirst({
      where: eq(contractors.email, testUser.email)
    });

    if (existingUser) {
      console.log("✅ Test user already exists");
      return;
    }

    // Insert test user
    const [newUser] = await db.insert(contractors).values(testUser).returning();
    
    console.log("✅ Test user created successfully!");
    console.log("📧 Email: test@remodra.com");
    console.log("🔑 Password: test123");
    console.log("🏢 Company: Test Construction Co");
    
  } catch (error) {
    console.error("❌ Error seeding test user:", error);
  }
}

// Run the seed function
seedTestUser().then(() => {
  console.log("🎉 Seeding complete!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Seeding failed:", error);
  process.exit(1);
}); 