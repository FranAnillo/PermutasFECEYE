import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esTranslation from './locales/es.json';
import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';

const resources = {
    es: {
        translation: esTranslation
    },
    en: {
        translation: enTranslation
    },
    fr: {
        translation: frTranslation
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'es',
        debug: false,
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        detection: {
            order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage', 'cookie'],
        },
    });

export default i18n;
