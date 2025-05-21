import { Express } from 'express';
import { db } from '@db';
import { servicePricing } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

export function registerDirectServiceRoutes(app: Express) {
  // Middleware para verificar autenticación
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    next();
  };

  // Endpoint simplificado para crear o actualizar un servicio
  app.put('/api/pricing/direct-service', isAuthenticated, async (req: any, res) => {
    try {
      const { id, name, serviceType, unit, laborRate, laborMethod } = req.body;
      
      // Convertir a número
      const numericLaborRate = typeof laborRate === 'string' 
        ? parseFloat(laborRate) 
        : (laborRate || 0);
      
      console.log(`Processing service: ID=${id}, Type=${serviceType}, Rate=${numericLaborRate}`);
      
      // Buscar si ya existe
      const [existingService] = await db
        .select()
        .from(servicePricing)
        .where(
          and(
            eq(servicePricing.serviceType, serviceType),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      let result;
      
      if (existingService) {
        // Actualizar servicio existente
        console.log(`Updating existing service ${existingService.id}`);
        
        [result] = await db
          .update(servicePricing)
          .set({
            name,
            unit,
            laborRate: numericLaborRate,
            laborCalculationMethod: laborMethod,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(servicePricing.serviceType, serviceType),
              eq(servicePricing.contractorId, req.user.id)
            )
          )
          .returning();
      } else {
        // Crear nuevo servicio
        console.log('Creating new service');
        
        [result] = await db
          .insert(servicePricing)
          .values({
            name,
            serviceType,
            unit,
            laborRate: numericLaborRate,
            laborCalculationMethod: laborMethod,
            contractorId: req.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
      }
      
      console.log('Operation result:', result);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error processing service:', error);
      res.status(500).json({ 
        message: 'Error processing service', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}