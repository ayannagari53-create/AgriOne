import React, { useState, useEffect } from 'react';
import { Package, Plus, TrendingUp, CheckCircle, Truck, DollarSign, MapPin } from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface SupplyChainViewProps {
  language?: SupportedLanguage;
}

export const SupplyChainView: React.FC<SupplyChainViewProps> = () => {
  const { t } = useTranslation();
  const [listings, setListings] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [commodity, setCommodity] = useState('Pusa 1121 Basmati Paddy');
  const [variety, setVariety] = useState('Organic Export Grade');
  const [quantity, setQuantity] = useState(150);
  const [harvestDate, setHarvestDate] = useState('2026-10-30');
  const [targetPrice, setTargetPrice] = useState(4200);
  const [location, setLocation] = useState('');
  const [grade, setGrade] = useState('Grade A+');

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/supply-chain');
      const data = await res.json();
      setListings(data.listings || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchListings();
    fetch('/api/farms')
      .then((r) => r.json())
      .then((d) => {
        const farm = d.farm || (d.farms && d.farms[0]);
        if (farm) {
          setLocation(`${farm.district || farm.village || 'Local'} APMC Yard`);
        }
      })
      .catch(console.error);
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/supply-chain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity,
          variety,
          quantity_quintals: quantity,
          expected_harvest_date: harvestDate,
          target_price_per_qtl: targetPrice,
          location,
          quality_grade: grade,
        }),
      });
      setShowModal(false);
      fetchListings();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <Truck className="w-3.5 h-3.5" />
            <span>{t('sc_badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('sc_main_title')}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            {t('sc_main_subtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('sc_btn_new_batch')}</span>
        </button>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {listings.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 hover:border-emerald-400 transition-all shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    {item.quality_grade}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{item.commodity}</h3>
                  <p className="text-xs text-emerald-400/80 font-mono">{item.variety}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-emerald-400/80">{t('sc_asking_price')}</div>
                  <div className="text-xl font-black font-mono text-emerald-300">
                    ₹{item.target_price_per_qtl}
                    <span className="text-[10px] text-emerald-500 font-normal">/qtl</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/30 p-3 rounded-xl border border-emerald-900/60">
                <div>
                  <span className="text-emerald-500 block text-[10px]">{t('sc_volume')}</span>
                  <span className="text-white font-bold">{item.quantity_quintals} {t('quintals')}</span>
                </div>
                <div>
                  <span className="text-emerald-500 block text-[10px]">{t('sc_lbl_expected_harvest')}</span>
                  <span className="text-white font-bold">{item.expected_harvest_date}</span>
                </div>
              </div>

              <div className="text-xs text-emerald-300/80 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{item.location}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-900/40 flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{item.status}</span>
              </span>
              <button
                onClick={() => alert(t('sc_connecting_buyers', { item: item.commodity }))}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                {t('sc_btn_connect_buyers')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for new listing */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#092214] border border-emerald-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
              <h3 className="text-lg font-bold text-white">{t('sc_modal_title')}</h3>
              <button onClick={() => setShowModal(false)} className="text-emerald-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-emerald-300 block mb-1">{t('sc_lbl_crop')}</label>
                <input
                  type="text"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-emerald-300 block mb-1">{t('sc_lbl_variety')}</label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-emerald-300 block mb-1">{t('sc_lbl_quantity')}</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 10)}
                    className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-emerald-300 block mb-1">{t('sc_lbl_target_price')}</label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 1000)}
                    className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-emerald-300 block mb-1">{t('sc_lbl_expected_harvest')}</label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-emerald-300 block mb-1">{t('fm_location')}</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#05130b] border border-emerald-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 cursor-pointer"
                >
                  {t('submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
