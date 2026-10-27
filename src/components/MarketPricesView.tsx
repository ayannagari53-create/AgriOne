import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, MapPin, ArrowUpRight, ArrowDownRight, Bell, RefreshCw } from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface MarketPricesViewProps {
  language?: SupportedLanguage;
}

export const MarketPricesView: React.FC<MarketPricesViewProps> = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<any>(null);

  const fetchMarkets = async (query: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/markets${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      const data = await res.json();
      setMarkets(data.markets || []);
      if (data.markets?.length > 0 && !selectedCommodity) {
        setSelectedCommodity(data.markets[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets(searchTerm);
  }, [searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>AGRI-MARKET WHOLESALE APMC PRICE NETWORK</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('mkt_title')}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            {t('mkt_subtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('mkt_search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#081e11] border border-emerald-800/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-emerald-600 focus:border-emerald-400 outline-none"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left List of Commodities */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 px-1">
            <span>TRACKED COMMODITIES ({markets.length})</span>
            <button
              onClick={() => fetchMarkets(searchTerm)}
              className="flex items-center gap-1 hover:text-emerald-200"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {markets.map((m) => {
              const isSelected = selectedCommodity?.id === m.id;
              const isPositive = m.weekly_change_pct >= 0;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedCommodity(m)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#092515] border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-[#081e11] border-emerald-900/60 hover:border-emerald-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{m.commodity}</h4>
                      <p className="text-[11px] text-emerald-300/70 font-mono mt-0.5">
                        {m.primary_mandi}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold font-mono text-emerald-300">
                        ₹{m.modal_price}
                        <span className="text-[10px] text-emerald-400/80 font-normal">/qtl</span>
                      </div>
                      <div className={`text-[11px] font-mono flex items-center justify-end gap-0.5 ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{isPositive ? `+${m.weekly_change_pct}%` : `${m.weekly_change_pct}%`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-emerald-900/40 flex items-center justify-between text-[11px] font-mono text-emerald-400/70">
                    <span>Variety: {m.variety}</span>
                    <span>Arrivals: {m.daily_arrivals_tonnes} tonnes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-7">
          {selectedCommodity ? (
            <div className="p-6 rounded-2xl bg-[#092214] border border-emerald-600/40 shadow-xl space-y-6">
              
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-900/60">
                <div>
                  <div className="text-xs font-mono text-emerald-400 uppercase">
                    PRIMARY HUB: {selectedCommodity.primary_mandi}
                  </div>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {selectedCommodity.commodity}
                  </h3>
                  <div className="text-xs text-emerald-300/70 mt-1 font-mono">
                    Grade: {selectedCommodity.variety} | Updated: {selectedCommodity.updated_at}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-emerald-400/80">Modal Wholesale Rate</div>
                  <div className="text-3xl font-black font-mono text-white">
                    ₹{selectedCommodity.modal_price}
                    <span className="text-sm text-emerald-400 font-normal">/quintal</span>
                  </div>
                </div>
              </div>

              {/* Price Band Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#06140b] border border-emerald-900/50">
                  <span className="text-[10px] font-mono text-emerald-400/80 block">Min Day Rate</span>
                  <span className="text-lg font-bold font-mono text-emerald-200">₹{selectedCommodity.min_price}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#06140b] border border-emerald-900/50">
                  <span className="text-[10px] font-mono text-emerald-400/80 block">Max Day Rate</span>
                  <span className="text-lg font-bold font-mono text-emerald-200">₹{selectedCommodity.max_price}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#06140b] border border-emerald-900/50">
                  <span className="text-[10px] font-mono text-emerald-400/80 block">MSP Benchmark</span>
                  <span className="text-lg font-bold font-mono text-emerald-300">
                    {selectedCommodity.msp_benchmark > 0 ? `₹${selectedCommodity.msp_benchmark}` : 'N/A (Perishable)'}
                  </span>
                </div>
              </div>

              {/* Market Trend Trajectory */}
              <div className="p-4 rounded-xl bg-black/40 border border-emerald-800/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-emerald-400">7-Day Price Trajectory</div>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedCommodity.trend_trajectory}</div>
                </div>
                <div className="text-xs font-mono text-emerald-300 bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  Daily Arrivals: {selectedCommodity.daily_arrivals_tonnes} MT
                </div>
              </div>

              {/* Regional Mandi Comparison & Arbitrage */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-emerald-300 font-bold uppercase">
                  Regional APMC Price Comparison (Arbitrage Analysis)
                </h4>
                <div className="space-y-2">
                  {selectedCommodity.comparisons?.map((c: any, idx: number) => {
                    const priceDiff = c.modal_price - selectedCommodity.modal_price;
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#06140b] border border-emerald-900/50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-white font-medium">{c.mandi}</span>
                          <span className="text-[10px] font-mono text-emerald-500">({c.distance_km} km)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-300">₹{c.modal_price}/qtl</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            priceDiff > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {priceDiff > 0 ? `+₹${priceDiff} premium` : `${priceDiff}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-emerald-400/50 font-mono">
              Select a commodity to view market intelligence...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
