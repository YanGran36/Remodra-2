import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, translations, getTranslation } from "@/lib/i18n";

// Definir tipo para el contexto
type LanguageContextType = {
  language: Language;
  t: (key: string) => string;
  changeLanguage: (language: Language) => void;
  supportedLanguages: { code: Language; name: string }[];
};

// Crear contexto
export const LanguageContext = createContext<LanguageContextType | null>(null);

// Lista de idiomas soportados
const supportedLanguages = [
  { code: 'es' as Language, name: 'Español' },
  { code: 'en' as Language, name: 'English' },
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Intentar obtener el idioma guardado en localStorage o usar español por defecto
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'es';
  });

  // Función para traducir un texto
  const t = (key: string): string => {
    return getTranslation(translations[language], key);
  };

  // Función para cambiar el idioma
  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // Actualizar el atributo lang del HTML cuando cambia el idioma
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}