import { en } from './en';
import { hi } from './hi';
import { kn } from './kn';
import { te } from './te';
import { ta } from './ta';
import { mr } from './mr';
import { ml } from './ml';

export type SupportedLanguage = 'en' | 'hi' | 'kn' | 'te' | 'ta' | 'mr' | 'ml';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  dir?: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🌐', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🌾', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🌱', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🌿', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🚜', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🌴', dir: 'ltr' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    ...en,
    // Legacy aliases
    app_title: en.app_name,
    btn_get_started: "Launch Farmer Portal",
    btn_explore_features: "Explore Intelligence",
    btn_calculate: en.irr_btn_calculate,
    btn_analyze_leaf: en.qa_scan_crop,
    btn_ask_ai: en.qa_ask_ai,
    lbl_enter_query: en.ai_input_placeholder,
    lbl_select_language: en.select_language,
    hero_stat_accuracy: "98.2% CV Accuracy",
    hero_stat_water: "35% Water Saved",
    hero_stat_farmers: "12,400+ Farmers",
    hero_stat_coverage: "480+ Mandis Tracked",
  },
  hi: {
    ...hi,
    app_title: hi.app_name,
    btn_get_started: "किसान पोर्टल खोलें",
    btn_explore_features: "विशेषताएं देखें",
    btn_calculate: hi.irr_btn_calculate,
    btn_analyze_leaf: hi.qa_scan_crop,
    btn_ask_ai: hi.qa_ask_ai,
    lbl_enter_query: hi.ai_input_placeholder,
    lbl_select_language: hi.select_language,
    hero_stat_accuracy: "98.2% रोग निदान सटीकता",
    hero_stat_water: "35% पानी की बचत",
    hero_stat_farmers: "12,400+ पंजीकृत किसान",
    hero_stat_coverage: "480+ मंडियों के लाइव भाव",
  },
  kn: {
    ...kn,
    app_title: kn.app_name,
    btn_get_started: "ಪ್ರವೇಶಿಸಿ",
    btn_explore_features: "ವಿವರಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
    btn_calculate: kn.irr_btn_calculate,
    btn_analyze_leaf: kn.qa_scan_crop,
    btn_ask_ai: kn.qa_ask_ai,
    lbl_enter_query: kn.ai_input_placeholder,
    lbl_select_language: kn.select_language,
    hero_stat_accuracy: "98.2% ನಿಖರತೆ",
    hero_stat_water: "35% ನೀರು ಉಳಿತಾಯ",
    hero_stat_farmers: "12,400+ ರೈತರು",
    hero_stat_coverage: "480+ ಮಾರುಕಟ್ಟೆಗಳು",
  },
  te: {
    ...te,
    app_title: te.app_name,
    btn_get_started: "ప్రవేశించండి",
    btn_explore_features: "వివరాలు చూడండి",
    btn_calculate: te.irr_btn_calculate,
    btn_analyze_leaf: te.qa_scan_crop,
    btn_ask_ai: te.qa_ask_ai,
    lbl_enter_query: te.ai_input_placeholder,
    lbl_select_language: te.select_language,
    hero_stat_accuracy: "98.2% ఖచ్చితత్వం",
    hero_stat_water: "35% నీటి పొదుపు",
    hero_stat_farmers: "12,400+ రైతులు",
    hero_stat_coverage: "480+ మార్కెట్లు",
  },
  ta: {
    ...ta,
    app_title: ta.app_name,
    btn_get_started: "தொடங்கவும்",
    btn_explore_features: "அம்சங்களை காண்க",
    btn_calculate: ta.irr_btn_calculate,
    btn_analyze_leaf: ta.qa_scan_crop,
    btn_ask_ai: ta.qa_ask_ai,
    lbl_enter_query: ta.ai_input_placeholder,
    lbl_select_language: ta.select_language,
    hero_stat_accuracy: "98.2% துல்லியம்",
    hero_stat_water: "35% நீர் சேமிப்பு",
    hero_stat_farmers: "12,400+ விவசாயிகள்",
    hero_stat_coverage: "480+ சந்தைகள்",
  },
  mr: {
    ...mr,
    app_title: mr.app_name,
    btn_get_started: "सुरू करा",
    btn_explore_features: "वैशिष्ट्ये पहा",
    btn_calculate: mr.irr_btn_calculate,
    btn_analyze_leaf: mr.qa_scan_crop,
    btn_ask_ai: mr.qa_ask_ai,
    lbl_enter_query: mr.ai_input_placeholder,
    lbl_select_language: mr.select_language,
    hero_stat_accuracy: "98.2% अचूकता",
    hero_stat_water: "35% पाण्याची बचत",
    hero_stat_farmers: "12,400+ शेतकरी",
    hero_stat_coverage: "480+ बाजार समित्या",
  },
  ml: {
    ...ml,
    app_title: ml.app_name,
    btn_get_started: "ആരംഭിക്കുക",
    btn_explore_features: "സവിശേഷതകൾ കാണുക",
    btn_calculate: ml.irr_btn_calculate,
    btn_analyze_leaf: ml.qa_scan_crop,
    btn_ask_ai: ml.qa_ask_ai,
    lbl_enter_query: ml.ai_input_placeholder,
    lbl_select_language: ml.select_language,
    hero_stat_accuracy: "98.2% കൃത്യത",
    hero_stat_water: "35% ജല സംരക്ഷണം",
    hero_stat_farmers: "12,400+ കർഷകർ",
    hero_stat_coverage: "480+ വിപണികൾ",
  },
};

export function translate(
  language: SupportedLanguage,
  key: string,
  params?: Record<string, string | number>
): string {
  // Normalize dot-notation or underscore
  const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
  let text = dict[key] || TRANSLATIONS.en[key];

  if (!text) {
    // Try nested lookup if key has dots (e.g. "auth.signIn")
    const cleanKey = key.replace(/\./g, '_');
    text = dict[cleanKey] || TRANSLATIONS.en[cleanKey];
  }

  // Graceful fallback: never return undefined, null, or [object Object]
  if (!text) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n missing key]: "${key}" in language "${language}"`);
    }
    // Convert key (e.g. "err_password_required" -> "Password required")
    text = key
      .replace(/^([a-z]+_)+/, '')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  // Parameter interpolation: {value}, {name}, etc.
  if (params && typeof text === 'string') {
    Object.entries(params).forEach(([pKey, pVal]) => {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    });
  }

  return text;
}
