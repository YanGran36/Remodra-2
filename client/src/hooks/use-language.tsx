import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, Translation, translations, getTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the context type
type LanguageContextType = {
  language: Language;
  t: (key: string) => string;
  changeLanguage: (language: Language) => void;
  supportedLanguages: { code: Language; name: string }[];
  isLoading: boolean;
};

// Create context
export const LanguageContext = createContext<LanguageContextType | null>(null);

// English only
const supportedLanguages = [
  { code: 'en' as Language, name: 'English' },
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Always use English as the only language
  const [language, setLanguage] = useState<Language>('en');

  // Translation function
  const t = (key: string): string => {
    // Make sure the language exists in translations
    if (translations[language]) {
      return getTranslation(translations[language] as Translation, key);
    }
    // Fallback to English if the selected language is not available
    return getTranslation(translations.en as Translation, key);
  };

  // Function to change the language (simplified to only use English)
  const changeLanguage = async (newLanguage: Language) => {
    // Always use English regardless of what was passed
    if (newLanguage !== 'en') {
      console.warn('Only English is supported');
    }
    setLanguage('en');
  };

  // Update the HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, supportedLanguages, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}