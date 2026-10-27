/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LandingHero } from './components/LandingHero';
import { DashboardView } from './components/DashboardView';
import { IrrigationCalculator } from './components/IrrigationCalculator';
import { CropHealthScanner } from './components/CropHealthScanner';
import { MarketPricesView } from './components/MarketPricesView';
import { CropRecommenderView } from './components/CropRecommenderView';
import { SoilHealthView } from './components/SoilHealthView';
import { SatelliteNdviView } from './components/SatelliteNdviView';
import { FarmManagerView } from './components/FarmManagerView';
import { SupplyChainView } from './components/SupplyChainView';
import { LivestockView } from './components/LivestockView';
import { MarketplaceView } from './components/MarketplaceView';
import { FinanceInsuranceView } from './components/FinanceInsuranceView';
import { AiAssistantModal } from './components/AiAssistantModal';
import { FarmerOnboardingModal, FarmProfileData } from './components/FarmerOnboardingModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthPage, AuthUser } from './components/AuthPage';
import { SupportedLanguage } from './translations';
import { useLanguage } from './context/LanguageContext';
import { Bot, Loader2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const { language, setLanguage, t } = useLanguage();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [currentFarm, setCurrentFarm] = useState<FarmProfileData | null>(null);
  const [isInitialSetup, setIsInitialSetup] = useState<boolean>(false);
  
  // Authentication State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Verify existing session on initial mount (supports both localStorage and HttpOnly session cookies)
  useEffect(() => {
    const savedToken = localStorage.getItem('agrione_token');

    fetch(`/api/auth/me${savedToken ? `?token=${encodeURIComponent(savedToken)}` : ''}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        ...(savedToken ? { 'Authorization': `Bearer ${savedToken}` } : {}),
      },
    })
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`HTTP error ${r.status}`);
        }
        return r.json();
      })
      .then((d) => {
        if (d && d.authenticated && d.user) {
          if (d.token) {
            localStorage.setItem('agrione_token', d.token);
          }
          localStorage.setItem('agrione_user', JSON.stringify(d.user));
          setAuthUser(d.user);
          if (d.has_farm && d.farm) {
            setCurrentFarm(d.farm);
            if (window.location.search.includes('setup=true')) {
              setOnboardingOpen(true);
            }
          } else {
            setCurrentFarm(null);
            setOnboardingOpen(true);
            setIsInitialSetup(true);
          }
          if (window.location.search.includes('setup=true')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          localStorage.removeItem('agrione_token');
          localStorage.removeItem('agrione_user');
          setAuthUser(null);
        }
      })
      .catch((err) => {
        console.warn('Session verification notice:', err);
        localStorage.removeItem('agrione_token');
        localStorage.removeItem('agrione_user');
        setAuthUser(null);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  const handleAuthSuccess = (user: AuthUser, token: string, hasFarm: boolean, farmData?: any) => {
    setAuthUser(user);
    if (user) {
      localStorage.setItem('agrione_user', JSON.stringify(user));
    }
    if (hasFarm && farmData) {
      setCurrentFarm(farmData);
      setIsInitialSetup(false);
      setOnboardingOpen(false);
    } else {
      setCurrentFarm(null);
      setIsInitialSetup(true);
      setOnboardingOpen(true);
    }
    setCurrentTab('dashboard');
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('agrione_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    localStorage.removeItem('agrione_token');
    localStorage.removeItem('agrione_user');
    setAuthUser(null);
    setCurrentFarm(null);
    setOnboardingOpen(false);
    setProfileOpen(false);
    setIsInitialSetup(false);
  };

  const handleFarmSaved = (savedFarm: FarmProfileData) => {
    setCurrentFarm(savedFarm);
    setIsInitialSetup(false);
    setOnboardingOpen(false);
  };

  // 1. Initial Authentication Check Loader
  if (authChecking) {
    return (
      <div className="h-screen w-screen bg-[#030905] text-emerald-400 flex flex-col items-center justify-center space-y-4 font-mono">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🌾</span>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400 absolute -bottom-2 -right-2" />
        </div>
        <div className="text-center space-y-1">
          <div className="text-sm font-bold tracking-wider text-white">AGRIONE OS</div>
          <div className="text-xs text-emerald-500/80">Verifying secure agronomic session...</div>
        </div>
      </div>
    );
  }

  // 2. If user is not authenticated, render the dedicated futuristic AuthPage (No dashboard sidebar)
  if (!authUser) {
    return (
      <AuthPage
        language={language}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // 3. Authenticated Experience with Left Sidebar & Full Command Center
  return (
    <div className="flex h-screen w-screen bg-[#050C07] text-[#E2ECE5] font-sans overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* 1. App-Style Left Sidebar (Fixed / Sticky with Vertical Scrolling) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        openAiAssistant={() => setAiModalOpen(true)}
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        authUser={authUser}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area (Adapts to Sidebar Width, Independent Scroll) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header Bar (No Horizontal Module Nav) */}
        <TopHeader
          currentTab={currentTab}
          language={language}
          setLanguage={setLanguage}
          openAiAssistant={() => setAiModalOpen(true)}
          onOpenOnboarding={() => setOnboardingOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenMobileMenu={() => setMobileOpen(true)}
          authUser={authUser}
          onLogout={handleLogout}
        />

        {/* View Content Router */}
        <main className="flex-1 min-w-0 pb-12">
          {currentTab === 'overview' && (
            <LandingHero
              language={language}
              onLaunchPortal={() => setCurrentTab('dashboard')}
              onSelectFeature={(feature) => setCurrentTab(feature)}
              onOpenAi={() => setAiModalOpen(true)}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              key={currentFarm ? currentFarm.id || currentFarm.name : 'unset'}
              currentFarm={currentFarm}
              authUser={authUser}
              language={language}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenAi={() => setAiModalOpen(true)}
              onOpenOnboarding={() => setOnboardingOpen(true)}
            />
          )}

          {currentTab === 'irrigation' && (
            <IrrigationCalculator language={language} currentFarm={currentFarm} />
          )}
          {currentTab === 'crop_health' && <CropHealthScanner language={language} />}
          {currentTab === 'markets' && <MarketPricesView language={language} />}
          {currentTab === 'crop_rec' && <CropRecommenderView language={language} />}
          {currentTab === 'soil' && <SoilHealthView language={language} />}
          {currentTab === 'satellite' && (
            <SatelliteNdviView 
              language={language} 
              currentFarm={currentFarm}
              onOpenOnboarding={() => setOnboardingOpen(true)}
            />
          )}
          {currentTab === 'farm_mgmt' && (
            <FarmManagerView 
              key={currentFarm ? currentFarm.id || currentFarm.name : 'unset_mgmt'}
              language={language} 
              currentFarm={currentFarm}
              authUser={authUser}
              onOpenOnboarding={() => setOnboardingOpen(true)}
            />
          )}
          {currentTab === 'supply_chain' && <SupplyChainView language={language} />}
          {currentTab === 'livestock' && <LivestockView language={language} />}
          {currentTab === 'marketplace' && <MarketplaceView language={language} />}
          {currentTab === 'finance' && <FinanceInsuranceView language={language} />}
          {currentTab === 'weather' && (
            <div className="max-w-7xl mx-auto px-4 py-4">
              <DashboardView
                key={`weather_${currentFarm ? currentFarm.id || currentFarm.name : 'unset'}`}
                language={language}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onOpenAi={() => setAiModalOpen(true)}
                onOpenOnboarding={() => setOnboardingOpen(true)}
              />
            </div>
          )}
        </main>

        {/* Enterprise Dark Agriculture Footer */}
        <footer className="w-full bg-[#040C07] border-t border-emerald-950/80 py-8 text-xs text-emerald-400/70 font-mono mt-auto shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                🌾
              </div>
              <span className="font-bold text-white text-xs">{t('app_full_name')} • {t('app_name')}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{t('core_online')}</span>
              </span>
              <span>•</span>
              <span>{t('badge_fao56')} Evapotranspiration</span>
              <span>•</span>
              <span>{t('badge_sentinel2')} MSI L2A</span>
              <span>•</span>
              <span>{t('badge_gemini')} AI</span>
            </div>

            <div className="text-[10px] text-emerald-500 font-medium">
              {t('tagline')}
            </div>
          </div>
        </footer>

      </div>

      {/* Floating AI Voice Interaction Button */}
      <button
        onClick={() => setAiModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-xs shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all cursor-pointer group"
        title="Open AgriOne AI Farmer Assistant"
      >
        <Bot className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" />
        <span className="font-mono tracking-wide">AgriOne AI</span>
        <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
      </button>

      {/* Modals */}
      <AiAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        language={language}
        currentFarm={currentFarm}
        authUser={authUser}
      />

      <FarmerOnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        language={language}
        currentFarm={currentFarm}
        authUser={authUser}
        isInitialSetup={isInitialSetup}
        onFarmSaved={handleFarmSaved}
      />

      <UserProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        authUser={authUser}
        currentFarm={currentFarm}
        onProfileUpdated={(updated) => setAuthUser(updated)}
        onOpenFarmSetup={() => setOnboardingOpen(true)}
      />

    </div>
  );
}
