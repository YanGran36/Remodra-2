import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'wouter';
import EnhancedPdfTemplateEditor from '@/components/pdf/enhanced-pdf-template-editor';
import { PdfTemplateConfig } from '@/components/pdf/pdf-template-settings';
import { useToast } from '@/hooks/use-toast';

export default function PdfTemplateEditorPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [initialConfig, setInitialConfig] = useState<Partial<PdfTemplateConfig> | undefined>(undefined);

  // Load saved template on initial render
  useEffect(() => {
    try {
      const savedTemplate = localStorage.getItem('pdfTemplateConfig');
      if (savedTemplate) {
        setInitialConfig(JSON.parse(savedTemplate));
      }
    } catch (error) {
      console.error('Error loading saved template:', error);
    }
  }, []);

  const handleSave = (config: PdfTemplateConfig) => {
    localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
    toast({
      title: 'Template Saved',
      description: 'Your PDF template has been saved successfully',
    });
  };

  const handleBack = () => {
    navigate('/settings');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>PDF Template Editor | ContractorHub</title>
      </Helmet>
      <div className="container mx-auto py-4">
        <EnhancedPdfTemplateEditor
          initialConfig={initialConfig}
          onSave={handleSave}
          onBack={handleBack}
          onHome={handleHome}
        />
      </div>
    </>
  );
}