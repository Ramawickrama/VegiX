import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import siCommon from './locales/si/common.json';
import taCommon from './locales/ta/common.json';
import enVegetables from './locales/en/vegetables.json';
import siVegetables from './locales/si/vegetables.json';
import taVegetables from './locales/ta/vegetables.json';

const resources = {
  en: { 
    translation: { ...enCommon, ...enVegetables } 
  },
  si: { 
    translation: { ...siCommon, ...siVegetables } 
  },
  ta: { 
    translation: { ...taCommon, ...taVegetables } 
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    },
  });

export default i18n;
