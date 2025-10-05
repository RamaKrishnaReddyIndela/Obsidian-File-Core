import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import ta from './locales/ta.json';
import kn from './locales/kn.json';
import mr from './locales/mr.json';
import bn from './locales/bn.json';
import gu from './locales/gu.json';
import pa from './locales/pa.json';
import ur from './locales/ur.json';

const dictionaries = { en, hi, te, ta, kn, mr, bn, gu, pa, ur };

const I18nContext = createContext({ t: (k)=>k, lang: 'en', setLang: ()=>{} });

export const I18nProvider = ({ children }) => {
  const initial = (typeof window !== 'undefined' && localStorage.getItem('lang')) || 'en';
  const [lang, setLangState] = useState(initial);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('lang', lang);
  }, [lang]);

  const setLang = (l) => setLangState(dictionaries[l] ? l : 'en');

  const dict = dictionaries[lang] || dictionaries.en;

  const t = useMemo(() => {
    const get = (obj, path) => path.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : undefined), obj);
    return (key) => get(dict, key) || key;
  }, [dict]);

  const value = useMemo(() => ({ t, lang, setLang }), [t, lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
