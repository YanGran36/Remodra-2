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
      
      // Buscar el servicio por serviceType en lugar de ID numérico
      const [existingService] = await db
        .select()
        .from(servicePricing)
        .where(
          and(
            eq(servicePricing.serviceType, id),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      const updateData = { 
        ...req.body,
        contractorId: req.user.id,
        serviceType: id,
        updatedAt: new Date()
      };
      
      if (existingService) {
        // Si existe, actualizar
        const [updatedService] = await db
          .update(servicePricing)
          .set(updateData)
          .where(
            and(
              eq(servicePricing.serviceType, id),
              eq(servicePricing.contractorId, req.user.id)
            )
          )
          .returning();
        
        res.json(updatedService);
      } else {
        // Si no existe, crear uno nuevo
        const newData = {
          ...updateData,
          createdAt: new Date()
        };
        
        const [newService] = await db
          .insert(servicePricing)
          .values(newData)
          .returning();
        
        res.status(201).json(newService);
      }
    } catch (error) {
      console.error('Error al actualizar servicio:', error);
      // Mostrar más detalles del error para depuración
      res.status(500).json({ 
        message: 'Error al actualizar servicio',
        error: error.message || 'Error desconocido',
        details: JSON.stringify(error)
      });
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
        // Datos iniciales para materiales comunes con los IDs exactos que se usan en los estimados
        const defaultMaterials = [
          // Materiales para cercas (fence)
          {
            id: 'wood_fence',
            name: 'Wood Fence',
            description: 'Madera tratada para construcción de cercas',
            category: 'fence',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Lumber Yard',
            status: 'active'
          },
          {
            id: 'vinyl_fence',
            name: 'Vinyl Fence',
            description: 'Cercas de vinilo duraderas',
            category: 'fence',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Modern Materials',
            status: 'active'
          },
          {
            id: 'chain_link',
            name: 'Chain Link Fence',
            description: 'Cercas de malla ciclónica',
            category: 'fence',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Metal Supply Co.',
            status: 'active'
          },
          {
            id: 'aluminum_fence',
            name: 'Aluminum Fence',
            description: 'Cercas de aluminio elegantes',
            category: 'fence',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Metal Supply Co.',
            status: 'active'
          },
          {
            id: 'fence_gate',
            name: 'Fence Gate',
            description: 'Puertas para cercas residenciales',
            category: 'fence',
            unitPrice: 0,
            unit: 'unit',
            supplier: 'Hardware Supply',
            status: 'active'
          },
          {
            id: 'post_caps',
            name: 'Post Caps',
            description: 'Tapas decorativas para postes',
            category: 'fence',
            unitPrice: 0,
            unit: 'unit',
            supplier: 'Hardware Supply',
            status: 'active'
          },
          
          // Materiales para techos (roof)
          {
            id: 'asphalt_shingles',
            name: 'Asphalt Shingles',
            description: 'Tejas asfálticas estándar',
            category: 'roof',
            unitPrice: 0,
            unit: 'sq.ft',
            supplier: 'Roofing Supply',
            status: 'active'
          },
          {
            id: 'metal_roofing',
            name: 'Metal Roofing',
            description: 'Láminas de metal para techos',
            category: 'roof',
            unitPrice: 0,
            unit: 'sq.ft',
            supplier: 'Metal Supply Co.',
            status: 'active'
          },
          {
            id: 'tile_roofing',
            name: 'Tile Roofing',
            description: 'Tejas de cerámica para techos',
            category: 'roof',
            unitPrice: 0,
            unit: 'sq.ft',
            supplier: 'Premium Materials',
            status: 'active'
          },
          
          // Materiales para canaletas (gutters)
          {
            id: 'aluminum_gutters',
            name: 'Aluminum Gutters',
            description: 'Canaletas de aluminio de 5 pulgadas',
            category: 'gutters',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Gutter Supply',
            status: 'active'
          },
          {
            id: 'vinyl_gutters',
            name: 'Vinyl Gutters',
            description: 'Canaletas de vinilo resistentes',
            category: 'gutters',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Modern Materials',
            status: 'active'
          },
          {
            id: 'downspouts',
            name: 'Downspouts',
            description: 'Tubos de bajada para canaletas',
            category: 'gutters',
            unitPrice: 0,
            unit: 'unit',
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
      
      // Buscar material exactamente por el ID que se pasa
      const materials = await db
        .select()
        .from(materialPricing)
        .where(eq(materialPricing.contractorId, req.user.id));
      
      // Primero buscar por ID exacto entre code, materialId o idString
      let existingMaterial = materials.find(m => 
        m.code === id || 
        (m.materialId && m.materialId === id) || 
        (m.idString && m.idString === id)
      );
      
      // Si no lo encontramos así, buscar por nombre
      if (!existingMaterial) {
        existingMaterial = materials.find(m => 
          m.name === req.body.name || 
          (m.category === req.body.category && m.name?.toLowerCase().includes(id.toLowerCase()))
        );
      }
      
      // Preparar los datos de actualización con los campos correctos
      const updateData = { 
        ...req.body,
        contractorId: req.user.id,
        category: req.body.category,
        // Asegurarse de guardar el ID original para poder identificarlo luego
        code: id,
        materialId: id,
        idString: id,
        updatedAt: new Date()
      };
      
      console.log(`Material a actualizar/crear: ${id}`, updateData);
      
      if (existingMaterial) {
        // Si existe, actualizar
        const [updatedMaterial] = await db
          .update(materialPricing)
          .set(updateData)
          .where(eq(materialPricing.id, existingMaterial.id))
          .returning();
        
        console.log('Material actualizado exitosamente en la base de datos');
        res.json(updatedMaterial);
      } else {
        // Si no existe, crear uno nuevo
        const newData = {
          ...updateData,
          createdAt: new Date()
        };
        
        const [newMaterial] = await db
          .insert(materialPricing)
          .values(newData)
          .returning();
        
        res.status(201).json(newMaterial);
      }
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