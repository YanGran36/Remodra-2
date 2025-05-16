import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';
import EnhancedPdfTemplateEditor from '@/components/pdf/enhanced-pdf-template-editor';
import { PdfTemplateConfig } from '@/components/pdf/pdf-template-settings';
import { useToast } from '@/hooks/use-toast';

export default function PdfTemplateEditorPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [initialConfig, setInitialConfig] = useState<Partial<PdfTemplateConfig> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved template on initial render
  useEffect(() => {
    try {
      setIsLoading(true);
      const savedTemplate = localStorage.getItem('pdfTemplateConfig');
      if (savedTemplate) {
        setInitialConfig(JSON.parse(savedTemplate));
      }
    } catch (error) {
      console.error('Error loading saved template:', error);
      toast({
        title: 'Error Loading Template',
        description: 'There was a problem loading your saved template settings.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleSave = (config: PdfTemplateConfig) => {
    localStorage.setItem('pdfTemplateConfig', JSON.stringify(config));
    toast({
      title: 'Template Saved',
      description: 'Your PDF template configuration has been saved successfully',
    });
  };

  const handleBack = () => {
    navigate('/settings');
  };

  const handleHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-3">Loading template configuration...</span>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>PDF Template Editor | ContractorHub</title>
        <meta name="description" content="Configure and customize your PDF templates for estimates, invoices and other documents. Preview changes in real-time." />
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