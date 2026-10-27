import React from 'react';
import { 
  Menu, 
  Bot, 
  Cpu, 
  ChevronRight, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { AuthUser } from './AuthPage';

interface TopHeaderProps {
  currentTab: string;
  openAiAssistant: () => void;
  onOpenOnboarding: () => void;
  onOpenMobileMenu: () => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  language?: any;
  setLanguage?: any;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  openAiAssistant,
  onOpenOnboarding,
  onOpenMobileMenu,
  authUser,
  onLogout,
  onOpenProfile,
}) => {
  const { t } = useTranslation();

  const titleKey = `title_${currentTab}`;
  const subKey = `sub_${currentTab}`;
  const currentTitle = t(titleKey);
  const currentSub = t(subKey);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#050E08]/90 backdrop-blur-xl border-b border-emerald-900/40 px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
      
      {/* Left: Mobile Toggle & Breadcrumb / Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 hover:text-white"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-500/80">
            <span>{t('app_full_name')}</span>
            <ChevronRight className="w-3 h-3 text-emerald-700" />
            <span className="text-emerald-400 uppercase tracking-wider font-semibold truncate">
              {currentTitle}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate hidden sm:block" title={currentSub}>
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right: Actions, Language Selector, AI Voice, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#081e11] border border-emerald-800/60 text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t('core_online')}</span>
          <span className="text-emerald-700">•</span>
          <span>{t('sentinel_active')}</span>
        </div>

        {/* Global Language Selector Dropdown */}
        <LanguageSelector variant="standard" />

        {/* Voice AI Button */}
        <button
          onClick={openAiAssistant}
          className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400 transition-all text-xs font-semibold cursor-pointer shadow-sm"
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">{t('btn_ai_voice')}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </button>

        {/* Farm Profile Setup Button */}
        <button
          onClick={onOpenOnboarding}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('btn_farm_profile')}</span>
        </button>

        {/* User Profile & Logout Action */}
        {authUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-emerald-900/60">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#081e11] hover:bg-[#0d2a18] border border-emerald-800 hover:border-emerald-500 text-xs text-emerald-200 transition-all cursor-pointer group"
              title="View / Edit Profile"
            >
              {authUser.avatar_url ? (
                <img src={authUser.avatar_url} alt={authUser.name} className="w-4 h-4 rounded-full" />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              )}
              <span className="font-semibold hidden lg:inline truncate max-w-[120px]">{authUser.name}</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 text-red-300 hover:text-red-100 transition-colors cursor-pointer"
                title={t('nav_sign_out')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      </div>

    </header>
  );
};
