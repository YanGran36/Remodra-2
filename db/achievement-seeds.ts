import { achievements, achievementRewards } from '@shared/schema';

// Datos de ejemplo para logros
export const achievementSeedData = [
  // Logros de clientes
  {
    code: 'first_client',
    name: 'Primer Cliente',
    description: 'Agregaste tu primer cliente al sistema',
    category: 'client',
    points: 10,
    icon: 'UserPlus',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'client_master',
    name: 'Maestro de Clientes',
    description: 'Gestionas 10 clientes activos en el sistema',
    category: 'client',
    points: 50,
    icon: 'Users',
    requiredCount: 10,
    level: 'silver',
    badgeColor: '#C0C0C0'
  },
  {
    code: 'client_empire',
    name: 'Imperio de Clientes',
    description: 'Tu red ha crecido a 25 clientes',
    category: 'client',
    points: 100,
    icon: 'Building',
    requiredCount: 25,
    level: 'gold',
    badgeColor: '#FFD700'
  },
  
  // Logros de proyectos
  {
    code: 'first_project',
    name: 'Primer Proyecto',
    description: 'Creaste tu primer proyecto en ContractorHub',
    category: 'project',
    points: 15,
    icon: 'Hammer',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'project_master',
    name: 'Maestro de Proyectos',
    description: 'Has completado 5 proyectos exitosamente',
    category: 'project',
    points: 75,
    icon: 'Trophy',
    requiredCount: 5,
    level: 'silver',
    badgeColor: '#C0C0C0'
  },
  {
    code: 'project_variety',
    name: 'Diversidad de Proyectos',
    description: 'Has trabajado en 3 diferentes tipos de servicios',
    category: 'project',
    points: 60,
    icon: 'Layers',
    requiredCount: 3,
    level: 'silver',
    badgeColor: '#C0C0C0'
  },
  
  // Logros de estimaciones
  {
    code: 'first_estimate',
    name: 'Primera Estimación',
    description: 'Creaste tu primera estimación para un cliente',
    category: 'estimate',
    points: 15,
    icon: 'Calculator',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'estimate_accepted',
    name: 'Propuesta Aceptada',
    description: 'Un cliente ha aceptado tu estimación',
    category: 'estimate',
    points: 25,
    icon: 'CheckCircle',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'estimate_master',
    name: 'Estimador Experto',
    description: 'Has convertido 10 estimaciones en proyectos',
    category: 'estimate',
    points: 100,
    icon: 'TrendingUp',
    requiredCount: 10,
    level: 'gold',
    badgeColor: '#FFD700'
  },
  
  // Logros de facturas
  {
    code: 'first_invoice',
    name: 'Primera Factura',
    description: 'Creaste tu primera factura en el sistema',
    category: 'invoice',
    points: 15,
    icon: 'FileText',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'invoice_paid',
    name: 'Primer Pago',
    description: 'Recibiste el pago de tu primera factura',
    category: 'invoice',
    points: 20,
    icon: 'DollarSign',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'invoice_master',
    name: 'Maestro Financiero',
    description: 'Has recibido pagos por 10 facturas',
    category: 'invoice',
    points: 75,
    icon: 'TrendingUp',
    requiredCount: 10,
    level: 'silver',
    badgeColor: '#C0C0C0'
  },
  
  // Logros de uso del sistema
  {
    code: 'streak_week',
    name: 'Constancia Semanal',
    description: 'Has iniciado sesión durante 7 días consecutivos',
    category: 'system',
    points: 30,
    icon: 'Calendar',
    requiredCount: 7,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'streak_month',
    name: 'Constancia Mensual',
    description: 'Has mantenido una racha de 30 días consecutivos',
    category: 'system',
    points: 100,
    icon: 'Award',
    requiredCount: 30,
    level: 'gold',
    badgeColor: '#FFD700'
  },
  {
    code: 'feature_explorer',
    name: 'Explorador de Características',
    description: 'Has utilizado todas las características principales de ContractorHub',
    category: 'system',
    points: 50,
    icon: 'Compass',
    requiredCount: 1,
    level: 'silver',
    badgeColor: '#C0C0C0'
  },
  
  // Logros de IA
  {
    code: 'ai_assistant',
    name: 'Asistente IA',
    description: 'Has usado tu primer análisis de IA para un proyecto',
    category: 'ai',
    points: 20,
    icon: 'Brain',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'ai_master',
    name: 'Maestro de IA',
    description: 'Has utilizado la IA para analizar 10 proyectos',
    category: 'ai',
    points: 75,
    icon: 'Cpu',
    requiredCount: 10,
    level: 'silver',
    badgeColor: '#C0C0C0'
  }
];

// Datos de ejemplo para recompensas de logros
export const rewardSeedData = [
  {
    achievementCode: 'client_empire',
    type: 'feature',
    description: 'Acceso a herramientas avanzadas de análisis de clientes',
    value: 'advanced_client_analytics',
    duration: null
  },
  {
    achievementCode: 'estimate_master',
    type: 'feature',
    description: 'Acceso a plantillas premium de estimaciones',
    value: 'premium_estimate_templates',
    duration: null
  },
  {
    achievementCode: 'invoice_master',
    type: 'discount',
    description: '10% de descuento en tu plan durante 3 meses',
    value: '10',
    duration: 90
  },
  {
    achievementCode: 'streak_month',
    type: 'feature',
    description: 'Modo oscuro desbloqueado',
    value: 'dark_mode',
    duration: null
  },
  {
    achievementCode: 'ai_master',
    type: 'credit',
    description: '50 créditos adicionales para análisis de IA',
    value: '50',
    duration: null
  }
];