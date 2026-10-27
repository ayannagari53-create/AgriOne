import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  Sprout, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Loader2, 
  X, 
  Edit3,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { AuthUser } from './AuthPage';
import { FarmProfileData } from './FarmerOnboardingModal';
import { useTranslation } from '../context/LanguageContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser | null;
  currentFarm: FarmProfileData | null;
  onProfileUpdated: (user: AuthUser) => void;
  onOpenFarmSetup: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  authUser,
  currentFarm,
  onProfileUpdated,
  onOpenFarmSetup,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authUser) {
      setName(authUser.name || '');
      setError(null);
      setSuccess(false);
    }
  }, [authUser, isOpen]);

  if (!isOpen || !authUser) return null;

  const isGoogle = authUser.auth_provider === 'google' || !!authUser.google_sub;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('err_name_required') || 'Full name cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('agrione_token') || '';
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          token,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data.error || 'Failed to update profile name.');
        setSaving(false);
        return;
      }

      setSuccess(true);
      if (data.user) {
        onProfileUpdated(data.user);
        localStorage.setItem('agrione_user', JSON.stringify(data.user));
      }
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'Network error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#05130b] border border-emerald-600/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Farmer Profile & Settings</h2>
              <p className="text-xs text-emerald-400/80 font-mono">Verified Identity & Farm Synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-900/40 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity Summary Card */}
        <div className="p-4 rounded-2xl bg-[#030c06] border border-emerald-800/60 flex items-center gap-4">
          <div className="relative shrink-0">
            {authUser.avatar_url ? (
              <img
                src={authUser.avatar_url}
                alt={authUser.name}
                className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/40 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xl">
                {authUser.name ? authUser.name[0].toUpperCase() : '🌾'}
              </div>
            )}
            {isGoogle && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow" title="Google Verified Account">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate">{authUser.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {isGoogle ? 'Google Account' : 'AgriOne Account'}
              </span>
            </div>
            <div className="text-xs text-emerald-400/80 font-mono truncate flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>{authUser.email}</span>
            </div>
            {authUser.google_sub && (
              <div className="text-[10px] text-zinc-400 font-mono truncate">
                Google ID: {authUser.google_sub}
              </div>
            )}
          </div>
        </div>

        {/* Editable Name Form */}
        <form onSubmit={handleSaveName} className="space-y-3">
          <div>
            <label className="text-xs font-mono text-emerald-300 font-semibold block mb-1.5 flex items-center justify-between">
              <span>Farmer Name (Synchronized Across Platform)</span>
              <span className="text-[10px] text-emerald-500/80 font-normal">Editable</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-[#030c06] border border-emerald-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-emerald-800 outline-none focus:border-emerald-400 transition-colors"
                required
              />
              <Edit3 className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Profile name updated and synchronized successfully!</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim() || name.trim() === authUser.name}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Profile Name'}</span>
            </button>
          </div>
        </form>

        {/* Associated Farm Section */}
        <div className="p-4 rounded-2xl bg-[#030c06] border border-emerald-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>Associated Farm Profile</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFarmSetup();
              }}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              {currentFarm ? 'Edit Farm' : 'Setup Farm'}
            </button>
          </div>

          {currentFarm ? (
            <div className="space-y-1.5 text-xs text-emerald-300/90 font-mono">
              <div className="text-sm font-black text-white font-sans">{currentFarm.name}</div>
              <div className="flex items-center gap-1.5 text-emerald-400/80">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{currentFarm.location_name}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] pt-1 text-emerald-500">
                <span>{currentFarm.acreage} Acres</span>
                <span>•</span>
                <span className="capitalize">{currentFarm.primary_crop}</span>
                <span>•</span>
                <span className="capitalize">{currentFarm.soil_type?.replace(/_/g, ' ')}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-300/80 font-mono">
              No farm profile calibrated yet. Setting up your farm will calibrate irrigation and satellite telemetry.
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
