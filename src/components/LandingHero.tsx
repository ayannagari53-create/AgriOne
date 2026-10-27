import React from 'react';
import { 
  Sprout, 
  Droplets, 
  Cpu, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  Radar, 
  Leaf, 
  Sparkles,
  Bot
} from 'lucide-react';
import { Agri3DGlobe } from './Agri3DGlobe';
import { Agri3DFieldTerrain } from './Agri3DFieldTerrain';
import { SupportedLanguage, TRANSLATIONS } from '../translations';

interface LandingHeroProps {
  onLaunchPortal: () => void;
  language: SupportedLanguage;
  onSelectFeature: (featureId: string) => void;
  onOpenAi: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onLaunchPortal,
  language,
  onSelectFeature,
  onOpenAi,
}) => {
  const t = (key: string) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;

  return (
    <div className="relative w-full overflow-hidden bg-[#050C07] text-[#E2ECE5]">
      {/* Background ambient radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-emerald-300 font-medium tracking-wider uppercase">
                PYTHON CORE & FAO-56 ENGINE ONLINE
              </span>
              <span className="text-emerald-500/80 text-xs">|</span>
              <span className="text-xs font-mono text-emerald-400/90 font-medium">
                SENTINEL-2 ACTIVE
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              {t('tagline').split('.')[0]}.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-lime-300">
                {t('tagline').split('.')[1] || 'Complete Agriculture Intelligence.'}
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-emerald-100/70 max-w-2xl mx-auto lg:mx-0 font-sans leading-relaxed">
              {t('subtagline')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onLaunchPortal}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer group"
              >
                <span>{t('btn_get_started')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenAi}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#092214] hover:bg-[#0d2e1b] border border-emerald-600/40 text-emerald-300 text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>{t('btn_ask_ai')}</span>
              </button>

              <button
                onClick={() => onSelectFeature('irrigation')}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-black/40 hover:bg-black/60 border border-emerald-800/40 text-emerald-200 text-sm font-medium transition-all"
              >
                <Droplets className="w-4 h-4 text-emerald-400" />
                <span>FAO-56 Irrigation</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-emerald-900/50">
              <div className="p-3 rounded-lg bg-[#07190e]/60 border border-emerald-900/40">
                <div className="text-xl font-bold font-mono text-emerald-400">{t('hero_stat_accuracy')}</div>
                <div className="text-[11px] text-emerald-300/70 font-sans">Leaf Disease CV</div>
              </div>
              <div className="p-3 rounded-lg bg-[#07190e]/60 border border-emerald-900/40">
                <div className="text-xl font-bold font-mono text-emerald-400">{t('hero_stat_water')}</div>
                <div className="text-[11px] text-emerald-300/70 font-sans">Water Consumption</div>
              </div>
              <div className="p-3 rounded-lg bg-[#07190e]/60 border border-emerald-900/40">
                <div className="text-xl font-bold font-mono text-emerald-400">{t('hero_stat_farmers')}</div>
                <div className="text-[11px] text-emerald-300/70 font-sans">Registered Farms</div>
              </div>
              <div className="p-3 rounded-lg bg-[#07190e]/60 border border-emerald-900/40">
                <div className="text-xl font-bold font-mono text-emerald-400">{t('hero_stat_coverage')}</div>
                <div className="text-[11px] text-emerald-300/70 font-sans">APMC Mandi Feeds</div>
              </div>
            </div>

          </div>

          {/* Right 3D Globe Visualization */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full max-w-[540px] aspect-square relative rounded-3xl bg-gradient-to-b from-[#0a2315]/50 to-[#040d07]/90 border border-emerald-600/30 backdrop-blur-xl p-2 shadow-2xl shadow-emerald-950/80">
              <Agri3DGlobe />
            </div>
          </div>

        </div>
      </section>

      {/* Core Intelligence Architecture Banner */}
      <section className="relative border-y border-emerald-900/60 bg-[#06140b]/70 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">
              AGRIONE INTELLIGENCE PIPELINE
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              How AgriOne Converts Raw Field Data Into Action
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#092113] border border-emerald-700/40 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm mb-3">
                  01
                </div>
                <h4 className="font-bold text-white text-sm mb-1">AI Interprets</h4>
                <p className="text-xs text-emerald-200/70">
                  Parses questions in Hindi, Kannada, Telugu, Tamil, Marathi, Malayalam or English via speech and text.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-900/60 text-[11px] font-mono text-emerald-400">
                Natural Language & Vision
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#092113] border border-emerald-700/40 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm mb-3">
                  02
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Rule Engine Validates</h4>
                <p className="text-xs text-emerald-200/70">
                  Cross-references agronomic bounds, soil pH tolerances, and pathogen etiology in Python.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-900/60 text-[11px] font-mono text-emerald-400">
                Phytopathology & Agronomy
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#092113] border border-emerald-700/40 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm mb-3">
                  03
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Data Calculates</h4>
                <p className="text-xs text-emerald-200/70">
                  Computes exact Penman-Monteith ET0, volumetric water needs, NPK dosages, and Mandi price trends.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-900/60 text-[11px] font-mono text-emerald-400">
                FAO-56 & APMC Feeds
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#092113] border border-emerald-700/40 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm mb-3">
                  04
                </div>
                <h4 className="font-bold text-white text-sm mb-1">AI Explains</h4>
                <p className="text-xs text-emerald-200/70">
                  Delivers clear, step-by-step guidance in farmer-friendly terminology with exact dosages and timing.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-900/60 text-[11px] font-mono text-emerald-400">
                Actionable Field Solutions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Modules Ecosystem Grid */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
              COMPREHENSIVE AGRICULTURE SUITE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Every Module Connected to Real Logic
            </h2>
          </div>
          <p className="text-sm text-emerald-200/70 max-w-md mt-2 md:mt-0">
            No placeholder cards. Each module is supported by dedicated Python computation and verified agronomic algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Crop Health CV */}
          <div 
            onClick={() => onSelectFeature('crop_health')}
            className="group p-6 rounded-2xl bg-[#081f12] border border-emerald-700/40 hover:border-emerald-400 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/30 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                🌱 Crop Disease CV Diagnostics
              </h3>
              <p className="text-xs text-emerald-200/70 leading-relaxed mb-4">
                Upload or capture leaf scans. The Python CV engine extracts necrotic spot clustering, chlorosis ratio, and identifies pathogens with confidence ratings and chemical/organic treatments.
              </p>
            </div>
            <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>98.2% Accuracy</span>
              <span className="group-hover:translate-x-1 transition-transform">Diagnose →</span>
            </div>
          </div>

          {/* Card 2: Smart Irrigation */}
          <div 
            onClick={() => onSelectFeature('irrigation')}
            className="group p-6 rounded-2xl bg-[#081f12] border border-emerald-700/40 hover:border-emerald-400 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/30 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                💧 FAO-56 Smart Irrigation
              </h3>
              <p className="text-xs text-emerald-200/70 leading-relaxed mb-4">
                Calculates daily Reference Evapotranspiration (ET0) using Hargreaves & Penman-Monteith formulas, dynamically factoring crop Kc stages, soil moisture, and rainfall forecasts.
              </p>
            </div>
            <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>Save up to 35% water</span>
              <span className="group-hover:translate-x-1 transition-transform">Calculate →</span>
            </div>
          </div>

          {/* Card 3: Mandi Price Intelligence */}
          <div 
            onClick={() => onSelectFeature('markets')}
            className="group p-6 rounded-2xl bg-[#081f12] border border-emerald-700/40 hover:border-emerald-400 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/30 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                💰 APMC Mandi Intelligence
              </h3>
              <p className="text-xs text-emerald-200/70 leading-relaxed mb-4">
                Live commodity prices across major mandis (Azadpur, Khanna, Indore, Rajkot, Guntur, Kolar). Modal prices, arrivals volume, and 7-day trajectories.
              </p>
            </div>
            <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>Real wholesale feeds</span>
              <span className="group-hover:translate-x-1 transition-transform">Check Prices →</span>
            </div>
          </div>

          {/* Card 4: Satellite & Drone NDVI */}
          <div 
            onClick={() => onSelectFeature('satellite')}
            className="group p-6 rounded-2xl bg-[#081f12] border border-emerald-700/40 hover:border-emerald-400 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/30 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Radar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                🛰️ Satellite & Field Zonation
              </h3>
              <p className="text-xs text-emerald-200/70 leading-relaxed mb-4">
                Sentinel-2 multispectral index calculator (NDVI, NDWI, SAVI, EVI). Identifies moisture stress sectors and canopy vigor anomalies across field acreage.
              </p>
            </div>
            <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>Sentinel-2 Spectral MSI</span>
              <span className="group-hover:translate-x-1 transition-transform">View Indices →</span>
            </div>
          </div>

          {/* Card 5: Crop Recommender */}
          <div 
            onClick={() => onSelectFeature('crop_rec')}
            className="group p-6 rounded-2xl bg-[#081f12] border border-emerald-700/40 hover:border-emerald-400 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/30 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                🌾 Agronomic Crop Recommender
              </h3>
              <p className="text-xs text-emerald-200/70 leading-relaxed mb-4">
                Multi-criteria suitability scoring factoring soil pH, NPK levels, local temperature, water capacity, and market economics with detailed explanations of why each crop fits.
              </p>
            </div>
            <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>Multi-criteria Agronomy</span>
              <span className="group-hover:translate-x-1 transition-transform">Rank Crops →</span>
            </div>
          </div>

          {/* Card 6: Soil Health Diagnostics */}
          <div 
            onClick={() => onSelectFeature('soil')}
            className="group p-6 rounded-2xl bg-[#081f12] border border-emerald-700/40 hover:border-emerald-400 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/30 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                🧪 Soil Health Studio
              </h3>
              <p className="text-xs text-emerald-200/70 leading-relaxed mb-4">
                Soil test card interpreter calculating precise fertilizer requirements (Urea, DAP, MOP), lime/gypsum soil amendments, and biological soil health restoration.
              </p>
            </div>
            <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>NPK & Micronutrients</span>
              <span className="group-hover:translate-x-1 transition-transform">Analyze Soil →</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3D Digital Twin Terrain Showcase */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#07190e] via-[#0b2817] to-[#07190e] border border-emerald-600/40 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                DIGITAL TWIN FIELD MODELING
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Interactive 3D Field & Terrain Micro-Climates
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/70 leading-relaxed">
                Experience precision agriculture in Three.js WebGL. Monitor canopy density, soil moisture saturation gradients, and simulate drip emitter flow in real-time.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={onLaunchPortal}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  Open Command Center
                </button>
              </div>
            </div>
            <div className="lg:col-span-7 h-[360px] rounded-2xl bg-black/40 border border-emerald-500/20 overflow-hidden relative">
              <Agri3DFieldTerrain moistureLevel={54} activeIrrigation={true} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
