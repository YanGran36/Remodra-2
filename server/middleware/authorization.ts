import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { clients, projects, estimates, invoices, events, materials, propertyMeasurements } from "../../shared/schema";

// Tipos de entidades que protegeremos
export type EntityType = 'client' | 'project' | 'estimate' | 'invoice' | 'event' | 'material' | 'property-measurement';

// Middleware para verificar que la entidad pertenezca al contratista autenticado
export const verifyResourceOwnership = (entityType: EntityType, idParamName = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Si no hay usuario autenticado, devolver 401
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const contractorId = req.user.id;
      const entityId = Number(req.params[idParamName]);

      // Si no hay ID válido, continuar al siguiente middleware
      if (!entityId || isNaN(entityId)) {
        return res.status(400).json({ message: `ID inválido: ${req.params[idParamName]}` });
      }

      // Verificar la propiedad basada en el tipo de entidad
      let belongsToContractor = false;

      switch (entityType) {
        case 'client':
          const client = await db.query.clients.findFirst({
            where: and(
              eq(clients.id, entityId),
              eq(clients.contractorId, contractorId)
            )
          });
          belongsToContractor = !!client;
          break;

        case 'project':
          const project = await db.query.projects.findFirst({
            where: and(
              eq(projects.id, entityId),
              eq(projects.contractorId, contractorId)
            )
          });
          belongsToContractor = !!project;
          break;

        case 'estimate':
          const estimate = await db.query.estimates.findFirst({
            where: and(
              eq(estimates.id, entityId),
              eq(estimates.contractorId, contractorId)
            )
          });
          belongsToContractor = !!estimate;
          break;

        case 'invoice':
          const invoice = await db.query.invoices.findFirst({
            where: and(
              eq(invoices.id, entityId),
              eq(invoices.contractorId, contractorId)
            )
          });
          belongsToContractor = !!invoice;
          break;

        case 'event':
          const event = await db.query.events.findFirst({
            where: and(
              eq(events.id, entityId),
              eq(events.contractorId, contractorId)
            )
          });
          belongsToContractor = !!event;
          break;

        case 'material':
          const material = await db.query.materials.findFirst({
            where: and(
              eq(materials.id, entityId),
              eq(materials.contractorId, contractorId)
            )
          });
          belongsToContractor = !!material;
          break;

        case 'property-measurement':
          const measurement = await db.query.propertyMeasurements.findFirst({
            where: and(
              eq(propertyMeasurements.id, entityId),
              eq(propertyMeasurements.contractorId, contractorId)
            )
          });
          belongsToContractor = !!measurement;
          break;

        default:
          return res.status(500).json({ message: "Tipo de entidad no soportado" });
      }

      if (!belongsToContractor) {
        console.warn(`Intento de acceso no autorizado: El contratista ${contractorId} intentó acceder a ${entityType} con ID ${entityId}`);
        return res.status(403).json({ 
          message: "No tienes permisos para acceder a este recurso" 
        });
      }

      // Si todo está bien, continuar
      next();
    } catch (error) {
      console.error(`Error en middleware de autorización: ${error}`);
      res.status(500).json({ 
        message: "Error de autorización", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
};

// Middleware para verificar relaciones entre entidades
// Por ejemplo, verificar que un estimate pertenezca a un proyecto específico
export const verifyRelationship = (
  parentEntityType: EntityType, 
  childEntityType: EntityType,
  parentIdParamName = 'parentId',
  childIdParamName = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const contractorId = req.user.id;
      const parentId = Number(req.params[parentIdParamName]);
      const childId = Number(req.params[childIdParamName]);

      if (!parentId || isNaN(parentId) || !childId || isNaN(childId)) {
        return res.status(400).json({ message: "IDs inválidos" });
      }

      let validRelationship = false;

      // Verificar relación basada en los tipos de entidades
      switch (`${parentEntityType}-${childEntityType}`) {
        case 'client-project':
          const project = await db.query.projects.findFirst({
            where: and(
              eq(projects.id, childId),
              eq(projects.clientId, parentId),
              eq(projects.contractorId, contractorId)
            )
          });
          validRelationship = !!project;
          break;

        case 'project-estimate':
          const estimate = await db.query.estimates.findFirst({
            where: and(
              eq(estimates.id, childId),
              eq(estimates.projectId, parentId),
              eq(estimates.contractorId, contractorId)
            )
          });
          validRelationship = !!estimate;
          break;

        // Agregar más casos según sea necesario

        default:
          return res.status(500).json({ message: "Relación no soportada" });
      }

      if (!validRelationship) {
        console.warn(`Relación inválida: ${parentEntityType}(${parentId}) -> ${childEntityType}(${childId}) para contratista ${contractorId}`);
        return res.status(403).json({ 
          message: "El recurso solicitado no tiene la relación especificada" 
        });
      }

      next();
    } catch (error) {
      console.error(`Error verificando relación entre entidades: ${error}`);
      res.status(500).json({ 
        message: "Error verificando relación entre entidades", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
};

// Middleware para limitar operaciones en cascada
// Por ejemplo, impedir que se elimine un cliente con proyectos activos
export const preventCascadeOperations = (entityType: EntityType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const contractorId = req.user.id;
      const entityId = Number(req.params.id);

      if (!entityId || isNaN(entityId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      // Solo implementamos caso para clientes por ahora
      if (entityType === 'client') {
        // Verificar si el cliente tiene proyectos asociados
        const clientProjects = await db.query.projects.findMany({
          where: and(
            eq(projects.clientId, entityId),
            eq(projects.contractorId, contractorId)
          )
        });

        if (clientProjects.length > 0) {
          return res.status(400).json({ 
            message: "No se puede eliminar un cliente con proyectos asociados", 
            projectCount: clientProjects.length 
          });
        }
      }

      next();
    } catch (error) {
      console.error(`Error verificando operaciones en cascada: ${error}`);
      res.status(500).json({ 
        message: "Error verificando dependencias", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
};