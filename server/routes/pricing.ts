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

  // Get all services with pricing for the contractor
  app.get('/api/pricing/services', verifyContractorOwnership, async (req: any, res) => {
    try {
      const services = await db
        .select()
        .from(servicePricing)
        .where(eq(servicePricing.contractorId, req.user.id));
      
      // Format the response to match what the frontend expects
      const formattedServices = services.map(service => ({
        id: service.serviceType,
        name: service.name,
        serviceType: service.serviceType,
        unit: service.unit,
        laborRate: service.laborRate,
        laborMethod: service.laborCalculationMethod
      }));
      
      // If no services configured, return default data that matches our schema
      if (formattedServices.length === 0) {
        // Default services with English names
        const defaultServices = [
          {
            id: 'fence',
            name: 'Fence Installation',
            serviceType: 'fence',
            unit: 'ft',
            laborRate: 40,
            laborMethod: 'by_length',
          },
          {
            id: 'roof',
            name: 'Roof Installation',
            serviceType: 'roof',
            unit: 'sqft',
            laborRate: 3.5,
            laborMethod: 'by_area',
          },
          {
            id: 'gutters',
            name: 'Gutter Installation',
            serviceType: 'gutters',
            unit: 'ft',
            laborRate: 7,
            laborMethod: 'by_length',
          },
          {
            id: 'windows',
            name: 'Window Installation',
            serviceType: 'windows',
            unit: 'unit',
            laborRate: 75,
            laborMethod: 'fixed',
          },
          {
            id: 'deck',
            name: 'Deck Construction',
            serviceType: 'deck',
            unit: 'sqft',
            laborRate: 12,
            laborMethod: 'by_area',
          }
        ];
        
        return res.json(defaultServices);
      }
      
      res.json(formattedServices);
    } catch (error) {
      console.error('Error getting services:', error);
      res.status(500).json({ message: 'Error getting services' });
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

  // Update an existing service
  app.put('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log(`Updating service with ID: ${id}`, req.body);
      
      // Look for the service by serviceType
      const [existingService] = await db
        .select()
        .from(servicePricing)
        .where(
          and(
            eq(servicePricing.serviceType, id),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      // Prepare update data with simplified schema
      const updateData = { 
        name: req.body.name,
        serviceType: id,
        unit: req.body.unit,
        laborRate: typeof req.body.laborRate === 'string' ? parseFloat(req.body.laborRate) : (req.body.laborRate || 0),
        laborCalculationMethod: req.body.laborMethod || 'by_length',
        contractorId: req.user.id,
        updatedAt: new Date()
      };
      
      console.log("Update data prepared:", updateData);
      
      if (existingService) {
        // If service exists, update it
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
        
        // Format response to match what frontend expects
        const formattedService = {
          id: updatedService.serviceType,
          name: updatedService.name,
          serviceType: updatedService.serviceType,
          unit: updatedService.unit,
          laborRate: updatedService.laborRate,
          laborMethod: updatedService.laborCalculationMethod
        };
        
        console.log("Service updated successfully:", formattedService);
        res.json(formattedService);
      } else {
        // If service doesn't exist, create a new one
        // Ensure all data is properly formatted for creation
        const newData = {
          name: updateData.name,
          serviceType: updateData.serviceType,
          unit: updateData.unit,
          laborRate: typeof updateData.laborRate === 'string' ? parseFloat(updateData.laborRate) : updateData.laborRate,
          laborCalculationMethod: updateData.laborCalculationMethod,
          contractorId: updateData.contractorId,
          updatedAt: updateData.updatedAt,
          createdAt: new Date()
        };
        
        console.log("Creating new service with data:", newData);
        
        const [newService] = await db
          .insert(servicePricing)
          .values(newData)
          .returning();
        
        // Format response to match what frontend expects
        const formattedService = {
          id: newService.serviceType,
          name: newService.name,
          serviceType: newService.serviceType,
          unit: newService.unit,
          laborRate: newService.laborRate,
          laborMethod: newService.laborCalculationMethod
        };
        
        console.log("New service created:", formattedService);
        res.status(201).json(formattedService);
      }
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ 
        message: 'Error updating service',
        error: error.message || 'Unknown error'
      });
    }
  });

  // Delete a service
  app.delete('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log(`Deleting service with ID/serviceType: ${id}`);
      
      // Verify the service belongs to the contractor (using serviceType instead of numeric id)
      const [existingService] = await db
        .select()
        .from(servicePricing)
        .where(
          and(
            eq(servicePricing.serviceType, id),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      if (!existingService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      console.log(`Found service to delete:`, existingService);
      
      // Delete using the service's primary key id from the database
      const result = await db
        .delete(servicePricing)
        .where(
          and(
            eq(servicePricing.serviceType, id),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      console.log(`Service ${id} deleted successfully with result:`, result);
      res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ message: 'Error deleting service' });
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