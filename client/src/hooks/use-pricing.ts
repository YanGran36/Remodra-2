import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Interfaces para los datos de precios
export interface ServicePrice {
  id: string;
  name: string;
  serviceType: string;
  unitPrice: number;
  unit: string;
  laborRate: number;
  laborMethod: string;
}

export interface MaterialPrice {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string;
  supplier: string;
}

// Datos predefinidos (fallback)
const defaultServices: ServicePrice[] = [
  {
    id: 'fence',
    name: 'Instalación de Cerca',
    serviceType: 'fence',
    unitPrice: 57,
    unit: 'ft',
    laborRate: 35,
    laborMethod: 'by_length',
  },
  {
    id: 'roof',
    name: 'Instalación de Techo',
    serviceType: 'roof',
    unitPrice: 8.7,
    unit: 'sqft',
    laborRate: 3.5,
    laborMethod: 'by_area',
  },
  {
    id: 'gutters',
    name: 'Instalación de Canaletas',
    serviceType: 'gutters',
    unitPrice: 12,
    unit: 'ft',
    laborRate: 7,
    laborMethod: 'by_length',
  }
];

const defaultMaterials: MaterialPrice[] = [
  {
    id: 'wood_fence',
    name: 'Wood Fence',
    category: 'fence',
    unitPrice: 22,
    unit: 'ln.ft',
    supplier: 'Lumber Yard',
  },
  {
    id: 'vinyl_fence',
    name: 'Vinyl Fence',
    category: 'fence',
    unitPrice: 35,
    unit: 'ln.ft',
    supplier: 'Modern Materials',
  },
  {
    id: 'chain_link',
    name: 'Chain Link Fence',
    category: 'fence',
    unitPrice: 28,
    unit: 'ln.ft',
    supplier: 'Metal Supply Co.',
  },
  {
    id: 'aluminum_fence',
    name: 'Aluminum Fence',
    category: 'fence',
    unitPrice: 40,
    unit: 'ln.ft',
    supplier: 'Metal Supply Co.',
  },
  {
    id: 'fence_gate',
    name: 'Fence Gate',
    category: 'fence',
    unitPrice: 150,
    unit: 'unit',
    supplier: 'Hardware Supply',
  },
  {
    id: 'post_caps',
    name: 'Post Caps',
    category: 'fence',
    unitPrice: 15,
    unit: 'unit',
    supplier: 'Hardware Supply',
  },
  {
    id: 'asphalt_shingles',
    name: 'Asphalt Shingles',
    category: 'roof',
    unitPrice: 5.2,
    unit: 'sq.ft',
    supplier: 'Roofing Supply',
  },
  {
    id: 'metal_roofing',
    name: 'Metal Roofing',
    category: 'roof',
    unitPrice: 8.5,
    unit: 'sq.ft',
    supplier: 'Metal Supply Co.',
  }
];

/**
 * Hook personalizado para obtener y utilizar los precios centralizados
 */
export function usePricing() {
  // Consulta para servicios - Con carga directa de valores fijos
  const { 
    data: servicePrices, 
    isLoading: servicesLoading,
    error: servicesError
  } = useQuery({
    queryKey: ['/api/pricing/services'],
    // Ahora usamos los valores reales de la API en lugar de valores hardcodeados
    retry: 1,
  });

  // Consulta para materiales con valores directamente de la API
  const { 
    data: materialPrices, 
    isLoading: materialsLoading,
    error: materialsError
  } = useQuery({
    queryKey: ['/api/pricing/materials'],
    // Usar directamente los valores de la API
    retry: 1,
  });

  // Funciones de utilidad para obtener precios por tipo o categoria
  const getServicePrice = (serviceType: string): ServicePrice | undefined => {
    // Asegurarse de que servicePrices es un array y no un objeto vacío
    const services = Array.isArray(servicePrices) ? servicePrices : defaultServices;
    
    // Buscar primero por tipo de servicio (más confiable)
    const serviceByType = services.find((service: any) => 
      service.serviceType === serviceType
    );
    
    if (serviceByType) return serviceByType;
    
    // Si no encuentra por tipo, intentar por ID (como fallback)
    return services.find((service: any) => 
      String(service.id) === serviceType
    );
  };

  const getMaterialPrice = (category: string, materialId?: string): MaterialPrice | undefined => {
    // Asegurarse de que materialPrices es un array y no un objeto vacío
    const materials = Array.isArray(materialPrices) ? materialPrices : defaultMaterials;
    
    // Si hay un ID específico, buscar primero por él
    if (materialId) {
      console.log("Material configurado encontrado:", materialId, 
        materials.find((m: any) => String(m.id) === materialId)?.unitPrice);
      
      // Buscar por ID exacto o por nombre que contenga el ID
      const exactMatch = materials.find((material: any) => 
        String(material.id) === materialId
      );
      
      if (exactMatch) return exactMatch;
      
      // Buscar por nombre que contenga el ID
      const nameMatch = materials.find((material: any) => 
        material.name?.toLowerCase().includes(materialId.toLowerCase()) && 
        material.category === category
      );
      
      if (nameMatch) return nameMatch;
    }
    
    // Buscar el primer material de la categoría correcta
    return materials.find((material: any) => 
      material.category === category
    );
  };

  const getMaterialsByCategory = (category: string): MaterialPrice[] => {
    // Asegurarse de que materialPrices es un array y no un objeto vacío
    const materials = Array.isArray(materialPrices) ? materialPrices : defaultMaterials;
    
    // Asegurarse de que devolvemos al menos un material por categoría
    const materialsInCategory = materials.filter((material: any) => 
      material.category === category
    );
    
    // Si no hay materiales para esta categoría, usar los predeterminados
    return materialsInCategory.length > 0 
      ? materialsInCategory 
      : defaultMaterials.filter(m => m.category === category);
  };

  return {
    services: servicePrices || defaultServices,
    materials: materialPrices || defaultMaterials,
    isLoading: servicesLoading || materialsLoading,
    hasError: !!servicesError || !!materialsError,
    // Funciones de utilidad
    getServicePrice,
    getMaterialPrice,
    getMaterialsByCategory
  };
}