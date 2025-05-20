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
      // Valores fijos de producción configurados en la base de datos
      // CRITICAL: Estos valores deben ser utilizados en TODOS los estimados
      return [
        {
          id: 'fence',
          name: 'Instalación de Cerca',
          serviceType: 'fence',
          unitPrice: 65, // Precio actualizado de la base de datos
          unit: 'ft',
          laborRate: 40, // Valor de la base de datos
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
    },
    // Evitamos recargas innecesarias
    staleTime: Infinity,
    retry: 0,
  });

  // Consulta para materiales - Sin caché para siempre obtener los datos más recientes
  const { 
    data: materialPrices, 
    isLoading: materialsLoading,
    error: materialsError,
    refetch: refetchMaterials
  } = useQuery({
    queryKey: ['/api/pricing/materials'],
    queryFn: async () => {
      try {
        // Hacemos una petición directa sin usar caché
        const response = await fetch('/api/pricing/materials', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) throw new Error('Error al cargar materiales');
        const data = await response.json();
        
        // Si hay datos, los procesamos
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('Precios de materiales cargados de la base de datos:', data);
          // Procesamos las entradas para asegurar que tengan los tipos correctos
          return data.map((item: any) => ({
            ...item,
            id: String(item.id),
            unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
          }));
        }
        
        // Si no hay datos, usamos valores predeterminados, pero con el precio actualizado para la madera
        return [
          {
            id: 'fence-wood',
            name: 'Madera para Cerca',
            category: 'fence',
            unitPrice: 25, // Valor actualizado directo
            unit: 'ft',
            supplier: 'Lumber Yard',
          },
          ...defaultMaterials.filter(m => m.id !== 'fence-wood')
        ];
      } catch (error) {
        console.error('Error loading materials:', error);
        // En caso de error, usamos valores predeterminados con el precio actualizado de madera
        return [
          {
            id: 'fence-wood',
            name: 'Madera para Cerca',
            category: 'fence',
            unitPrice: 25, // Valor actualizado directo
            unit: 'ft',
            supplier: 'Lumber Yard',
          },
          ...defaultMaterials.filter(m => m.id !== 'fence-wood')
        ];
      }
    },
    // Desactivamos caché para siempre obtener los valores más recientes
    staleTime: 0,
    cacheTime: 0,
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