import { Express } from 'express';
import { db } from '../../db';
import { servicePricing, materialPricing } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Registra las rutas para la gestión de precios centralizados
 */
export function registerPricingRoutes(app: Express) {
  // Verificar que el contratista tiene acceso a sus propios datos
  const verifyContractorOwnership = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // El usuario autenticado ya incluye el ID del contratista
    next();
  };

  // SERVICIOS
  // =========

  // Obtener todos los servicios con precios del contratista
  app.get('/api/pricing/services', verifyContractorOwnership, async (req: any, res) => {
    try {
      const services = await db
        .select()
        .from(servicePricing)
        .where(eq(servicePricing.contractorId, req.user.id));
      
      // Si no hay servicios configurados, devolver datos predeterminados
      if (services.length === 0) {
        // Datos iniciales para servicios comunes
        const defaultServices = [
          {
            id: 'fence',
            name: 'Instalación de Cerca',
            serviceType: 'fence',
            description: 'Instalación de cercas residenciales',
            unitPrice: 57,
            unit: 'ft',
            laborRate: 35,
            laborCalculationMethod: 'by_length',
            status: 'active'
          },
          {
            id: 'roof',
            name: 'Instalación de Techo',
            serviceType: 'roof',
            description: 'Instalación de techos residenciales',
            unitPrice: 8.7,
            unit: 'sqft',
            laborRate: 3.5,
            laborCalculationMethod: 'by_area',
            status: 'active'
          },
          {
            id: 'gutters',
            name: 'Instalación de Canaletas',
            serviceType: 'gutters',
            description: 'Instalación de canaletas',
            unitPrice: 12,
            unit: 'ft',
            laborRate: 7,
            laborCalculationMethod: 'by_length',
            status: 'active'
          },
          {
            id: 'windows',
            name: 'Instalación de Ventanas',
            serviceType: 'windows',
            description: 'Instalación de ventanas',
            unitPrice: 45,
            unit: 'unit',
            laborRate: 85,
            laborCalculationMethod: 'fixed',
            status: 'active'
          },
          {
            id: 'deck',
            name: 'Instalación de Deck',
            serviceType: 'deck',
            description: 'Instalación de cubiertas exteriores',
            unitPrice: 35,
            unit: 'sqft',
            laborRate: 15,
            laborCalculationMethod: 'by_area',
            status: 'active'
          }
        ];
        
        return res.json(defaultServices);
      }
      
      res.json(services);
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      res.status(500).json({ message: 'Error al obtener servicios' });
    }
  });

  // Obtener un servicio específico
  app.get('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const [service] = await db
        .select()
        .from(servicePricing)
        .where(
          and(
            eq(servicePricing.id, parseInt(id)),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      if (!service) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('Error al obtener servicio:', error);
      res.status(500).json({ message: 'Error al obtener servicio' });
    }
  });

  // Crear un nuevo servicio
  app.post('/api/pricing/services', verifyContractorOwnership, async (req: any, res) => {
    try {
      const serviceData = { 
        ...req.body,
        contractorId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [newService] = await db.insert(servicePricing).values(serviceData).returning();
      
      res.status(201).json(newService);
    } catch (error) {
      console.error('Error al crear servicio:', error);
      res.status(500).json({ message: 'Error al crear servicio' });
    }
  });

  // Actualizar un servicio existente
  app.put('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el servicio pertenece al contratista
      const [existingService] = await db
        .select()
        .from(servicePricing)
        .where(eq(servicePricing.id, parseInt(id)))
        .where(eq(servicePricing.contractorId, req.user.id));
      
      if (!existingService) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }
      
      const updateData = { 
        ...req.body,
        updatedAt: new Date()
      };
      
      const [updatedService] = await db
        .update(servicePricing)
        .set(updateData)
        .where(eq(servicePricing.id, parseInt(id)))
        .returning();
      
      res.json(updatedService);
    } catch (error) {
      console.error('Error al actualizar servicio:', error);
      res.status(500).json({ message: 'Error al actualizar servicio' });
    }
  });

  // Eliminar un servicio
  app.delete('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el servicio pertenece al contratista
      const [existingService] = await db
        .select()
        .from(servicePricing)
        .where(eq(servicePricing.id, parseInt(id)))
        .where(eq(servicePricing.contractorId, req.user.id));
      
      if (!existingService) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }
      
      await db
        .delete(servicePricing)
        .where(eq(servicePricing.id, parseInt(id)));
      
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      res.status(500).json({ message: 'Error al eliminar servicio' });
    }
  });

  // MATERIALES
  // ==========

  // Obtener todos los materiales con precios del contratista
  app.get('/api/pricing/materials', verifyContractorOwnership, async (req: any, res) => {
    try {
      const materials = await db
        .select()
        .from(materialPricing)
        .where(eq(materialPricing.contractorId, req.user.id));
      
      // Si no hay materiales configurados, devolver datos predeterminados
      if (materials.length === 0) {
        // Datos iniciales para materiales comunes
        const defaultMaterials = [
          {
            id: 'fence-wood',
            name: 'Madera para Cerca',
            description: 'Madera tratada para construcción de cercas',
            category: 'fence',
            unitPrice: 22,
            unit: 'ft',
            supplier: 'Lumber Yard',
            status: 'active'
          },
          {
            id: 'fence-metal',
            name: 'Postes Metálicos',
            description: 'Postes metálicos para soporte de cercas',
            category: 'fence',
            unitPrice: 35,
            unit: 'unit',
            supplier: 'Metal Supply Co.',
            status: 'active'
          },
          {
            id: 'roofing-shingles',
            name: 'Tejas Asfálticas',
            description: 'Tejas asfálticas estándar',
            category: 'roof',
            unitPrice: 5.2,
            unit: 'sqft',
            supplier: 'Roofing Supply',
            status: 'active'
          },
          {
            id: 'gutters-aluminum',
            name: 'Canaletas de Aluminio',
            description: 'Canaletas de aluminio de 5 pulgadas',
            category: 'gutters',
            unitPrice: 5,
            unit: 'ft',
            supplier: 'Gutter Supply',
            status: 'active'
          }
        ];
        
        return res.json(defaultMaterials);
      }
      
      res.json(materials);
    } catch (error) {
      console.error('Error al obtener materiales:', error);
      res.status(500).json({ message: 'Error al obtener materiales' });
    }
  });

  // Obtener un material específico
  app.get('/api/pricing/materials/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const [material] = await db
        .select()
        .from(materialPricing)
        .where(eq(materialPricing.id, parseInt(id)))
        .where(eq(materialPricing.contractorId, req.user.id));
      
      if (!material) {
        return res.status(404).json({ message: 'Material no encontrado' });
      }
      
      res.json(material);
    } catch (error) {
      console.error('Error al obtener material:', error);
      res.status(500).json({ message: 'Error al obtener material' });
    }
  });

  // Crear un nuevo material
  app.post('/api/pricing/materials', verifyContractorOwnership, async (req: any, res) => {
    try {
      const materialData = { 
        ...req.body,
        contractorId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [newMaterial] = await db.insert(materialPricing).values(materialData).returning();
      
      res.status(201).json(newMaterial);
    } catch (error) {
      console.error('Error al crear material:', error);
      res.status(500).json({ message: 'Error al crear material' });
    }
  });

  // Actualizar un material existente
  app.put('/api/pricing/materials/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el material pertenece al contratista
      const [existingMaterial] = await db
        .select()
        .from(materialPricing)
        .where(eq(materialPricing.id, parseInt(id)))
        .where(eq(materialPricing.contractorId, req.user.id));
      
      if (!existingMaterial) {
        return res.status(404).json({ message: 'Material no encontrado' });
      }
      
      const updateData = { 
        ...req.body,
        updatedAt: new Date()
      };
      
      const [updatedMaterial] = await db
        .update(materialPricing)
        .set(updateData)
        .where(eq(materialPricing.id, parseInt(id)))
        .returning();
      
      res.json(updatedMaterial);
    } catch (error) {
      console.error('Error al actualizar material:', error);
      res.status(500).json({ message: 'Error al actualizar material' });
    }
  });

  // Eliminar un material
  app.delete('/api/pricing/materials/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el material pertenece al contratista
      const [existingMaterial] = await db
        .select()
        .from(materialPricing)
        .where(eq(materialPricing.id, parseInt(id)))
        .where(eq(materialPricing.contractorId, req.user.id));
      
      if (!existingMaterial) {
        return res.status(404).json({ message: 'Material no encontrado' });
      }
      
      await db
        .delete(materialPricing)
        .where(eq(materialPricing.id, parseInt(id)));
      
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar material:', error);
      res.status(500).json({ message: 'Error al eliminar material' });
    }
  });
}