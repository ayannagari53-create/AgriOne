import React, { useState, useEffect } from 'react';
import { Milk, ShieldAlert, Heart, Calendar, Plus, ChevronRight, Activity } from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface LivestockViewProps {
  language?: SupportedLanguage;
}

export const LivestockView: React.FC<LivestockViewProps> = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);

  const fetchLivestock = async () => {
    try {
      const res = await fetch('/api/livestock');
      const json = await res.json();
      setData(json);
      if (json.herd?.length > 0 && !selectedAnimal) {
        setSelectedAnimal(json.herd[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLivestock();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <Milk className="w-3.5 h-3.5" />
            <span>{t('ls_badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('ls_main_title')}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            {t('ls_main_subtitle')}
          </p>
        </div>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Top Herd Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#081e11] border border-emerald-700/40">
              <span className="text-xs font-mono text-emerald-400 block mb-1">{t('ls_total_cattle')}</span>
              <span className="text-2xl font-black font-mono text-white">{data.total_animals}</span>
              <div className="text-[10px] text-emerald-500 mt-1">{data.milking_count} {t('ls_lactating')}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#081e11] border border-emerald-700/40">
              <span className="text-xs font-mono text-emerald-400 block mb-1">{t('ls_daily_milk')}</span>
              <span className="text-2xl font-black font-mono text-white">{data.total_daily_milk_liters} L</span>
              <div className="text-[10px] text-emerald-500 mt-1">Avg {data.avg_yield_per_animal} L/cow/day</div>
            </div>

            <div className="p-4 rounded-xl bg-[#081e11] border border-emerald-700/40">
              <span className="text-xs font-mono text-emerald-400 block mb-1">{t('ls_avg_fat')}</span>
              <span className="text-2xl font-black font-mono text-emerald-300">{data.herd_avg_fat_pct}% / {data.herd_avg_snf_pct}%</span>
              <div className="text-[10px] text-emerald-500 mt-1">{t('ls_grade_premium')}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#081e11] border border-emerald-700/40">
              <span className="text-xs font-mono text-emerald-400 block mb-1">{t('ls_est_revenue')}</span>
              <span className="text-2xl font-black font-mono text-emerald-400">₹{data.estimated_daily_milk_revenue_rs.toLocaleString()}</span>
              <div className="text-[10px] text-emerald-500 mt-1">{t('ls_rate_basis')}</div>
            </div>
          </div>

          {/* Herd List & Animal Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Animals list */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-mono text-emerald-400">{t('ls_herd_roster')}</div>
              <div className="space-y-2.5">
                {data.herd.map((animal: any) => (
                  <div
                    key={animal.tag_id}
                    onClick={() => setSelectedAnimal(animal)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedAnimal?.tag_id === animal.tag_id
                        ? 'bg-[#092515] border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-[#081e11] border-emerald-900/60 hover:border-emerald-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            {animal.tag_id}
                          </span>
                          <span className="text-sm font-bold text-white">{animal.name}</span>
                        </div>
                        <p className="text-xs text-emerald-400/80 mt-1">{animal.breed} • {animal.age_years} {t('years_val', { value: '' }).trim() || 'yrs'}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold font-mono text-white">
                          {animal.daily_yield_liters > 0 ? `${animal.daily_yield_liters} L/day` : t('ls_dry_period')}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400">{animal.category}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Animal Detail View */}
            <div className="lg:col-span-7">
              {selectedAnimal ? (
                <div className="p-6 rounded-2xl bg-[#092214] border border-emerald-600/40 shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60">
                    <div>
                      <span className="text-xs font-mono text-emerald-400">RFID: {selectedAnimal.tag_id}</span>
                      <h3 className="text-2xl font-black text-white mt-0.5">{selectedAnimal.name} ({selectedAnimal.breed})</h3>
                      <div className="text-xs text-emerald-300/80 font-mono mt-1">{t('stage')}: {selectedAnimal.lactation_stage}</div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                      {selectedAnimal.health_status}
                    </span>
                  </div>

                  {/* Daily Ration Plan */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase">
                      {t('ls_nutrition_plan')}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-lg bg-[#06140b] border border-emerald-900/60">
                        <span className="text-emerald-500 block text-[10px]">{t('ls_green_fodder')}</span>
                        <span className="text-white font-bold">{selectedAnimal.ration_plan.green_fodder_kg} kg</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#06140b] border border-emerald-900/60">
                        <span className="text-emerald-500 block text-[10px]">{t('ls_dry_fodder')}</span>
                        <span className="text-white font-bold">{selectedAnimal.ration_plan.dry_fodder_kg} kg</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#06140b] border border-emerald-900/60">
                        <span className="text-emerald-500 block text-[10px]">{t('ls_concentrate')}</span>
                        <span className="text-white font-bold">{selectedAnimal.ration_plan.concentrate_feed_kg} kg</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#06140b] border border-emerald-900/60">
                        <span className="text-emerald-500 block text-[10px]">{t('ls_minerals')}</span>
                        <span className="text-white font-bold">{selectedAnimal.ration_plan.mineral_mixture_g} g</span>
                      </div>
                    </div>
                  </div>

                  {/* Vaccination Alert */}
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="font-bold text-white">{t('ls_vaccine_alert')}</span>
                        <div className="text-amber-200/80 font-mono text-[11px]">
                          {selectedAnimal.upcoming_vaccination.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-amber-300 font-bold">
                      {t('due')}: {selectedAnimal.upcoming_vaccination.due_date}
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
