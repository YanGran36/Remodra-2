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

// List of supported languages
const supportedLanguages = [
  { code: 'en' as Language, name: 'English' },
  { code: 'es' as Language, name: 'Español' },
  { code: 'fr' as Language, name: 'Français' },
  { code: 'pt' as Language, name: 'Português' },
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize language from user preferences or localStorage - use English as default
  const [language, setLanguage] = useState<Language>(() => {
    // If user is logged in, use their saved preference
    if (user?.language) {
      return user.language as Language;
    }
    // Otherwise try to get from localStorage - default is English
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'en';
  });

  // Update language when user data changes
  useEffect(() => {
    if (user?.language) {
      setLanguage(user.language as Language);
    }
  }, [user]);

  // Translation function
  const t = (key: string): string => {
    // Make sure the language exists in translations
    if (translations[language]) {
      return getTranslation(translations[language] as Translation, key);
    }
    // Fallback to English if the selected language is not available
    return getTranslation(translations.en as Translation, key);
  };

  // Function to change the language
  const changeLanguage = async (newLanguage: Language) => {
    // Always update localStorage
    localStorage.setItem('language', newLanguage);
    
    // Update local state
    setLanguage(newLanguage);
    
    // If user is logged in, also update in the database
    if (user) {
      try {
        setIsLoading(true);
        await apiRequest("POST", "/api/protected/language", { language: newLanguage });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save language preference to server",
          variant: "destructive",
        });
        console.error("Error saving language preference:", error);
      } finally {
        setIsLoading(false);
      }
    }
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