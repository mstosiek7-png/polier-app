import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import pl from './pl.json';
import de from './de.json';

const resources = {
  pl: { translation: pl },
  de: { translation: de },
};

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'pl';
const defaultLanguage = deviceLanguage === 'de' ? 'de' : 'pl';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'pl',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
