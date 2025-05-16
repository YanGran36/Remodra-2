import React from 'react';
import { useToast } from '@/hooks/use-toast';
import EnhancedPdfTemplateEditor from '@/components/pdf/enhanced-pdf-template-editor';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';

/**
 * Página para editar plantillas de PDF (Presupuestos y Facturas)
 * Esta es la única página de edición de plantillas que debe usarse en la aplicación.
 */
export default function PdfTemplateEditorPage() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const handleSave = (config: any) => {
    // Guardar configuración y mostrar toast de éxito
    localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
    
    toast({
      title: 'Configuración guardada',
      description: 'La plantilla ha sido guardada correctamente.',
    });
  };

  const handleBack = () => {
    navigate('/settings');
  };

  const handleNavToServices = () => {
    navigate('/company-services');
  };
  
  return (
    <>
      <Helmet>
        <title>Editor de Plantillas PDF | ContractorHub</title>
        <meta name="description" content="Personaliza tus plantillas de presupuestos y facturas con opciones avanzadas de diseño" />
      </Helmet>
      
      <EnhancedPdfTemplateEditor 
        onSave={handleSave} 
        onBack={handleBack}
        onHome={handleNavToServices}
      />
    </>
  );
}