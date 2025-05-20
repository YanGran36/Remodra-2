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
  // Consulta para servicios - Con manejo mejorado de caché
  const { 
    data: servicePrices, 
    isLoading: servicesLoading,
    error: servicesError
  } = useQuery({
    queryKey: ['/api/pricing/services'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/pricing/services');
        if (!response.ok) throw new Error('Error al cargar servicios');
        const data = await response.json();
        // Si hay datos, los retornamos
        if (data && Array.isArray(data) && data.length > 0) {
          // Procesamos las entradas para asegurar que tengan los tipos correctos
          return data.map((item: any) => ({
            ...item,
            id: String(item.id),
            unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
            laborRate: typeof item.laborRate === 'string' ? parseFloat(item.laborRate) : item.laborRate,
          }));
        }
        // Si no hay datos, retornamos los valores predeterminados
        return defaultServices;
      } catch (error) {
        console.error('Error loading services:', error);
        return defaultServices;
      }
    },
    // Mantenemos los datos en caché por más tiempo para evitar recargas frecuentes
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  // Consulta para materiales - Con manejo mejorado de caché
  const { 
    data: materialPrices, 
    isLoading: materialsLoading,
    error: materialsError 
  } = useQuery({
    queryKey: ['/api/pricing/materials'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/pricing/materials');
        if (!response.ok) throw new Error('Error al cargar materiales');
        const data = await response.json();
        // Si hay datos, los retornamos
        if (data && Array.isArray(data) && data.length > 0) {
          // Procesamos las entradas para asegurar que tengan los tipos correctos
          return data.map((item: any) => ({
            ...item,
            id: String(item.id),
            unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
          }));
        }
        // Si no hay datos, retornamos los valores predeterminados
        return defaultMaterials;
      } catch (error) {
        console.error('Error loading materials:', error);
        return defaultMaterials;
      }
    },
    // Mantenemos los datos en caché por más tiempo para evitar recargas frecuentes
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
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