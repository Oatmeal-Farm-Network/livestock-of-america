import React, { createContext, useContext, useMemo, useState } from 'react';

const LanguageContext = createContext({ language: 'en', setLanguage: () => {} });

/** Minimal language context — English-only for LOA v1 (matches OFN API ?lang=). */
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
