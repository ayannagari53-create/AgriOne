import React, { useState, useEffect } from 'react';
import { ShieldCheck, Gauge, CheckCircle2, AlertTriangle, Sprout, ArrowRight, Layers } from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface SoilHealthViewProps {
  language?: SupportedLanguage;
}

export const SoilHealthView: React.FC<SoilHealthViewProps> = () => {
  const { t } = useTranslation();
  const [ph, setPh] = useState(6.8);
  const [ec, setEc] = useState(0.65);
  const [oc, setOc] = useState(0.62);
  const [n, setN] = useState(310);
  const [p, setP] = useState(18.5);
  const [k, setK] = useState(195);
  const [zinc, setZinc] = useState(0.8);
  const [iron, setIron] = useState(5.2);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const interpretSoil = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/soil/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ph,
          ec_ds_m: ec,
          organic_carbon_pct: oc,
          available_n_kgha: n,
          available_p_kgha: p,
          available_k_kgha: k,
          zinc_ppm: zinc,
          iron_ppm: iron,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    interpretSoil();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SOIL HEALTH & NUTRIENT BALANCE CORE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('soil_title')}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            {t('soil_subtitle')}
          </p>
        </div>

        <button
          onClick={interpretSoil}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{loading ? t('analyzing') : t('soil_btn_interpret')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form: Soil Test Inputs */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 space-y-5 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>{t('soil_title')}</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('soil_lbl_ph')}</label>
              <input
                type="number"
                step="0.1"
                min="4.0"
                max="10.0"
                value={ph}
                onChange={(e) => setPh(parseFloat(e.target.value) || 7)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('soil_lbl_ec')}</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="5.0"
                value={ec}
                onChange={(e) => setEc(parseFloat(e.target.value) || 0.5)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-emerald-300 mb-1">
              <span>{t('soil_lbl_oc')}</span>
              <span className="font-bold text-white">{oc}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={oc}
              onChange={(e) => setOc(parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="text-xs font-mono text-emerald-400 font-bold uppercase">
              {t('soil_fertility_grade')}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-emerald-300">{t('soil_lbl_n')}</label>
                <input
                  type="number"
                  value={n}
                  onChange={(e) => setN(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded p-2 text-xs text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-emerald-300">{t('soil_lbl_p')}</label>
                <input
                  type="number"
                  value={p}
                  onChange={(e) => setP(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded p-2 text-xs text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-emerald-300">{t('soil_lbl_k')}</label>
                <input
                  type="number"
                  value={k}
                  onChange={(e) => setK(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded p-2 text-xs text-white mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="text-xs font-mono text-emerald-400 font-bold uppercase">
              Micronutrients (ppm)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-emerald-300">Available Zinc (Zn)</label>
                <input
                  type="number"
                  step="0.1"
                  value={zinc}
                  onChange={(e) => setZinc(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded p-2 text-xs text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-emerald-300">Available Iron (Fe)</label>
                <input
                  type="number"
                  step="0.1"
                  value={iron}
                  onChange={(e) => setIron(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded p-2 text-xs text-white mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output: Prescription & Amendments */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="p-6 rounded-2xl bg-[#092214] border border-emerald-600/40 shadow-xl space-y-6">
              
              {/* Header Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-900/60">
                <div>
                  <div className="text-xs font-mono text-emerald-400">{t('soil_title').toUpperCase()}</div>
                  <h3 className="text-2xl font-black text-white mt-0.5">
                    {result.ph.status} (pH {result.ph.value})
                  </h3>
                  <p className="text-xs text-emerald-200/80 mt-1">{result.ph.recommendation}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-emerald-400/80">{t('soil_lbl_ec')}</div>
                  <div className="text-sm font-bold font-mono text-emerald-300">
                    {result.salinity_ec.status} ({result.salinity_ec.value_ds_m} dS/m)
                  </div>
                </div>
              </div>

              {/* Exact Fertilizer Prescription (Kg/Ha) */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-emerald-400 font-bold uppercase">
                  {t('soil_rec_fertilizers')}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50">
                    <span className="text-[11px] font-mono text-emerald-400 block mb-1">UREA (46% N)</span>
                    <span className="text-2xl font-black font-mono text-white">
                      {result.macronutrients.nitrogen.recommended_urea_kgha}
                    </span>
                    <span className="text-xs text-emerald-400 ml-1">kg/ha</span>
                    <div className="text-[10px] text-emerald-500/80 mt-1">{t('info')}: {result.macronutrients.nitrogen.status}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50">
                    <span className="text-[11px] font-mono text-emerald-400 block mb-1">DAP (18:46:0)</span>
                    <span className="text-2xl font-black font-mono text-white">
                      {result.macronutrients.phosphorus.recommended_dap_kgha}
                    </span>
                    <span className="text-xs text-emerald-400 ml-1">kg/ha</span>
                    <div className="text-[10px] text-emerald-500/80 mt-1">{t('info')}: {result.macronutrients.phosphorus.status}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50">
                    <span className="text-[11px] font-mono text-emerald-400 block mb-1">MOP (60% K2O)</span>
                    <span className="text-2xl font-black font-mono text-white">
                      {result.macronutrients.potassium.recommended_mop_kgha}
                    </span>
                    <span className="text-xs text-emerald-400 ml-1">kg/ha</span>
                    <div className="text-[10px] text-emerald-500/80 mt-1">{t('info')}: {result.macronutrients.potassium.status}</div>
                  </div>
                </div>
              </div>

              {/* Organic Carbon & Regenerative Soil Health */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 font-bold uppercase">
                  <Sprout className="w-4 h-4 text-emerald-400" />
                  <span>Organic Carbon Biology: {result.organic_carbon.status}</span>
                </div>
                <p className="text-xs text-emerald-100">
                  {result.organic_carbon.recommendation}
                </p>
                <p className="text-xs text-emerald-300/80 font-mono pt-1">
                  {result.regenerative_guidance}
                </p>
              </div>

              {/* Micronutrients Zinc & Iron */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[#06140b] border border-emerald-900/50 text-xs">
                  <div className="font-mono text-emerald-400 font-semibold">Zinc (Zn: {result.micronutrients.zinc.value_ppm} ppm)</div>
                  <div className="text-[11px] text-emerald-200 mt-1">{result.micronutrients.zinc.remedy}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#06140b] border border-emerald-900/50 text-xs">
                  <div className="font-mono text-emerald-400 font-semibold">Iron (Fe: {result.micronutrients.iron.value_ppm} ppm)</div>
                  <div className="text-[11px] text-emerald-200 mt-1">{result.micronutrients.iron.remedy}</div>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-emerald-400/50 font-mono">
              Loading soil health diagnostics...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
