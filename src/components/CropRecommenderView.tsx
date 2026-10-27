import React, { useState } from 'react';
import { Sprout, CheckCircle2, AlertTriangle, ArrowRight, Gauge, DollarSign, Droplets } from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface CropRecommenderViewProps {
  language?: SupportedLanguage;
}

export const CropRecommenderView: React.FC<CropRecommenderViewProps> = () => {
  const { t } = useTranslation();
  const [soilPh, setSoilPh] = useState(6.8);
  const [nitrogen, setNitrogen] = useState(110);
  const [phosphorus, setPhosphorus] = useState(55);
  const [potassium, setPotassium] = useState(45);
  const [soilType, setSoilType] = useState('loam');
  const [temp, setTemp] = useState(25.0);
  const [waterAvail, setWaterAvail] = useState('moderate');
  const [season, setSeason] = useState('kharif');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crop-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soil_ph: soilPh,
          nitrogen_kg: nitrogen,
          phosphorus_kg: phosphorus,
          potassium_kg: potassium,
          soil_type: soilType,
          avg_temperature_c: temp,
          water_availability: waterAvail,
          season,
        }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <Sprout className="w-3.5 h-3.5" />
            <span>AGRONOMIC MULTI-CRITERIA DECISION SUPPORT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('rec_title')}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            {t('rec_subtitle')}
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Sprout className="w-4 h-4" />
          <span>{loading ? t('analyzing') : t('rec_btn_evaluate')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form: Soil & Environmental Profile */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 space-y-5 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>{t('irr_field_parameters')}</span>
          </h3>

          <div>
            <div className="flex justify-between text-xs font-mono text-emerald-300 mb-1">
              <span>{t('soil_lbl_ph')}</span>
              <span className="font-bold text-white">{soilPh}</span>
            </div>
            <input
              type="range"
              min="4.5"
              max="9.0"
              step="0.1"
              value={soilPh}
              onChange={(e) => setSoilPh(parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-emerald-600 font-mono">
              <span>Acidic (4.5)</span>
              <span>Neutral (7.0)</span>
              <span>Alkaline (9.0)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-mono text-emerald-400 block mb-1">Nitrogen (N)</label>
              <input
                type="number"
                value={nitrogen}
                onChange={(e) => setNitrogen(parseInt(e.target.value) || 0)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded p-2 text-xs text-white"
              />
              <span className="text-[10px] text-emerald-600 font-mono">kg/ha</span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-emerald-400 block mb-1">Phosphorus (P)</label>
              <input
                type="number"
                value={phosphorus}
                onChange={(e) => setPhosphorus(parseInt(e.target.value) || 0)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded p-2 text-xs text-white"
              />
              <span className="text-[10px] text-emerald-600 font-mono">kg/ha</span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-emerald-400 block mb-1">Potassium (K)</label>
              <input
                type="number"
                value={potassium}
                onChange={(e) => setPotassium(parseInt(e.target.value) || 0)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded p-2 text-xs text-white"
              />
              <span className="text-[10px] text-emerald-600 font-mono">kg/ha</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('ob_lbl_soil_type')}</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="loam">Alluvial Loam</option>
                <option value="clay_loam">Clay Loam</option>
                <option value="black_cotton">Black Cotton</option>
                <option value="sandy_loam">Sandy Loam</option>
                <option value="red_soil">Red Soil</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('rec_lbl_water_source')}</label>
              <select
                value={waterAvail}
                onChange={(e) => setWaterAvail(e.target.value)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="high">High (Canal / Borewell)</option>
                <option value="moderate">Moderate (Drip / Tubewell)</option>
                <option value="low">Low (Rainfed / Deficit)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">Avg Temperature (°C)</label>
              <input
                type="number"
                value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value) || 20)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('rec_lbl_season')}</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="kharif">Kharif (Monsoon)</option>
                <option value="rabi">Rabi (Winter)</option>
                <option value="zaid">Zaid (Summer)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Output: Ranked Crop Cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="text-xs font-mono text-emerald-400">
            SUITABILITY RANKINGS ({recommendations.length} CROPS EVALUATED)
          </div>

          <div className="space-y-4">
            {recommendations.map((crop, idx) => (
              <div
                key={crop.id}
                className="p-5 rounded-2xl bg-[#092214] border border-emerald-700/40 hover:border-emerald-400 transition-all shadow-xl space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <h4 className="text-lg font-bold text-white">{crop.name}</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                        {crop.category}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200/70 mt-1 max-w-xl">{crop.description}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono text-emerald-400/80">{t('rec_suitability_score')}</div>
                    <div className="text-2xl font-black font-mono text-emerald-300">
                      {crop.match_score}%
                    </div>
                  </div>
                </div>

                {/* Key Agronomic Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#06140b] border border-emerald-900/50">
                    <span className="text-emerald-500 block text-[10px]">{t('days_val', { value: '' }).trim() || 'Period'}</span>
                    <span className="text-white font-semibold">{crop.growing_period}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#06140b] border border-emerald-900/50">
                    <span className="text-emerald-500 block text-[10px]">{t('lbl_irrigation_need')}</span>
                    <span className="text-white font-semibold">{crop.water_requirement_mm} mm</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#06140b] border border-emerald-900/50">
                    <span className="text-emerald-500 block text-[10px]">{t('rec_est_yield')}</span>
                    <span className="text-white font-semibold">{crop.yield_potential_quintal_acre} qtl</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#06140b] border border-emerald-900/50">
                    <span className="text-emerald-500 block text-[10px]">{t('rec_est_revenue')}</span>
                    <span className="text-emerald-300 font-bold">₹{crop.estimated_gross_revenue_acre.toLocaleString()}</span>
                  </div>
                </div>

                {/* Why it Fits Section */}
                <div className="space-y-2 pt-2 border-t border-emerald-900/50">
                  <div className="text-xs font-mono text-emerald-300 font-bold uppercase">
                    Agronomic Match Justification:
                  </div>
                  <ul className="space-y-1 text-xs text-emerald-100">
                    {crop.why_it_fits.map((reason: string, rIdx: number) => (
                      <li key={rIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>

                  {crop.agronomic_cautions.length > 0 && (
                    <ul className="space-y-1 text-xs text-amber-200/90 pt-1">
                      {crop.agronomic_cautions.map((caution: string, cIdx: number) => (
                        <li key={cIdx} className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <span>{caution}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
