import React from 'react';
import { 
  Sprout, 
  Globe, 
  Cpu, 
  Layers, 
  Menu, 
  X,
  Droplets,
  ScanLine,
  TrendingUp,
  CloudSun,
  Bot
} from 'lucide-react';
import { LANGUAGES, SupportedLanguage, TRANSLATIONS } from '../translations';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  openAiAssistant: () => void;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  openAiAssistant,
  onOpenOnboarding,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);

  const t = (key: string) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const navItems = [
    { id: 'overview', label: t('nav_home'), icon: Globe },
    { id: 'dashboard', label: t('nav_dashboard'), icon: Layers },
    { id: 'irrigation', label: t('nav_irrigation'), icon: Droplets },
    { id: 'crop_health', label: t('nav_crop_health'), icon: ScanLine },
    { id: 'markets', label: t('nav_markets'), icon: TrendingUp },
    { id: 'crop_rec', label: t('nav_crop_rec'), icon: Sprout },
    { id: 'weather', label: t('nav_weather'), icon: CloudSun },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#06120B]/85 backdrop-blur-xl border-b border-emerald-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab('overview')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-green-900 p-0.5 shadow-lg shadow-emerald-950/60 group-hover:shadow-emerald-500/30 transition-all duration-300">
            <div className="w-full h-full bg-[#07170E] rounded-[10px] flex items-center justify-center">
              <Sprout className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                AGRI<span className="text-emerald-400">ONE</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                v2.6 OS
              </span>
            </div>
            <p className="text-[11px] text-emerald-400/70 font-mono tracking-wide">
              INTELLIGENT AGRICULTURE ECOSYSTEM
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#091C11]/80 p-1.5 rounded-full border border-emerald-800/40 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/20'
                    : 'text-emerald-200/80 hover:text-white hover:bg-emerald-950/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-black' : 'text-emerald-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Tools: Language, AI Assistant & Farmer Setup */}
        <div className="hidden sm:flex items-center gap-3">
          
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b2114] border border-emerald-700/50 text-xs text-emerald-200 hover:border-emerald-400 transition-colors"
            >
              <span className="text-sm">{currentLang.flag}</span>
              <span className="font-medium">{currentLang.nativeName}</span>
              <span className="text-[10px] text-emerald-500">▼</span>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-[#0a1b11] border border-emerald-600/40 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] font-mono text-emerald-400/80 border-b border-emerald-900/60">
                  {t('lbl_select_language')}
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                      language === l.code
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'text-zinc-300 hover:bg-emerald-900/30 hover:text-emerald-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-500/70">{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Farmer Assistant Button */}
          <button
            onClick={openAiAssistant}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400 transition-all shadow-sm group"
          >
            <Bot className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-semibold">{t('nav_ai')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Farm Setup Button */}
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md shadow-emerald-500/25 active:scale-95"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Farm Setup</span>
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            onClick={openAiAssistant}
            className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          >
            <Bot className="w-5 h-5 text-emerald-400" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#06140c] border-b border-emerald-900/60 px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    active
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-mono">Language:</span>
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-2 py-1 rounded text-xs ${
                    language === l.code ? 'bg-emerald-500 text-black font-bold' : 'text-emerald-300'
                  }`}
                >
                  {l.flag} {l.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
