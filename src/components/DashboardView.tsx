import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Droplets, 
  Sprout, 
  TrendingUp, 
  CloudSun, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Radar, 
  MapPin, 
  ShieldCheck, 
  Bot,
  Wind,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Agri3DFieldTerrain } from './Agri3DFieldTerrain';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface DashboardViewProps {
  language?: SupportedLanguage;
  onNavigateTab: (tab: string) => void;
  onOpenAi: () => void;
  onOpenOnboarding: () => void;
  currentFarm?: any;
  authUser?: any;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenAi,
  onOpenOnboarding,
  currentFarm,
  authUser,
}) => {
  const { t } = useTranslation();
  const [farmData, setFarmData] = useState<any>(currentFarm || null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [mandiPrices, setMandiPrices] = useState<any[]>([]);
  const [irrigationSummary, setIrrigationSummary] = useState<any>(null);
  const [activeSoilMoisture, setActiveSoilMoisture] = useState(48);

  useEffect(() => {
    if (currentFarm) {
      setFarmData(currentFarm);
      fetchIrrigation(currentFarm);
    }
  }, [currentFarm]);

  useEffect(() => {
    // Fetch initial farm status if not already passed
    if (!currentFarm) {
      fetch('/api/farms')
        .then((r) => r.json())
        .then((d) => {
          if (d.configured && d.farm) {
            setFarmData(d.farm);
            fetchIrrigation(d.farm);
          } else if (d.farms?.length > 0) {
            setFarmData(d.farms[0]);
            fetchIrrigation(d.farms[0]);
          } else {
            setFarmData(null);
          }
        })
        .catch(console.error);
    }

    fetch('/api/tasks')
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []))
      .catch(console.error);

    fetch('/api/markets')
      .then((r) => r.json())
      .then((d) => setMandiPrices(d.markets?.slice(0, 4) || []))
      .catch(console.error);
  }, []);

  const fetchIrrigation = (farm: any) => {
    fetch('/api/irrigation/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop: farm.primary_crop || 'Wheat',
        growth_stage: 'mid',
        farm_area_acres: farm.acreage || 5.0,
        soil_type: farm.soil_type || 'clay_loam',
        irrigation_method: farm.irrigation_method || 'drip',
        current_soil_moisture_pct: 48,
      }),
    })
      .then((r) => r.json())
      .then((d) => setIrrigationSummary(d))
      .catch(console.error);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. If farmer has not completed farm setup, show a proper "Set Up Your Farm" flow banner */}
      {!farmData && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/80 via-emerald-950/90 to-amber-950/80 border-2 border-amber-500/70 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  {t('urgent')}
                </span>
                <span className="text-xs font-mono text-amber-400">● {t('dash_setup_prompt')}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {t('ob_modal_title')}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200/90 max-w-3xl leading-relaxed">
                {t('dash_setup_prompt')}
              </p>
            </div>

            <button
              onClick={onOpenOnboarding}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-500/30 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
            >
              <MapPin className="w-4 h-4 text-black" />
              <span>🌱 {t('dash_setup_btn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Welcome & Farm Profile Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#071d11] via-[#0a2817] to-[#071d11] border border-emerald-600/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {t('app_full_name')}
            </span>
            <span className={`text-xs font-mono ${farmData ? 'text-emerald-400' : 'text-amber-400'}`}>
              ● {farmData ? t('online') : t('pending')}
            </span>
            {authUser?.name && (
              <span className="text-xs font-mono text-emerald-300/80">
                • {new Date().getHours() < 12 ? t('dash_greeting_morning') : new Date().getHours() < 17 ? t('dash_greeting_afternoon') : t('dash_greeting_evening')}, <strong className="text-white font-sans">{authUser.name}</strong>
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {farmData ? farmData.name : t('dash_active_farm')}
          </h2>

          {farmData ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-300/80 font-mono">
              <span className="flex items-center gap-1.5 text-white">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{farmData.location_name}</span>
                <span className="text-[11px] text-emerald-400/90 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  {farmData.latitude.toFixed(4)}° N, {farmData.longitude.toFixed(4)}° E
                </span>
              </span>
              <span>•</span>
              <span>{t('farm_area_val', { value: farmData.acreage })}</span>
              <span>•</span>
              <span>{t('ob_lbl_soil_type')}: <strong className="text-white capitalize">{farmData.soil_type?.replace(/_/g, ' ')}</strong></span>
              <span>•</span>
              <span>{t('ob_lbl_irrigation_method')}: <strong className="text-white capitalize">{farmData.irrigation_method?.replace(/_/g, ' ')}</strong></span>
              <span>•</span>
              <span>{t('ob_lbl_primary_crop')}: <strong className="text-emerald-300 font-bold">{farmData.primary_crop}</strong></span>
              {farmData.field_name && (
                <>
                  <span>•</span>
                  <span>{t('fm_lbl_field_name')}: <strong className="text-white">{farmData.field_name}</strong></span>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-xs text-amber-300/80 font-mono">
              <span className="flex items-center gap-1 text-amber-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{t('ob_search_location')}</span>
              </span>
              <span>•</span>
              <span>{t('ob_lbl_acreage')}: --</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAi}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold hover:bg-emerald-500/30 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>{t('qa_ask_ai')}</span>
          </button>
          <button
            onClick={onOpenOnboarding}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {farmData ? t('btn_farm_profile') : t('dash_setup_btn')}
          </button>
        </div>
      </div>

      {/* Primary 4 Metric Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Metric 1: Soil Moisture */}
        <div 
          onClick={() => onNavigateTab('irrigation')}
          className="p-4 rounded-2xl bg-[#081e11] border border-emerald-700/40 hover:border-emerald-400 transition-all cursor-pointer group space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
            <span>{t('lbl_soil_moisture')}</span>
            <Droplets className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">48%</div>
          <div className="text-[11px] text-emerald-300/80 font-mono">
            {irrigationSummary?.status ? irrigationSummary.status.replace('_', ' ') : t('optimal')}
          </div>
        </div>

        {/* Metric 2: ET0 Net Water Demand */}
        <div 
          onClick={() => onNavigateTab('irrigation')}
          className="p-4 rounded-2xl bg-[#081e11] border border-emerald-700/40 hover:border-emerald-400 transition-all cursor-pointer group space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
            <span>{t('lbl_irrigation_need')}</span>
            <CloudSun className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
            {farmData ? (irrigationSummary?.gross_irrigation_depth_mm || '4.2') : '--'} <span className="text-sm font-normal text-emerald-500">mm</span>
          </div>
          <div className="text-[11px] text-emerald-300/80 font-mono">
            {farmData ? `Pump: ${irrigationSummary?.recommended_pump_hours || '2.1'}h` : t('dash_setup_prompt')}
          </div>
        </div>

        {/* Metric 3: Crop Health Index */}
        <div 
          onClick={() => onNavigateTab('crop_health')}
          className="p-4 rounded-2xl bg-[#081e11] border border-emerald-700/40 hover:border-emerald-400 transition-all cursor-pointer group space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
            <span>{t('lbl_crop_health')}</span>
            <Sprout className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">96.4%</div>
          <div className="text-[11px] text-emerald-400 font-mono">
            {farmData ? `${farmData.primary_crop}` : t('qa_scan_crop')}
          </div>
        </div>

        {/* Metric 4: Sentinel-2 NDVI */}
        <div 
          onClick={() => onNavigateTab('satellite')}
          className="p-4 rounded-2xl bg-[#081e11] border border-emerald-700/40 hover:border-emerald-400 transition-all cursor-pointer group space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
            <span>{t('lbl_satellite_ndvi')}</span>
            <Radar className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">0.76</div>
          <div className="text-[11px] text-emerald-300/80 font-mono">
            {farmData ? `${farmData.acreage} Ac` : t('badge_sentinel2')}
          </div>
        </div>

      </div>

      {/* Middle Grid: Live Weather & 3D Digital Twin Terrain */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Weather Intelligence Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
            <div>
              <span className="text-xs font-mono text-emerald-400">{t('dash_meteorology')}</span>
              <h3 className="text-lg font-bold text-white">
                {farmData ? farmData.location_name : t('dash_weather_title')}
              </h3>
              {farmData ? (
                <div className="text-[10px] font-mono text-emerald-400/90 mt-0.5">
                  Lat: {farmData.latitude.toFixed(4)}° N • Lon: {farmData.longitude.toFixed(4)}° E
                </div>
              ) : (
                <div className="text-[10px] font-mono text-amber-400/90 mt-0.5">
                  {t('dash_awaiting_location')}
                </div>
              )}
            </div>
            <CloudSun className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-black font-mono text-white">28°C</div>
              <div className="text-xs text-emerald-300/80 font-mono">{t('weather_partly_cloudy_humidity')}</div>
            </div>
            <div className="text-right text-xs font-mono text-emerald-400">
              <div>{t('weather_wind', { speed: '11 km/h NW' })}</div>
              <div>{t('weather_uv', { value: '6.2' })}</div>
              <div>{t('weather_rain_prob', { value: '15%' })}</div>
            </div>
          </div>

          {/* Agronomic Impact Summary */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-800/40 text-xs space-y-1">
            <div className="font-mono text-emerald-400 font-bold">{t('dash_agronomic_advisory')}:</div>
            <p className="text-emerald-100/90 leading-relaxed">
              {t('dash_spray_window_advisory')}
            </p>
          </div>

          {/* 4-Day Micro Forecast */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-1">
            <div className="p-2 rounded-lg bg-[#06140b] border border-emerald-900/50">
              <div className="text-emerald-500">Thu</div>
              <div className="text-white font-bold my-1">29°C</div>
              <div className="text-[10px] text-emerald-400">Clear</div>
            </div>
            <div className="p-2 rounded-lg bg-[#06140b] border border-emerald-900/50">
              <div className="text-emerald-500">Fri</div>
              <div className="text-white font-bold my-1">31°C</div>
              <div className="text-[10px] text-amber-400">Sunny</div>
            </div>
            <div className="p-2 rounded-lg bg-[#06140b] border border-emerald-900/50">
              <div className="text-emerald-500">Sat</div>
              <div className="text-white font-bold my-1">27°C</div>
              <div className="text-[10px] text-blue-400">Rain 8mm</div>
            </div>
            <div className="p-2 rounded-lg bg-[#06140b] border border-emerald-900/50">
              <div className="text-emerald-500">Sun</div>
              <div className="text-white font-bold my-1">26°C</div>
              <div className="text-[10px] text-emerald-400">Humid</div>
            </div>
          </div>
        </div>

        {/* 3D Digital Twin Terrain View */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
            <div>
              <span className="text-xs font-mono text-emerald-400">{t('dash_3d_twin')}</span>
              <h3 className="text-lg font-bold text-white">{t('dash_terrain_topography')}</h3>
            </div>
            <button
              onClick={() => onNavigateTab('satellite')}
              className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dash_full_remote_sensing')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-[260px] rounded-xl overflow-hidden bg-black/40 border border-emerald-500/20 relative">
            <Agri3DFieldTerrain moistureLevel={activeSoilMoisture} activeIrrigation={true} />
          </div>
        </div>

      </div>

      {/* Bottom Grid: APMC Mandi Tickers & Farm Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Mandi Tickers */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{t('dash_mandi_feeds')}</span>
            </h3>
            <button
              onClick={() => onNavigateTab('markets')}
              className="text-xs font-mono text-emerald-400 hover:underline cursor-pointer"
            >
              {t('dash_all_mandis')}
            </button>
          </div>

          <div className="space-y-2.5">
            {mandiPrices.map((m) => (
              <div
                key={m.id}
                onClick={() => onNavigateTab('markets')}
                className="p-3 rounded-xl bg-[#06140b] border border-emerald-900/50 hover:border-emerald-700 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-white">{m.commodity}</div>
                  <div className="text-[10px] text-emerald-400/70 font-mono">{m.primary_mandi}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold font-mono text-emerald-300">₹{m.modal_price}/qtl</div>
                  <div className={`text-[10px] font-mono ${
                    m.weekly_change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {m.weekly_change_pct >= 0 ? `+${m.weekly_change_pct}%` : `${m.weekly_change_pct}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Farm Scheduled Tasks */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{t('dash_priority_tasks')}</span>
            </h3>
            <button
              onClick={() => onNavigateTab('farm_mgmt')}
              className="text-xs font-mono text-emerald-400 hover:underline cursor-pointer"
            >
              {t('dash_open_manager')}
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-[#06140b] border border-emerald-900/50 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      task.priority === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="font-semibold text-white truncate max-w-xs">{task.title}</span>
                  </div>
                  <div className="text-[10px] text-emerald-400/80 font-mono">
                    Sector: {task.field_name} • Due: {task.due_date}
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
