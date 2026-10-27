import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  LANGUAGES, 
  SupportedLanguage, 
  LanguageInfo, 
  translate 
} from '../translations';

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRtl: boolean;
  languages: LanguageInfo[];
  currentLangInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'agrione_language';

const VALID_CODES = new Set<SupportedLanguage>(['en', 'hi', 'kn', 'te', 'ta', 'mr', 'ml']);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (saved && VALID_CODES.has(saved)) {
        return saved;
      }
    } catch (e) {
      // LocalStorage access exception fallback
    }
    return 'en';
  });

  const currentLangInfo = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const isRtl = currentLangInfo.dir === 'rtl';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    } catch (e) {
      console.warn('Unable to persist language preference:', e);
    }
  }, [language, isRtl]);

  const setLanguage = (newLang: SupportedLanguage) => {
    if (!VALID_CODES.has(newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch (e) {
      // Ignore
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(language, key, params);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRtl,
        languages: LANGUAGES,
        currentLangInfo,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = (): LanguageContextType => {
  return useLanguage();
};
