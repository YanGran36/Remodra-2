import { Express, Request, Response } from "express";
import { db } from "@db";
import { timeclockEntries, timeclockEntryInsertSchema } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";

export function registerTimeclockRoutes(app: Express) {
  // Registrar Entrada (Clock In)
  app.post("/api/timeclock/clock-in", async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const contractorId = req.user.id;

      // Validar los datos recibidos
      const validatedData = timeclockEntryInsertSchema.parse({
        ...req.body,
        contractorId,
        type: "IN", // Fijar tipo como entrada
      });

      // Insertar en base de datos
      const [entry] = await db
        .insert(timeclockEntries)
        .values(validatedData)
        .returning();

      return res.status(201).json(entry);
    } catch (error) {
      console.error("Error al registrar entrada:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Registrar Salida (Clock Out)
  app.post("/api/timeclock/clock-out", async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const contractorId = req.user.id;

      // Validar los datos recibidos
      const validatedData = timeclockEntryInsertSchema.parse({
        ...req.body,
        contractorId,
        type: "OUT", // Fijar tipo como salida
      });

      // Insertar en base de datos
      const [entry] = await db
        .insert(timeclockEntries)
        .values(validatedData)
        .returning();

      return res.status(201).json(entry);
    } catch (error) {
      console.error("Error al registrar salida:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener registros recientes (últimos 10)
  app.get("/api/timeclock/recent", async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const contractorId = req.user.id;

      // Obtener los últimos 10 registros
      const entries = await db
        .select()
        .from(timeclockEntries)
        .where(eq(timeclockEntries.contractorId, contractorId))
        .orderBy(desc(timeclockEntries.timestamp))
        .limit(10);

      return res.status(200).json(entries);
    } catch (error) {
      console.error("Error al obtener registros recientes:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener todos los registros (paginados)
  app.get("/api/timeclock/entries", async (req: Request, res: Response) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const contractorId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;

      // Obtener los registros paginados
      const entries = await db
        .select()
        .from(timeclockEntries)
        .where(eq(timeclockEntries.contractorId, contractorId))
        .orderBy(desc(timeclockEntries.timestamp))
        .limit(pageSize)
        .offset(offset);

      // Obtener el total de registros para la paginación
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(timeclockEntries)
        .where(eq(timeclockEntries.contractorId, contractorId));

      return res.status(200).json({
        entries,
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      });
    } catch (error) {
      console.error("Error al obtener registros:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}