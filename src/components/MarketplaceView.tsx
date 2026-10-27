import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, ShieldCheck, Check } from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface MarketplaceViewProps {
  language?: SupportedLanguage;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/marketplace')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(console.error);
  }, []);

  const categories = ['All', 'Certified Seeds', 'Bio-Fertilizers', 'Smart Irrigation', 'Sensors & Tools'];

  const filtered = selectedCategory === 'All'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {orderNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-mono flex items-center justify-between">
          <span>{orderNotice}</span>
          <button onClick={() => setOrderNotice(null)} className="text-emerald-400 font-bold hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('mp_badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('mp_main_title')}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            {t('mp_main_subtitle')}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedCategory === c
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-[#081e11] text-emerald-300 border border-emerald-900 hover:border-emerald-700'
              }`}
            >
              {c === 'All' ? t('all') : c}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-[#081e11] border border-emerald-700/40 hover:border-emerald-400 transition-all shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {item.category}
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{item.rating}</span>
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white leading-tight">{item.title}</h3>
                <p className="text-xs text-emerald-400/80 font-mono mt-1">{item.package_size}</p>
                <div className="text-[11px] text-emerald-500 flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{item.certifier}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-emerald-900/50">
                {item.features?.map((f: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-emerald-200/80">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-900/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-500 block font-mono">{t('mp_farmer_price')}</span>
                <span className="text-xl font-black font-mono text-emerald-300">₹{item.price_rs}</span>
              </div>
              <button
                onClick={() => setOrderNotice(`${item.title}: ${t('mp_order_dispatched')}`)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                {t('mp_btn_order')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
