import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { LANGUAGES, translations } from './translations.js';

const I18nContext = createContext(null);

function detectDefaultLanguage() {
  try {
    const stored = localStorage.getItem('shelf-language');
    if (stored && translations[stored]) return stored;
  } catch {
    /* private browsing / storage disabled */
  }
  const browserLang = (navigator?.language || 'en').slice(0, 2);
  return translations[browserLang] ? browserLang : 'en';
}

export function I18nProvider({ initialLanguage, children }) {
  const [language, setLanguageState] = useState(() => initialLanguage || detectDefaultLanguage());

  const setLanguage = useCallback((lang) => {
    setLanguageState(translations[lang] ? lang : 'en');
    try {
      localStorage.setItem('shelf-language', lang);
    } catch {
      /* private browsing / storage disabled — language just won't persist */
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = translations[language] || translations.en;
      let str = dict[key] ?? translations.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, v);
        }
      }
      return str;
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t, languages: LANGUAGES }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
