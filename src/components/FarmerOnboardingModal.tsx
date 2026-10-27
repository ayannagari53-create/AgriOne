import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Layers, 
  Droplets, 
  Sprout, 
  Check, 
  X, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Cpu,
  Globe,
  Compass
} from 'lucide-react';
import { MapLocationPicker } from './MapLocationPicker';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

export interface FarmProfileData {
  id?: string;
  farmer_id?: string;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  state: string;
  district: string;
  village: string;
  acreage: number;
  soil_type: string;
  irrigation_method: string;
  primary_crop: string;
  field_name?: string;
}

import { AuthUser } from './AuthPage';

interface FarmerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: SupportedLanguage;
  currentFarm?: FarmProfileData | null;
  authUser?: AuthUser | null;
  onFarmSaved?: (farm: FarmProfileData) => void;
  isInitialSetup?: boolean;
}

export const FarmerOnboardingModal: React.FC<FarmerOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentFarm,
  authUser,
  onFarmSaved,
  isInitialSetup = false,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'location' | 'details'>('location');
  
  // Location Fields
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [stateName, setStateName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [villageName, setVillageName] = useState('');

  // Agronomic Fields
  const [farmName, setFarmName] = useState('');
  const [acreage, setAcreage] = useState<string>('');
  const [soilType, setSoilType] = useState('');
  const [irrigationMethod, setIrrigationMethod] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('');
  const [fieldName, setFieldName] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize with current farm if editing, or auto-populate Farm Name with Google/profile name
  useEffect(() => {
    if (currentFarm && currentFarm.name) {
      // 1. Preserve existing custom farm name (NEVER overwrite a saved custom farm name)
      setFarmName(currentFarm.name);
      setLocationName(currentFarm.location_name || '');
      setLatitude(currentFarm.latitude ?? null);
      setLongitude(currentFarm.longitude ?? null);
      setStateName(currentFarm.state || '');
      setDistrictName(currentFarm.district || '');
      setVillageName(currentFarm.village || '');
      setAcreage(currentFarm.acreage ? String(currentFarm.acreage) : '');
      setSoilType(currentFarm.soil_type || '');
      setIrrigationMethod(currentFarm.irrigation_method || '');
      setPrimaryCrop(currentFarm.primary_crop || '');
      setFieldName(currentFarm.field_name || '');
    } else {
      // 2. Clean state for location & agronomy, BUT automatically populate Farm Name from Google / profile
      let initialFarmName = authUser?.name || '';
      if (!initialFarmName) {
        try {
          const stored = localStorage.getItem('agrione_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.name) initialFarmName = parsed.name;
          }
        } catch (_) {}
      }

      setFarmName(initialFarmName);
      setLocationName('');
      setLatitude(null);
      setLongitude(null);
      setStateName('');
      setDistrictName('');
      setVillageName('');
      setAcreage('');
      setSoilType('');
      setIrrigationMethod('');
      setPrimaryCrop('');
      setFieldName('');
      setStep('location');

      // If name was not available in props yet, asynchronously fetch user profile to guarantee pre-fill
      if (!initialFarmName) {
        const token = localStorage.getItem('agrione_token');
        fetch(`/api/auth/me${token ? `?token=${encodeURIComponent(token)}` : ''}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
          .then((r) => r.json())
          .then((d) => {
            if (d && d.user && d.user.name) {
              setFarmName((prev) => (prev ? prev : d.user.name));
            }
          })
          .catch(() => {});
      }
    }
  }, [currentFarm, isOpen, authUser]);

  if (!isOpen) return null;

  const handleLocationConfirmed = (loc: {
    locationName: string;
    latitude: number;
    longitude: number;
    state: string;
    district: string;
    village: string;
  }) => {
    setLocationName(loc.locationName);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setStateName(loc.state);
    setDistrictName(loc.district);
    setVillageName(loc.village);
    setValidationError(null);
    setStep('details');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Strict Validations
    if (latitude === null || longitude === null) {
      setValidationError(t('err_select_location'));
      setStep('location');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setValidationError(t('err_select_location'));
      return;
    }

    const parsedAcreage = parseFloat(acreage);
    if (isNaN(parsedAcreage) || parsedAcreage <= 0) {
      setValidationError(t('err_enter_area'));
      return;
    }

    if (!farmName.trim()) {
      setValidationError(t('err_farm_name_required'));
      return;
    }

    if (!stateName.trim() || !districtName.trim()) {
      setValidationError(t('err_select_location'));
      return;
    }

    if (!soilType) {
      setValidationError(t('err_soil_required'));
      return;
    }

    if (!irrigationMethod) {
      setValidationError(t('err_irrigation_required'));
      return;
    }

    if (!primaryCrop.trim()) {
      setValidationError(t('err_crop_required'));
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('agrione_token') || '';
    const profilePayload = {
      farmer_id: authUser?.id || 'current_authenticated_farmer',
      name: farmName.trim(),
      location_name: locationName.trim(),
      latitude,
      longitude,
      state: stateName.trim(),
      district: districtName.trim(),
      village: villageName.trim(),
      acreage: parsedAcreage,
      soil_type: soilType,
      irrigation_method: irrigationMethod,
      primary_crop: primaryCrop.trim(),
      field_name: fieldName.trim() || undefined,
      token,
    };

    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(profilePayload),
      });

      const data = await res.json();
      if (!res.ok || data.valid === false || data.error) {
        setValidationError(data.error || 'Failed to save farm profile. Please check entered parameters.');
        setSaving(false);
        return;
      }

      setSuccess(true);
      const savedFarm = data.farm || profilePayload;
      if (onFarmSaved) onFarmSaved(savedFarm);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err: any) {
      console.error(err);
      setValidationError('Network connection error while saving farm profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-[#06140b] border border-emerald-500/50 p-5 sm:p-7 space-y-6 shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {currentFarm ? t('btn_farm_profile') : t('ob_modal_title')}
              </h3>
              <p className="text-xs text-emerald-400/80 font-mono">
                {isInitialSetup 
                  ? `${t('app_full_name')} • ${t('ob_modal_title')}`
                  : t('tagline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isInitialSetup && (
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              >
                {t('next')}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-950/60 cursor-pointer"
              title={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-emerald-900/60 font-mono text-xs">
          <button
            type="button"
            onClick={() => setStep('location')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              step === 'location'
                ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <span>{t('ob_step_location')}</span>
            {latitude !== null && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (latitude !== null && longitude !== null) {
                setStep('details');
              } else {
                setValidationError('Please pick and confirm your location on the map first.');
              }
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              step === 'details'
                ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <span>{t('ob_step_soil_crop')}</span>
          </button>
        </div>

        {/* Error Notice */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-white">{t('ob_success_title')}</h4>
            <p className="text-xs text-emerald-300 font-mono">
              {t('ob_success_desc')}
            </p>
          </div>
        ) : (
          <div>
            {/* Step 1: Map Location Picker */}
            {step === 'location' && (
              <div className="space-y-4">
                <MapLocationPicker
                  initialLat={latitude ?? undefined}
                  initialLon={longitude ?? undefined}
                  initialLocationName={locationName}
                  onConfirmLocation={handleLocationConfirmed}
                />
              </div>
            )}

            {/* Step 2: Agronomic Farm Details */}
            {step === 'details' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Location Readout Summary */}
                <div className="p-3 rounded-xl bg-black/40 border border-emerald-900/60 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-white truncate max-w-sm">{locationName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('location')}
                    className="text-emerald-400 hover:underline shrink-0 text-[11px]"
                  >
                    {t('loc_select_on_map')}
                  </button>
                </div>

                <div>
                  <label className="text-xs font-mono text-emerald-300 block mb-1">
                    {t('ob_lbl_farm_name')} <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t('ob_ph_farm_name')}
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full bg-[#05130b] border border-emerald-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-emerald-300 block mb-1">
                      {t('ob_lbl_state')} <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t('ob_lbl_state')}
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full bg-[#05130b] border border-emerald-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-emerald-300 block mb-1">
                      {t('ob_lbl_district')} <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t('ob_lbl_district')}
                      value={districtName}
                      onChange={(e) => setDistrictName(e.target.value)}
                      className="w-full bg-[#05130b] border border-emerald-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-emerald-300 block mb-1">
                      {t('ob_lbl_location_name')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('ob_ph_location_name')}
                      value={villageName}
                      onChange={(e) => setVillageName(e.target.value)}
                      className="w-full bg-[#05130b] border border-emerald-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-emerald-300 block mb-1">
                      {t('ob_lbl_acreage')} <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10000"
                      placeholder={t('ob_ph_acreage')}
                      value={acreage}
                      onChange={(e) => setAcreage(e.target.value)}
                      className="w-full bg-[#05130b] border border-emerald-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-emerald-300 block mb-1">
                      {t('ob_lbl_soil_type')} <span className="text-emerald-500">*</span>
                    </label>
                    <select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="w-full bg-[#05130b] border border-emerald-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400"
                      required
                    >
                      <option value="">-- {t('select_option')} --</option>
                      <option value="clay_loam">Clay Loam (Heavy water retention)</option>
                      <option value="black_cotton">Black Cotton Soil (Regur)</option>
                      <option value="loam">Alluvial Loam (Balanced texture)</option>
                      <option value="sandy_loam">Sandy Loam (Quick drainage)</option>
                      <option value="red_soil">Red Laterite Soil</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-emerald-300 block mb-1">
                      {t('ob_lbl_irrigation_method')} <span className="text-emerald-500">*</span>
                    </label>
                    <select
                      value={irrigationMethod}
                      onChange={(e) => setIrrigationMethod(e.target.value)}
                      className="w-full bg-[#05130b] border border-emerald-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400"
                      required
                    >
                      <option value="">-- {t('select_option')} --</option>
                      <option value="drip">Drip Irrigation (90% Efficiency)</option>
                      <option value="sprinkler">Sprinkler System (75% Efficiency)</option>
                      <option value="sub_surface_drip">Sub-Surface Drip (95% Efficiency)</option>
                      <option value="furrow">Furrow Irrigation (60% Efficiency)</option>
                      <option value="flood">Flood / Basin (50% Efficiency)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-emerald-300 block mb-1">
                      {t('ob_lbl_primary_crop')} <span className="text-emerald-500">*</span>
                    </label>
                    <select
                      value={primaryCrop}
                      onChange={(e) => setPrimaryCrop(e.target.value)}
                      className="w-full bg-[#05130b] border border-emerald-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400"
                      required
                    >
                      <option value="">-- {t('select_option')} --</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Rice">Paddy Rice</option>
                      <option value="Cotton">Bt Cotton</option>
                      <option value="Tomato">Tomato</option>
                      <option value="Soybean">Soybean</option>
                      <option value="Maize">Maize / Corn</option>
                      <option value="Sugarcane">Sugarcane</option>
                      <option value="Chilli">Chilli / Pepper</option>
                      <option value="Onion">Onion</option>
                      <option value="Potato">Potato</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-emerald-300 block mb-1">
                      {t('fm_lbl_field_name')} ({t('info')})
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. North Plot #1"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      className="w-full bg-[#05130b] border border-emerald-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-emerald-900/60">
                  <button
                    type="button"
                    onClick={() => setStep('location')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('back')}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{saving ? t('saving') : t('ob_btn_save_farm')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
