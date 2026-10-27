import React from 'react';
import { 
  Sprout, 
  Layers, 
  Droplets, 
  ScanLine, 
  TrendingUp, 
  ShieldCheck, 
  Radar, 
  Calendar, 
  Truck, 
  Milk, 
  ShoppingBag, 
  CloudSun, 
  DollarSign, 
  Bot, 
  Mic, 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  Compass, 
  LogOut, 
  User as UserIcon
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { AuthUser } from './AuthPage';

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: string;
  isAction?: boolean;
  actionType?: 'ai' | 'settings' | 'logout';
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  openAiAssistant: () => void;
  onOpenOnboarding: () => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  language?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  openAiAssistant,
  onOpenOnboarding,
  authUser,
  onLogout,
  onOpenProfile,
}) => {
  const { t } = useTranslation();

  const sections: NavSection[] = [
    {
      titleKey: 'nav_section_main',
      items: [
        { id: 'dashboard', labelKey: 'nav_dashboard', icon: Layers, badgeKey: 'badge_live' },
        { id: 'overview', labelKey: 'nav_home', icon: Compass },
        { id: 'irrigation', labelKey: 'nav_irrigation', icon: Droplets, badgeKey: 'badge_fao56' },
        { id: 'crop_health', labelKey: 'nav_crop_health', icon: ScanLine, badgeKey: 'badge_real_cv' },
        { id: 'markets', labelKey: 'nav_markets', icon: TrendingUp, badgeKey: 'badge_apmc' },
        { id: 'crop_rec', labelKey: 'nav_crop_rec', icon: Sprout },
        { id: 'soil', labelKey: 'nav_soil', icon: ShieldCheck },
        { id: 'satellite', labelKey: 'nav_satellite', icon: Radar, badgeKey: 'badge_sentinel2' },
        { id: 'farm_mgmt', labelKey: 'nav_farm_mgmt', icon: Calendar },
      ],
    },
    {
      titleKey: 'nav_section_agriculture',
      items: [
        { id: 'supply_chain', labelKey: 'nav_supply_chain', icon: Truck },
        { id: 'livestock', labelKey: 'nav_livestock', icon: Milk },
        { id: 'marketplace', labelKey: 'nav_marketplace', icon: ShoppingBag },
        { id: 'weather', labelKey: 'nav_weather', icon: CloudSun },
        { id: 'finance', labelKey: 'nav_finance', icon: DollarSign, badgeKey: 'badge_pmfby' },
      ],
    },
    {
      titleKey: 'nav_section_intelligence',
      items: [
        { id: 'ai_assistant', labelKey: 'nav_ai', icon: Bot, isAction: true, actionType: 'ai', badgeKey: 'badge_gemini' },
        { id: 'voice_ai', labelKey: 'nav_voice_ai', icon: Mic, isAction: true, actionType: 'ai' },
      ],
    },
    {
      titleKey: 'nav_section_admin',
      items: [
        { id: 'farm_setup', labelKey: 'nav_farm_setup', icon: Cpu, isAction: true, actionType: 'settings' },
        { id: 'logout', labelKey: 'nav_sign_out', icon: LogOut, isAction: true, actionType: 'logout' },
      ],
    },
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.isAction) {
      if (item.actionType === 'ai') {
        openAiAssistant();
      } else if (item.actionType === 'settings') {
        onOpenOnboarding();
      } else if (item.actionType === 'logout') {
        if (onLogout) onLogout();
      }
    } else {
      setCurrentTab(item.id);
    }
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#040C07] text-[#E2ECE5] border-r border-emerald-900/50 shadow-2xl relative select-none">
      
      {/* Brand Header */}
      <div className={`p-4 border-b border-emerald-900/60 flex items-center justify-between shrink-0 ${collapsed ? 'px-3 justify-center' : 'px-5'}`}>
        {!collapsed ? (
          <div 
            onClick={() => { setCurrentTab('overview'); setMobileOpen(false); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-green-900 p-0.5 shadow-md shadow-emerald-950/80 group-hover:shadow-emerald-500/30 transition-all">
              <div className="w-full h-full bg-[#07170E] rounded-[10px] flex items-center justify-center">
                <Sprout className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-white font-sans">
                  AGRI<span className="text-emerald-400">ONE</span>
                </span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OS
                </span>
              </div>
              <p className="text-[10px] text-emerald-400/70 font-mono tracking-wider truncate max-w-[140px]">
                {t('tagline')}
              </p>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => { setCurrentTab('overview'); setMobileOpen(false); }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-900 p-0.5 shadow-md cursor-pointer flex items-center justify-center"
            title="AgriOne OS"
          >
            <div className="w-full h-full bg-[#07170E] rounded-[10px] flex items-center justify-center">
              <Sprout className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-emerald-900/60">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-widest text-emerald-500/80 uppercase">
                {t(section.titleKey)}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = !item.isAction && currentTab === item.id;
              const itemLabel = t(item.labelKey);

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  title={collapsed ? itemLabel : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer relative ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/25 to-green-500/10 text-emerald-300 font-semibold border-l-3 border-emerald-400 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-emerald-950/40'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-emerald-400 scale-110' : 'text-zinc-400 group-hover:text-emerald-400'}`} />

                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{itemLabel}</span>
                      {item.badgeKey && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {t(item.badgeKey)}
                        </span>
                      )}
                    </div>
                  )}

                  {collapsed && item.badgeKey && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Area: User Profile, Language Selector & Collapse Toggle */}
      <div className="p-3 border-t border-emerald-900/60 bg-[#030905] shrink-0 space-y-2">
        {!collapsed && authUser && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#06180d] hover:bg-[#0a2314] border border-emerald-900/60 transition-colors">
            <div 
              onClick={onOpenProfile}
              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
              title="View / Edit Profile"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                {authUser.avatar_url ? (
                  <img src={authUser.avatar_url} alt={authUser.name} className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">{authUser.name}</div>
                <div className="text-[10px] text-emerald-400/70 font-mono truncate">{authUser.email}</div>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1 rounded-lg text-emerald-500 hover:text-red-400 transition-colors cursor-pointer shrink-0 ml-1"
                title={t('nav_sign_out')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {!collapsed ? (
          <div className="flex items-center justify-between pt-1">
            <LanguageSelector variant="compact" dropdownAlign="left" />
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg bg-[#071b10] border border-emerald-800/60 text-emerald-400 hover:text-white hover:border-emerald-500 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-lg bg-[#071b10] border border-emerald-800/60 text-emerald-400 hover:text-white hover:border-emerald-500 transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sticky / Fixed Left Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-in Drawer with Backdrop */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[280px] max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
