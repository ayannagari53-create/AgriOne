import React, { useState } from 'react';
import { Droplets, Clock, AlertTriangle, CheckCircle2, Waves, ArrowRight, Gauge } from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface IrrigationCalculatorProps {
  language?: SupportedLanguage;
  currentFarm?: any;
}

export const IrrigationCalculator: React.FC<IrrigationCalculatorProps> = ({ currentFarm }) => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState(currentFarm?.primary_crop?.toLowerCase() || 'wheat');
  const [growthStage, setGrowthStage] = useState('mid');
  const [farmAcres, setFarmAcres] = useState(currentFarm?.acreage || 5.0);
  const [soilType, setSoilType] = useState(currentFarm?.soil_type || 'clay_loam');
  const [irrigationMethod, setIrrigationMethod] = useState(currentFarm?.irrigation_method || 'drip');
  const [tMin, setTMin] = useState(21.0);
  const [tMax, setTMax] = useState(33.0);
  const [rainForecast, setRainForecast] = useState(0.0);
  const [soilMoisture, setSoilMoisture] = useState(48.0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  React.useEffect(() => {
    if (currentFarm) {
      if (currentFarm.primary_crop) setCrop(currentFarm.primary_crop.toLowerCase());
      if (currentFarm.acreage) setFarmAcres(currentFarm.acreage);
      if (currentFarm.soil_type) setSoilType(currentFarm.soil_type);
      if (currentFarm.irrigation_method) setIrrigationMethod(currentFarm.irrigation_method);
    }
  }, [currentFarm]);

  const calculateIrrigation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/irrigation/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop,
          growth_stage: growthStage,
          farm_area_acres: farmAcres,
          soil_type: soilType,
          irrigation_method: irrigationMethod,
          t_min: tMin,
          t_max: tMax,
          rain_forecast_mm: rainForecast,
          current_soil_moisture_pct: soilMoisture,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Run calculation on initial render
  React.useEffect(() => {
    calculateIrrigation();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <span>{t('badge_fao56')} PENMAN-MONTEITH DUAL KC MODEL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('irr_title')}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            {t('irr_subtitle')}
          </p>
        </div>

        <button
          onClick={calculateIrrigation}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Droplets className="w-4 h-4" />
          <span>{loading ? t('calculating') : t('irr_btn_calculate')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Parameters Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 space-y-5 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>{t('irr_field_parameters')}</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('irr_lbl_crop')}</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-400 outline-none"
              >
                <option value="wheat">Wheat</option>
                <option value="rice">Rice / Paddy</option>
                <option value="cotton">Bt Cotton</option>
                <option value="tomato">Tomato</option>
                <option value="maize">Maize / Corn</option>
                <option value="sugarcane">Sugarcane</option>
                <option value="potato">Potato</option>
                <option value="soybean">Soybean</option>
                <option value="onion">Onion</option>
                <option value="chilli">Chilli</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('irr_lbl_stage')}</label>
              <select
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-400 outline-none"
              >
                <option value="initial">Initial / Seedling (Kc ~0.35)</option>
                <option value="mid">Mid-Season / Reproductive (Kc ~1.15)</option>
                <option value="late">Late / Maturation (Kc ~0.50)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('irr_lbl_area')}</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="500"
                value={farmAcres}
                onChange={(e) => setFarmAcres(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('irr_lbl_soil')}</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-400 outline-none"
              >
                <option value="clay_loam">Clay Loam (AWC 170 mm/m)</option>
                <option value="black_cotton">Black Cotton Soil (AWC 190 mm/m)</option>
                <option value="loam">Alluvial Loam (AWC 150 mm/m)</option>
                <option value="sandy_loam">Sandy Loam (AWC 120 mm/m)</option>
                <option value="clay">Heavy Clay (AWC 180 mm/m)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-emerald-300 block mb-1">{t('irr_lbl_irrigation_method')}</label>
            <select
              value={irrigationMethod}
              onChange={(e) => setIrrigationMethod(e.target.value)}
              className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-400 outline-none"
            >
              <option value="drip">Drip Irrigation (90% Efficiency)</option>
              <option value="sub_surface_drip">Sub-Surface Drip (95% Efficiency)</option>
              <option value="sprinkler">Sprinkler System (75% Efficiency)</option>
              <option value="furrow">Furrow Irrigation (60% Efficiency)</option>
              <option value="flood">Flood / Basin (50% Efficiency)</option>
            </select>
          </div>

          {/* Sliders for real-time field state */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-mono text-emerald-300 mb-1">
                <span>{t('lbl_soil_moisture')}</span>
                <span className="font-bold text-white">{soilMoisture}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="95"
                value={soilMoisture}
                onChange={(e) => setSoilMoisture(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-emerald-600 font-mono">
                <span>Wilting Point (20%)</span>
                <span>Field Capacity (70%)</span>
                <span>Saturation (90%)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-emerald-300 mb-1">
                <span>24h Rain Offset</span>
                <span className="font-bold text-white">{rainForecast} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={rainForecast}
                onChange={(e) => setRainForecast(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-mono text-emerald-400">Min Temp (°C)</label>
                <input
                  type="number"
                  value={tMin}
                  onChange={(e) => setTMin(parseFloat(e.target.value) || 15)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded p-1.5 text-xs text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-emerald-400">Max Temp (°C)</label>
                <input
                  type="number"
                  value={tMax}
                  onChange={(e) => setTMax(parseFloat(e.target.value) || 30)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded p-1.5 text-xs text-white mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Output Card */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="p-6 rounded-2xl bg-[#092214] border border-emerald-600/40 shadow-2xl space-y-6">
              
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    result.status === 'URGENT_IRRIGATION' ? 'bg-amber-500/20 text-amber-400' :
                    result.status === 'SUSPEND_IRRIGATION' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {result.status === 'URGENT_IRRIGATION' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-xs font-mono text-emerald-400/80 uppercase">{t('irr_results_heading')}</div>
                    <div className="text-base font-bold text-white">{result.status.replace('_', ' ')}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-emerald-400/80">Water Saved vs Flood</div>
                  <div className="text-xl font-bold font-mono text-emerald-300">
                    +{result.water_saving_pct_vs_flood}%
                  </div>
                </div>
              </div>

              {/* Core Output Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50">
                  <span className="text-[11px] font-mono text-emerald-400 block mb-1">{t('irr_res_net_depth')}</span>
                  <span className="text-2xl font-black font-mono text-white">{result.gross_irrigation_depth_mm}</span>
                  <span className="text-xs text-emerald-400/70 ml-1">mm</span>
                </div>

                <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50">
                  <span className="text-[11px] font-mono text-emerald-400 block mb-1">{t('irr_res_gross_volume')}</span>
                  <span className="text-2xl font-black font-mono text-white">{(result.total_water_liters).toLocaleString()}</span>
                  <span className="text-xs text-emerald-400/70 ml-1">L</span>
                </div>

                <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50">
                  <span className="text-[11px] font-mono text-emerald-400 block mb-1">{t('irr_res_pump_runtime')}</span>
                  <span className="text-2xl font-black font-mono text-emerald-300">{result.recommended_pump_hours}</span>
                  <span className="text-xs text-emerald-400/70 ml-1">h</span>
                </div>

                <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50">
                  <span className="text-[11px] font-mono text-emerald-400 block mb-1">{t('irr_res_etc_daily')}</span>
                  <span className="text-2xl font-black font-mono text-white">{result.reference_et0_mm}</span>
                  <span className="text-xs text-emerald-400/70 ml-1">mm/day</span>
                </div>
              </div>

              {/* Timing & Operational Guidance */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold uppercase">Optimal Irrigation Timing</span>
                </div>
                <p className="text-sm text-emerald-100 font-medium">
                  {result.recommended_timing}
                </p>
                <p className="text-xs text-emerald-400/70 font-mono pt-1">
                  {result.fao_notes}
                </p>
              </div>

              {/* Water Breakdown Formula Summary */}
              <div className="p-4 rounded-xl bg-black/30 border border-emerald-900/40 space-y-2 text-xs font-mono text-emerald-300/80">
                <div className="text-white font-semibold flex items-center justify-between">
                  <span>FAO-56 Water Balance Breakdown</span>
                  <span className="text-emerald-400">Crop Kc: {result.kc_factor}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>• Daily ETc Loss: {result.crop_etc_daily_mm} mm</div>
                  <div>• Rainfall Offset: -{result.effective_rain_offset_mm} mm</div>
                  <div>• Application Efficiency: {result.irrigation_efficiency_pct}%</div>
                  <div>• Total Volumetric: {result.total_water_cubic_m} m³</div>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-emerald-400/50 font-mono">
              Loading FAO-56 Engine calculation...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
