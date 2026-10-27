import React, { useState, useEffect } from 'react';
import { ShieldCheck, DollarSign, Calculator, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface FinanceInsuranceViewProps {
  language?: SupportedLanguage;
}

export const FinanceInsuranceView: React.FC<FinanceInsuranceViewProps> = () => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState('Wheat');
  const [acres, setAcres] = useState(10.0);
  const [sumInsuredPerAcre, setSumInsuredPerAcre] = useState(40000);
  const [season, setSeason] = useState('rabi');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateInsurance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop,
          farm_acres: acres,
          sum_insured_per_acre: sumInsuredPerAcre,
          season,
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
    calculateInsurance();
  }, [crop, acres, sumInsuredPerAcre, season]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('fin_badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('fin_main_title')}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            {t('fin_main_subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Form */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 space-y-5 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>{t('fin_calculator')}</span>
          </h3>

          <div>
            <label className="text-xs font-mono text-emerald-300 block mb-1">{t('fin_lbl_crop')}</label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
            >
              <option value="Wheat">Wheat (Rabi Food Crop - 1.5% Premium)</option>
              <option value="Rice">Paddy Rice (Kharif Food Crop - 2.0% Premium)</option>
              <option value="Cotton">Bt Cotton (Commercial Cash Crop - 5.0% Premium)</option>
              <option value="Soybean">Soybean (Kharif Oilseed - 2.0% Premium)</option>
              <option value="Tomato">Tomato (Annual Horticulture - 5.0% Premium)</option>
              <option value="Chilli">Chilli (Annual Horticulture - 5.0% Premium)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('fin_lbl_area')}</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="500"
                value={acres}
                onChange={(e) => setAcres(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-emerald-300 block mb-1">{t('fin_lbl_season')}</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="rabi">Rabi (Winter)</option>
                <option value="kharif">Kharif (Monsoon)</option>
                <option value="annual">Annual Commercial</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-emerald-300 mb-1">
              <span>{t('fin_lbl_sum_insured')}</span>
              <span className="font-bold text-white">₹{sumInsuredPerAcre.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="20000"
              max="100000"
              step="5000"
              value={sumInsuredPerAcre}
              onChange={(e) => setSumInsuredPerAcre(parseInt(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-emerald-600 font-mono">
              <span>₹20,000</span>
              <span>Average: ₹45,000</span>
              <span>₹100,000</span>
            </div>
          </div>
        </div>

        {/* Right Output: Premium Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="p-6 rounded-2xl bg-[#092214] border border-emerald-600/40 shadow-xl space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-900/60">
                <div>
                  <span className="text-xs font-mono text-emerald-400">SCHEME: {result.scheme}</span>
                  <h3 className="text-2xl font-black text-white mt-0.5">
                    {result.crop} ({result.insured_acres} Acres)
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-emerald-400/80">{t('fin_total_coverage')}</div>
                  <div className="text-2xl font-black font-mono text-white">
                    ₹{result.total_sum_insured.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Farmer Payable vs Govt Subsidy */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-500/40 space-y-1">
                  <div className="text-xs font-mono text-emerald-400">{t('fin_farmer_share')} ({result.farmer_share_rate_pct}%)</div>
                  <div className="text-3xl font-black font-mono text-emerald-300">
                    ₹{result.farmer_payable_premium_rs.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/60 space-y-1">
                  <div className="text-xs font-mono text-emerald-400">{t('fin_gov_subsidy')} (50:50)</div>
                  <div className="text-3xl font-black font-mono text-white">
                    ₹{result.govt_subsidy_benefit_rs.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Coverage Triggers */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono text-emerald-300 font-bold uppercase">
                  Protected Calamity Risk Triggers ({result.indemnity_coverage_pct}%)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {result.coverage_events?.map((ev: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#06140b] border border-emerald-900/50 flex items-start gap-2 text-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
