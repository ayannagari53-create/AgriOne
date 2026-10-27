import React, { useState, useEffect, useRef } from 'react';
import { 
  Sprout, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Loader2, 
  User, 
  ShieldCheck, 
  X
} from 'lucide-react';
import { AuthHeroVisual } from './AuthHeroVisual';
import { useTranslation } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  auth_provider: string;
  avatar_url?: string;
  google_sub?: string;
}

interface AuthPageProps {
  onAuthSuccess: (user: AuthUser, token: string, hasFarm: boolean, farmData?: any) => void;
  onCancel?: () => void;
  language?: any;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  onCancel,
}) => {
  const { t, language } = useTranslation();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);

  const authConfigRef = useRef<{ google_client_id?: string; redirect_uri?: string; has_client_secret?: boolean } | null>(null);

  // Listen for Google OAuth callback message and verify pending redirects
  useEffect(() => {
    // 1. Check if user redirected back to root with pending tokens from full-page redirect
    const pendingRaw = sessionStorage.getItem('agrione_google_pending');
    if (pendingRaw) {
      sessionStorage.removeItem('agrione_google_pending');
      try {
        const pending = JSON.parse(pendingRaw);
        processGoogleLoginPayload(pending);
      } catch (e) {
        console.error('Failed to parse pending Google auth payload', e);
      }
    }

    // 2. Also check URL fragment if top-level redirect landed with hash
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const id_token = params.get('id_token');
      const access_token = params.get('access_token');
      if (id_token || access_token) {
        window.history.replaceState(null, '', window.location.pathname);
        processGoogleLoginPayload({ 
          id_token: id_token || undefined, 
          access_token: access_token || undefined 
        });
      }
    }

    // 3. Message listener for popup communication from /api/auth/callback/google
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'AGRIONE_GOOGLE_AUTH_CALLBACK') return;

      // Allow same-origin or authorized callback origins (such as http://localhost:3000)
      const allowedOrigins = [window.location.origin, 'http://localhost:3000'];
      if (authConfigRef.current?.redirect_uri) {
        try {
          allowedOrigins.push(new URL(authConfigRef.current.redirect_uri).origin);
        } catch (_) {}
      }
      if (!allowedOrigins.includes(event.origin)) return;

      const { id_token, access_token, code, error, error_description } = event.data;
      if (error) {
        setGoogleLoading(false);
        triggerErrorShake(error_description || error || t('err_login_failed'));
        return;
      }

      if (id_token || access_token || code) {
        processGoogleLoginPayload({ id_token, access_token, code });
      }
    };

    window.addEventListener('message', handleAuthMessage);

    // 4. Pre-fetch Google Auth configuration & Initialize Google Identity Services (GIS)
    const initGsi = (clientId: string) => {
      if (typeof window === 'undefined' || !window.google?.accounts?.id || !clientId) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response && response.credential) {
              processGoogleLoginPayload({ credential: response.credential });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (gErr) {
        console.warn('[GSI Init Notice]:', gErr);
      }
    };

    fetch('/api/auth/config')
      .then((r) => r.json())
      .then((cfg) => {
        authConfigRef.current = cfg;
        const cid = cfg?.google_client_id || (document.querySelector('meta[name="google-signin-client_id"]') as HTMLMetaElement)?.content;
        if (cid) {
          initGsi(cid);
        }
      })
      .catch((err) => console.warn('Could not pre-fetch auth config:', err));

    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  const triggerErrorShake = (msg: string) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const processGoogleLoginPayload = async (payload: { id_token?: string; credential?: string; access_token?: string; code?: string }) => {
    setGoogleLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        triggerErrorShake(data.error || t('err_login_failed'));
        setGoogleLoading(false);
        return;
      }

      setSuccessMessage(t('success_signup'));
      localStorage.setItem('agrione_token', data.token);

      setTimeout(() => {
        onAuthSuccess(data.user, data.token, data.has_farm, data.farm);
      }, 600);
    } catch (err: any) {
      console.error(err);
      triggerErrorShake(t('err_login_failed'));
      setGoogleLoading(false);
    }
  };

  const handleGoogleButtonClick = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);

    let config = authConfigRef.current;
    if (!config || !config.google_client_id) {
      try {
        const configRes = await fetch('/api/auth/config');
        config = await configRes.json();
        authConfigRef.current = config;
      } catch (err) {
        console.error('Failed to load Google client config', err);
      }
    }

    const clientId = config?.google_client_id;
    if (!clientId) {
      triggerErrorShake('Google OAuth is not configured in this environment.');
      setGoogleLoading(false);
      return;
    }

    const redirectUri = config?.redirect_uri || `${window.location.origin}/api/auth/callback/google`;
    const scopes = encodeURIComponent('openid email profile');
    const state = Math.random().toString(36).substring(2);
    const responseType = config?.has_client_secret ? 'code' : 'token%20id_token';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=${responseType}` +
      `&scope=${scopes}` +
      `&state=${state}` +
      `&nonce=${Date.now()}` +
      `&prompt=select_account`;

    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    let popup: Window | null = null;
    try {
      popup = window.open(
        authUrl,
        'GoogleSignOn',
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
      );
    } catch (err) {
      console.warn('[Google Auth] Popup launch error, redirecting directly:', err);
    }

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = authUrl;
    }
  };

  // Email / Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      triggerErrorShake(t('err_email_required'));
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        triggerErrorShake(t('err_password_min'));
        return;
      }
      if (password !== confirmPassword) {
        triggerErrorShake(t('err_password_mismatch'));
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const payload: any = { email: email.trim().toLowerCase(), password };
      if (mode === 'signup') {
        payload.name = name.trim() || email.split('@')[0];
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        triggerErrorShake(data.error || (mode === 'signup' ? t('err_signup_failed') : t('err_login_failed')));
        setLoading(false);
        return;
      }

      setSuccessMessage(mode === 'signup' ? t('success_signup') : t('loading'));
      localStorage.setItem('agrione_token', data.token);

      setTimeout(() => {
        onAuthSuccess(data.user, data.token, data.has_farm, data.farm);
      }, 700);
    } catch (err) {
      console.error(err);
      triggerErrorShake(t('err_login_failed'));
      setLoading(false);
    }
  };

  // Forgot password request
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotStatus(t('err_invalid_email'));
      return;
    }
    setForgotStatus(t('forgot_success'));
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotStatus(null);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen w-screen bg-[#030905] text-[#E2ECE5] font-sans flex flex-col lg:flex-row overflow-y-auto selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* LEFT COLUMN: Visual Futuristic Farm Environment & Branding */}
      <div className="w-full lg:w-[50%] xl:w-[52%] h-[360px] lg:h-screen lg:sticky lg:top-0 shrink-0 border-b lg:border-b-0 lg:border-r border-emerald-900/50 bg-[#040E08] relative overflow-hidden">
        <AuthHeroVisual />
      </div>

      {/* RIGHT COLUMN: Authentication Card with Global Language Switcher */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-16 relative bg-[#040C07]">
        
        {/* Top Floating Language Switcher for Farmer on Login Page */}
        <div className="w-full max-w-[440px] flex items-center justify-between mb-4 z-20">
          <div className="text-xs font-mono text-emerald-500/80 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>AGRIONE SECURITY GATEWAY</span>
          </div>
          <LanguageSelector variant="standard" dropdownAlign="right" />
        </div>

        {/* Subtle Background Glow Rings */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-green-500/5 blur-[100px] pointer-events-none" />

        {/* Main Glass Authentication Card */}
        <div 
          className={`w-full max-w-[440px] rounded-3xl bg-[#06170d]/80 border border-emerald-500/30 backdrop-blur-2xl p-6 sm:p-9 shadow-2xl shadow-emerald-950/80 relative z-10 transition-all ${
            isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''
          }`}
        >
          {/* Card Header */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-800 p-0.5 shadow-md">
                  <div className="w-full h-full bg-[#06140b] rounded-[10px] flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <span className="font-extrabold text-white text-base tracking-tight font-sans">
                    AGRI<span className="text-emerald-400">ONE</span>
                  </span>
                  <span className="ml-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SECURE
                  </span>
                </div>
              </div>

              {/* Mode Pill Toggle */}
              <div className="flex items-center p-0.5 rounded-xl bg-[#030c06] border border-emerald-900/60 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMessage(null); }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'text-emerald-400/80 hover:text-white'
                  }`}
                >
                  {t('auth_signin_tab')}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMessage(null); }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'text-emerald-400/80 hover:text-white'
                  }`}
                >
                  {t('auth_signup_tab')}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {mode === 'signin' ? t('auth_welcome_title') : t('auth_signup_tab')}
              </h2>
              <p className="text-xs text-emerald-300/80 font-mono mt-1 leading-relaxed">
                {mode === 'signin'
                  ? t('auth_welcome_sub')
                  : t('subtagline')}
              </p>
            </div>
          </div>

          {/* Error / Success Feedback Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}

          {/* 1. Official Google Authentication Button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleButtonClick}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-[#030c06] hover:bg-[#071d0e] border border-emerald-700/60 hover:border-emerald-400 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 group"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>{t('btn_google_signin')}</span>
            </button>

            {/* Neon Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-emerald-900/60" />
              <span className="bg-[#06170d] px-3 text-[10px] font-mono uppercase tracking-widest text-emerald-500/80 font-bold shrink-0">
                {t('lbl_email')}
              </span>
            </div>
          </div>

          {/* 2. Normal Email/Password Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name field (Sign Up only) */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-emerald-300 font-semibold block">
                  {t('lbl_full_name')} <span className="text-emerald-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t('ph_full_name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#030c06] border border-emerald-800/80 focus:border-emerald-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-emerald-700/80 outline-none transition-all focus:ring-1 focus:ring-emerald-500/40"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-emerald-300 font-semibold block">
                {t('lbl_email')} <span className="text-emerald-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  placeholder={t('ph_email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#030c06] border border-emerald-800/80 focus:border-emerald-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-emerald-700/80 outline-none transition-all focus:ring-1 focus:ring-emerald-500/40 font-mono"
                  required
                />
              </div>
            </div>

            {/* Password Field with Show/Hide toggle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-emerald-300 font-semibold block">
                  {t('lbl_password')} <span className="text-emerald-500">*</span>
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                  >
                    {t('btn_forgot_password')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('ph_password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#030c06] border border-emerald-800/80 focus:border-emerald-400 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-emerald-700/80 outline-none transition-all focus:ring-1 focus:ring-emerald-500/40 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-300 p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-emerald-300 font-semibold block">
                  {t('lbl_confirm_password')} <span className="text-emerald-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('ph_confirm_password')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#030c06] border border-emerald-800/80 focus:border-emerald-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-emerald-700/80 outline-none transition-all focus:ring-1 focus:ring-emerald-500/40 font-mono"
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-500/30 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>{t('loading')}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? t('btn_signin') : t('btn_signup')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Switch Mode Prompt */}
          <div className="mt-6 pt-4 border-t border-emerald-900/60 text-center text-xs font-mono text-emerald-300/80">
            {mode === 'signin' ? (
              <p>
                {t('auth_dont_have_account')}{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMessage(null); }}
                  className="font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  {t('auth_switch_to_signup')}
                </button>
              </p>
            ) : (
              <p>
                {t('auth_have_account')}{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMessage(null); }}
                  className="font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  {t('auth_switch_to_signin')}
                </button>
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted Session • Real-time DB Sync</span>
          </div>

        </div>

      </div>

      {/* Forgot Password Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#06170d] border border-emerald-500/40 p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-base">{t('forgot_modal_title')}</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-emerald-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-emerald-300/80 font-mono">
              {t('forgot_modal_desc')}
            </p>

            {forgotStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{forgotStatus}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <input
                type="email"
                placeholder={t('ph_email')}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full bg-[#030c06] border border-emerald-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-emerald-700 outline-none focus:border-emerald-400 font-mono"
                required
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs cursor-pointer shadow-md"
                >
                  {t('btn_send_reset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
