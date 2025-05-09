import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, Translation, translations, getTranslation } from "@/lib/i18n";

// Define the context type
type LanguageContextType = {
  language: Language;
  t: (key: string) => string;
  changeLanguage: (language: Language) => void;
  supportedLanguages: { code: Language; name: string }[];
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
  // Try to get the saved language from localStorage or use English as default
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'en';
  });

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
  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // Update the HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, supportedLanguages }}>
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