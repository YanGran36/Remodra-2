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
    id: 'fence-wood',
    name: 'Madera para Cerca',
    category: 'fence',
    unitPrice: 22,
    unit: 'ft',
    supplier: 'Lumber Yard',
  },
  {
    id: 'fence-metal',
    name: 'Postes Metálicos',
    category: 'fence',
    unitPrice: 35,
    unit: 'unit',
    supplier: 'Metal Supply Co.',
  },
  {
    id: 'roofing-shingles',
    name: 'Tejas Asfálticas',
    category: 'roof',
    unitPrice: 5.2,
    unit: 'sqft',
    supplier: 'Roofing Supply',
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
    queryFn: async () => {
      // Valores reseteados a cero para que el usuario pueda editarlos
      // CRITICAL: Estos valores deben ser utilizados en TODOS los estimados
      return [
        {
          id: 'fence',
          name: 'Instalación de Cerca',
          serviceType: 'fence',
          unitPrice: 0, // Precio reseteado a cero
          unit: 'ft',
          laborRate: 0, // Precio reseteado a cero
          laborMethod: 'by_length',
        },
        {
          id: 'roof',
          name: 'Instalación de Techo',
          serviceType: 'roof',
          unitPrice: 0, // Precio reseteado a cero
          unit: 'sqft',
          laborRate: 0, // Precio reseteado a cero
          laborMethod: 'by_area',
        },
        {
          id: 'gutters',
          name: 'Instalación de Canaletas',
          serviceType: 'gutters',
          unitPrice: 0, // Precio reseteado a cero
          unit: 'ft',
          laborRate: 0, // Precio reseteado a cero
          laborMethod: 'by_length',
        }
      ];
    },
    // Evitamos recargas innecesarias
    staleTime: Infinity,
    retry: 0,
  });

  // Consulta para materiales con valores predeterminados en cero
  const { 
    data: materialPrices, 
    isLoading: materialsLoading,
    error: materialsError
  } = useQuery({
    queryKey: ['/api/pricing/materials'],
    queryFn: async () => {
      // Valores reseteados a cero para que el usuario pueda editarlos
      return [
        {
          id: 'fence-wood',
          name: 'Madera para Cerca',
          category: 'fence',
          unitPrice: 0, // Precio reseteado a cero
          unit: 'ft',
          supplier: 'Lumber Yard',
        },
        {
          id: 'fence-metal',
          name: 'Postes Metálicos',
          category: 'fence',
          unitPrice: 0, // Precio reseteado a cero
          unit: 'unit',
          supplier: 'Metal Supply Co.',
        },
        {
          id: 'roofing-shingles',
          name: 'Tejas Asfálticas',
          category: 'roof',
          unitPrice: 0, // Precio reseteado a cero
          unit: 'sqft',
          supplier: 'Roofing Supply',
        }
      ];
    },
    // Evitamos recargas innecesarias
    staleTime: Infinity,
    retry: 0,
  });

  // Funciones de utilidad para obtener precios por tipo o categoria
  const getServicePrice = (serviceType: string): ServicePrice | undefined => {
    if (!servicePrices) return defaultServices.find(s => s.serviceType === serviceType);
    
    // Buscar primero por tipo de servicio (más confiable)
    const serviceByType = servicePrices.find((service: ServicePrice) => 
      service.serviceType === serviceType
    );
    
    if (serviceByType) return serviceByType;
    
    // Si no encuentra por tipo, intentar por ID (como fallback)
    return servicePrices.find((service: ServicePrice) => 
      String(service.id) === serviceType
    );
  };

  const getMaterialPrice = (category: string, materialId?: string): MaterialPrice | undefined => {
    if (!materialPrices) {
      if (materialId) {
        return defaultMaterials.find(m => m.id === materialId);
      }
      return defaultMaterials.find(m => m.category === category);
    }
    
    // Si hay un ID específico, buscar primero por él
    if (materialId) {
      // Buscar por ID exacto o por nombre que contenga el ID
      const exactMatch = materialPrices.find((material: MaterialPrice) => 
        String(material.id) === materialId
      );
      
      if (exactMatch) return exactMatch;
      
      // Buscar por nombre que contenga el ID
      const nameMatch = materialPrices.find((material: MaterialPrice) => 
        material.name.toLowerCase().includes(materialId.toLowerCase()) && 
        material.category === category
      );
      
      if (nameMatch) return nameMatch;
    }
    
    // Buscar el primer material de la categoría correcta
    return materialPrices.find((material: MaterialPrice) => 
      material.category === category
    );
  };

  const getMaterialsByCategory = (category: string): MaterialPrice[] => {
    if (!materialPrices) return defaultMaterials.filter(m => m.category === category);
    
    // Asegurarse de que devolvemos al menos un material por categoría
    const materialsInCategory = materialPrices.filter((material: MaterialPrice) => 
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