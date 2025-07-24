import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { Contractor } from "../shared/schema";

declare global {
  namespace Express {
    interface User extends Contractor {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "contractor-hub-secret",
    // Configuración mejorada para manejo de sesiones
    resave: false, // Only save if session was modified
    saveUninitialized: false, // Don't save uninitialized sessions
    rolling: true, // Extend session on each request
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      path: "/", // Ensure cookie is available across all paths
    },
    name: "connect.sid" // Explicit session cookie name
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getContractorByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getContractor(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { firstName, lastName, companyName, username, email, password } = req.body;

      const existingUser = await storage.getContractorByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const hashedPassword = await hashPassword(password);
      const now = Date.now(); // Use Unix timestamp for SQLite
      
      // Map camelCase to snake_case for SQLite
      const user = await storage.createContractor({
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        username,
        email,
        password: hashedPassword,
        language: "en",
        role: "contractor",
        plan: "basic",
        subscription_status: "active",
        current_client_count: 0,
        ai_usage_this_month: 0,
        ai_usage_reset_date: now,
        settings: "{}",
        created_at: now,
        updated_at: now
      });

      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: Error | null, user: Express.User | false, info: { message?: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      // Subscription enforcement
      if (user.subscriptionStatus !== 'active') {
        return res.status(403).json({ message: "Your subscription is not active. Please update your payment or contact support." });
      }
      if (user.planEndDate && Date.now() > Number(user.planEndDate)) {
        return res.status(403).json({ message: "Your subscription has expired. Please renew to continue." });
      }
      req.login(user, (err: Error | null) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    res.json(req.user);
  });

  // Middleware to check if user is authenticated
  app.use("/api/protected/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  });
}
