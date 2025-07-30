import { Express } from 'express';
import { db } from '../../db';
import { service_pricing } from '../../shared/schema-sqlite';
import { eq, and } from 'drizzle-orm';

/**
 * Registra las rutas para la gestión de precios centralizados
 */
export function registerPricingRoutes(app: Express) {
  // Verificar que el contratista tiene acceso a sus propios datos
  const verifyContractorOwnership = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // El usuario autenticado ya incluye el ID del contratista
    next();
  };

  // SERVICIOS
  // =========

  // Get all services with pricing for the contractor - redirect to direct services API
  app.get('/api/pricing/services', async (req: any, res) => {
    try {
      // If user is authenticated, try to get their specific services
      if (req.isAuthenticated()) {
        const response = await fetch(`http://localhost:3001/api/direct/services`, {
          headers: {
            'Cookie': req.headers.cookie || ''
          }
        });
        
        if (response.ok) {
          const services = await response.json();
          console.log(`[PRICING-SERVICES] Found ${services.length} services for contractor ${req.user.id}`);
          return res.json(services);
        }
      }
      
      // If not authenticated or no services found, return default services
      const defaultServices = [
        { id: 1, name: 'Fence Installation', serviceType: 'fence', unit: 'ft', laborRate: 25, laborMethod: 'by_length' },
        { id: 2, name: 'Roof Replacement', serviceType: 'roof', unit: 'sqft', laborRate: 8.5, laborMethod: 'by_area' },
        { id: 3, name: 'Siding Installation', serviceType: 'siding', unit: 'sqft', laborRate: 12, laborMethod: 'by_area' },
        { id: 4, name: 'Deck Construction', serviceType: 'deck', unit: 'sqft', laborRate: 15, laborMethod: 'by_area' },
        { id: 5, name: 'Window Replacement', serviceType: 'windows', unit: 'unit', laborRate: 150, laborMethod: 'fixed' },
        { id: 6, name: 'Gutter Installation', serviceType: 'gutters', unit: 'ft', laborRate: 8, laborMethod: 'by_length' },
        { id: 7, name: 'Bathroom Remodel', serviceType: 'bathroom', unit: 'sqft', laborRate: 75, laborMethod: 'by_area' },
        { id: 8, name: 'Kitchen Remodel', serviceType: 'kitchen', unit: 'sqft', laborRate: 85, laborMethod: 'by_area' },
        { id: 9, name: 'Basement Finishing', serviceType: 'basement', unit: 'sqft', laborRate: 45, laborMethod: 'by_area' },
        { id: 10, name: 'Patio Construction', serviceType: 'patio', unit: 'sqft', laborRate: 18, laborMethod: 'by_area' }
      ];
      
      console.log(`[PRICING-SERVICES] Returning ${defaultServices.length} default services`);
      res.json(defaultServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: 'Error fetching services' });
    }
  });

  // Obtener un servicio específico
  app.get('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const [service] = await db
        .select()
        .from(service_pricing)
        .where(
          and(
            eq(service_pricing.service_type, id),
            eq(service_pricing.contractor_id, req.user.id)
          )
        );
      
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({ message: 'Error fetching service' });
    }
  });

  // Crear un nuevo servicio
  app.post('/api/pricing/services', verifyContractorOwnership, async (req: any, res) => {
    try {
      const serviceData = { 
        ...req.body,
        contractor_id: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [newService] = await db.insert(service_pricing).values(serviceData).returning();
      
      res.status(201).json(newService);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ message: 'Error creating service' });
    }
  });

  // Update or create a service
  app.put('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log(`Updating service with ID: ${id}`, req.body);
      
      // Convert laborRate to number with better error handling
      let laborRateValue = 0;
      if (req.body.laborRate !== undefined) {
        if (typeof req.body.laborRate === 'string') {
          laborRateValue = parseFloat(req.body.laborRate) || 0;
        } else if (typeof req.body.laborRate === 'number') {
          laborRateValue = req.body.laborRate;
        }
      }
      
      // Si estamos editando un servicio y cambiando su service_type
      const isEditing = req.body.originalServiceType && req.body.originalServiceType !== req.body.serviceType;
      const searchId = isEditing ? req.body.originalServiceType : id;
      
      console.log("Searching for service with ID:", searchId);
      
      // Buscar el servicio por el ID original
      const [existingService] = await db
        .select()
        .from(service_pricing)
        .where(
          and(
            eq(service_pricing.service_type, searchId),
            eq(service_pricing.contractor_id, req.user.id)
          )
        );
      
      console.log("Existing service found:", existingService ? "Yes" : "No");
      
      // Prepare data with safety defaults, asegurando concordancia con los campos de la tabla
      const serviceData = { 
        name: req.body.name || 'New Service',
        service_type: req.body.serviceType || id, // Usar el nuevo service_type si está siendo editado
        unit: req.body.unit || 'ft',
        laborRate: laborRateValue, // Ya es string desde la conversión previa
        // Usamos laborMethod del frontend y lo asignamos al campo laborCalculationMethod
        laborCalculationMethod: req.body.laborMethod || 'by_length',
        contractor_id: req.user.id,
        updatedAt: new Date()
      };
      
      console.log("Raw ServiceData:", JSON.stringify(serviceData));
      
      // Verificar que los tipos de datos correspondan con la tabla
      // La tabla espera que laborRate sea numeric/decimal
      if (typeof serviceData.laborRate === 'string') {
        serviceData.laborRate = parseFloat(serviceData.laborRate) || 0;
      }
      
      console.log("Service data prepared:", serviceData);
      
      let result;
      
      if (existingService) {
        // Update existing service
        console.log("Updating existing service with ID:", searchId);
        
        // Si estamos editando un servicio existente
        [result] = await db
          .update(service_pricing)
          .set(serviceData)
          .where(
            and(
              eq(service_pricing.service_type, searchId),
              eq(service_pricing.contractor_id, req.user.id)
            )
          )
          .returning();
          
        console.log("Service updated successfully:", result);
      } else {
        // Create new service
        console.log("Creating new service with data:", JSON.stringify(serviceData));
        try {
          // Creamos un objeto que respete exactamente los campos de la tabla
          const insertData = {
            name: serviceData.name,
            service_type: serviceData.service_type,
            unit: serviceData.unit,
            laborRate: serviceData.laborRate,
            laborCalculationMethod: serviceData.laborCalculationMethod,
            contractor_id: serviceData.contractor_id,
            createdAt: new Date(),
            updatedAt: serviceData.updatedAt
          };
          
          console.log("Inserting new service with data:", insertData);
          
          [result] = await db
            .insert(service_pricing)
            .values(insertData)
            .returning();
          
          console.log("New service created successfully:", result);
        } catch (insertError) {
          console.error("Error creating new service:", insertError);
          return res.status(500).json({ 
            message: 'Error creating service', 
            error: insertError instanceof Error ? insertError.message : 'Unknown error' 
          });
        }
      }
      
      // Guardar en la DB y luego hacer SELECT para verificar
      await new Promise(r => setTimeout(r, 100));
      const [checkResult] = await db
        .select()
        .from(service_pricing)
        .where(
          and(
            eq(service_pricing.service_type, serviceData.service_type),
            eq(service_pricing.contractor_id, req.user.id)
          )
        );
      
      console.log("Verification query result:", checkResult);
      
      // Format response to match frontend expectations
      const formattedService = {
        id: serviceData.service_type,
        name: serviceData.name,
        serviceType: serviceData.service_type,
        unit: serviceData.unit,
        laborRate: Number(serviceData.laborRate),
        laborMethod: serviceData.laborCalculationMethod
      };
      
      console.log("Returning formatted service:", formattedService);
      res.status(existingService ? 200 : 201).json(formattedService);
    } catch (error) {
      console.error('Error with service operation:', error);
      res.status(500).json({ 
        message: 'Error processing service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete a service
  app.delete('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log(`Deleting service with ID/service_type: ${id}`);
      
      // Verify the service belongs to the contractor (using service_type instead of numeric id)
      const [existingService] = await db
        .select()
        .from(service_pricing)
        .where(
          and(
            eq(service_pricing.service_type, id),
            eq(service_pricing.contractor_id, req.user.id)
          )
        );
      
      if (!existingService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      console.log(`Found service to delete:`, existingService);
      
      // Delete using the service's primary key id from the database
      const result = await db
        .delete(service_pricing)
        .where(
          and(
            eq(service_pricing.service_type, id),
            eq(service_pricing.contractor_id, req.user.id)
          )
        );
      
      console.log(`Service ${id} deleted successfully with result:`, result);
      res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ message: 'Error deleting service' });
    }
  });
}
