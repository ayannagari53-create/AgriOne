import React, { useState, useEffect } from 'react';
import { Radar, Layers, Plane, AlertTriangle, CheckCircle2, Eye, ShieldAlert } from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface SatelliteNdviViewProps {
  language?: SupportedLanguage;
  currentFarm?: any;
  onOpenOnboarding?: () => void;
}

export const SatelliteNdviView: React.FC<SatelliteNdviViewProps> = ({ 
  currentFarm,
  onOpenOnboarding 
}) => {
  const { t } = useTranslation();
  const [farm, setFarm] = useState<any>(currentFarm || null);
  const [fieldId, setFieldId] = useState(currentFarm?.field_name || currentFarm?.name || 'Plot-Alpha');
  const [areaAcres, setAreaAcres] = useState(currentFarm?.acreage || 5.0);
  const [mode, setMode] = useState<'satellite' | 'drone'>('satellite');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentFarm) {
      setFarm(currentFarm);
      setFieldId(currentFarm.field_name || currentFarm.name || 'Plot-Alpha');
      setAreaAcres(currentFarm.acreage || 5.0);
    } else {
      fetch('/api/farms')
        .then((r) => r.json())
        .then((d) => {
          const loaded = d.farm || (d.farms && d.farms[0]) || null;
          if (loaded) {
            setFarm(loaded);
            setFieldId(loaded.field_name || loaded.name || 'Plot-Alpha');
            setAreaAcres(loaded.acreage || 5.0);
          }
        })
        .catch(console.error);
    }
  }, [currentFarm]);

  const fetchIndices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/satellite/indices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_id: fieldId,
          field_area_acres: areaAcres,
          cloud_cover_pct: 2.4,
        }),
      });
      const resData = await res.json();
      setData(resData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
  }, [fieldId, areaAcres]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Farm Location Notice if unconfigured */}
      {!farm && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{t('dash_setup_prompt')}</span>
          </div>
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 cursor-pointer"
            >
              {t('dash_setup_btn')}
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <Radar className="w-3.5 h-3.5" />
            <span>{t('badge_sentinel2')} MSI & MULTISPECTRAL DRONE PAYLOAD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('sat_title')}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            {t('sat_subtitle')}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#081e11] p-1 rounded-xl border border-emerald-800">
          <button
            onClick={() => setMode('satellite')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
              mode === 'satellite' ? 'bg-emerald-500 text-black shadow-md' : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>{t('badge_sentinel2')}</span>
          </button>
          <button
            onClick={() => setMode('drone')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
              mode === 'drone' ? 'bg-emerald-500 text-black shadow-md' : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>{t('nav_satellite')}</span>
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Synthetic Field Zonation Map */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold">
                  {mode === 'satellite' ? 'SENTINEL-2A L2A TRUE-COLOR + NDVI MESH' : 'DRONE MULTISPECTRAL 5CM/PX SURVEY'}
                </span>
                <span className="text-emerald-400">ACQ: {data.acquisition_date}</span>
              </div>

              {/* Map Canvas Visualizer */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-emerald-600/30 bg-[#040f08] flex items-center justify-center p-4">
                {/* Field polygon shape with gradient health zones */}
                <div className="w-full h-full relative rounded-lg border border-dashed border-emerald-400/50 p-2 overflow-hidden flex flex-col justify-between">
                  {/* Top sector: High vigor */}
                  <div className="h-[55%] w-full bg-gradient-to-r from-emerald-600/60 via-green-500/70 to-emerald-700/60 rounded flex items-center justify-center text-xs font-mono text-white font-bold backdrop-blur-sm border border-emerald-400/30">
                    High Vigor Canopy Zone (NDVI 0.78 - 0.85)
                  </div>

                  {/* Mid sector: Moderate */}
                  <div className="h-[25%] w-full my-1 bg-gradient-to-r from-lime-600/60 to-yellow-600/60 rounded flex items-center justify-between px-4 text-xs font-mono text-white font-bold backdrop-blur-sm border border-yellow-400/30">
                    <span>Moderate Growth (0.55 - 0.65)</span>
                    <span className="text-[10px] text-yellow-200">Sector West</span>
                  </div>

                  {/* Bottom sector: Moisture Stress */}
                  <div className="h-[18%] w-full bg-gradient-to-r from-amber-600/70 via-red-600/60 to-amber-700/70 rounded flex items-center justify-between px-4 text-xs font-mono text-white font-bold backdrop-blur-sm border border-red-400/40">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                      <span>Moisture Stress Alert (NDWI -0.12)</span>
                    </span>
                    <span className="text-[10px] text-amber-200">Sector NE Lateral #4</span>
                  </div>
                </div>

                {/* HUD Overlay details */}
                <div className="absolute top-6 left-6 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                  {farm && farm.latitude ? (
                    <span>
                      LAT {farm.latitude.toFixed(4)}° {farm.latitude >= 0 ? 'N' : 'S'} | LON {farm.longitude.toFixed(4)}° {farm.longitude >= 0 ? 'E' : 'W'} | {farm.location_name || 'Field Grid'} | GSD 10.0m
                    </span>
                  ) : (
                    <span>SPECTRAL SIMULATION | GSD 10.0m | FARM COORDINATES PENDING</span>
                  )}
                </div>

                <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                  Cloud Cover: {data.cloud_cover_pct}%
                </div>
              </div>

              {/* Zonation Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
                <div className="p-3 rounded-lg bg-[#06140b] border border-emerald-900/60">
                  <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>High Vigor</span>
                  </div>
                  <div className="text-lg font-bold text-white">{data.field_zonation.high_vigor_zone.acres} ac</div>
                  <div className="text-[10px] text-emerald-500">{data.field_zonation.high_vigor_zone.percentage}% area</div>
                </div>

                <div className="p-3 rounded-lg bg-[#06140b] border border-emerald-900/60">
                  <div className="flex items-center gap-1.5 text-lime-400 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-500" />
                    <span>Moderate</span>
                  </div>
                  <div className="text-lg font-bold text-white">{data.field_zonation.moderate_vigor_zone.acres} ac</div>
                  <div className="text-[10px] text-lime-500">{data.field_zonation.moderate_vigor_zone.percentage}% area</div>
                </div>

                <div className="p-3 rounded-lg bg-[#06140b] border border-emerald-900/60">
                  <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Stress Zone</span>
                  </div>
                  <div className="text-lg font-bold text-white">{data.field_zonation.moisture_stress_zone.acres} ac</div>
                  <div className="text-[10px] text-amber-500">{data.field_zonation.moisture_stress_zone.percentage}% area</div>
                </div>

                <div className="p-3 rounded-lg bg-[#06140b] border border-emerald-900/60">
                  <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                    <span>Headlands</span>
                  </div>
                  <div className="text-lg font-bold text-white">{data.field_zonation.bare_headlands_zone.acres} ac</div>
                  <div className="text-[10px] text-zinc-500">{data.field_zonation.bare_headlands_zone.percentage}% area</div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Calculated Spectral Indices */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-[#092214] border border-emerald-600/40 shadow-xl space-y-5">
              
              <div className="border-b border-emerald-900/60 pb-3">
                <span className="text-xs font-mono text-emerald-400">CALCULATED INDICES</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Vegetation Vigor Matrix</h3>
              </div>

              {/* NDVI */}
              <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">NDVI (Normalized Difference Vegetation)</span>
                  <span className="text-xl font-black font-mono text-emerald-300">{data.indices.ndvi.value}</span>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold">{data.indices.ndvi.status}</div>
                <p className="text-[11px] text-emerald-200/70">{data.indices.ndvi.description}</p>
              </div>

              {/* NDWI */}
              <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">NDWI (Water Hydration Index)</span>
                  <span className="text-xl font-black font-mono text-emerald-300">{data.indices.ndwi.value}</span>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold">{data.indices.ndwi.status}</div>
                <p className="text-[11px] text-emerald-200/70">{data.indices.ndwi.description}</p>
              </div>

              {/* SAVI */}
              <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">SAVI (Soil Adjusted Vigor, L=0.5)</span>
                  <span className="text-xl font-black font-mono text-emerald-300">{data.indices.savi.value}</span>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold">{data.indices.savi.status}</div>
                <p className="text-[11px] text-emerald-200/70">{data.indices.savi.description}</p>
              </div>

              {/* Actionable Remote Sensing Advice */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-mono text-amber-300 font-bold uppercase">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Remote Sensing Field Alert</span>
                </div>
                <p className="text-amber-100/90 leading-relaxed">
                  {data.actionable_insight}
                </p>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};
