import React, { createContext, useContext, useMemo } from 'react';
import en from '../i18n/en.json';

const I18nContext = createContext({ t: (k, fb) => fb || k });

function lookup(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function format(str, vars) {
  if (!vars || typeof str !== 'string') return str;
  return str.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (_, a, b) => {
    const key = a || b;
    return vars[key] != null ? String(vars[key]) : '';
  });
}

export function I18nProvider({ children }) {
  const value = useMemo(
    () => ({
      t: (key, fallbackOrVars, maybeVars) => {
        const found = lookup(en, key);
        let fallback = fallbackOrVars;
        let vars = maybeVars;
        if (fallbackOrVars && typeof fallbackOrVars === 'object' && !Array.isArray(fallbackOrVars)) {
          vars = fallbackOrVars;
          fallback = undefined;
        }
        const raw = found != null ? found : (fallback != null ? fallback : key);
        return format(raw, vars);
      },
      i18n: { language: 'en' },
    }),
    [],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Drop-in for react-i18next's useTranslation. */
export function useTranslation() {
  return useContext(I18nContext);
}
