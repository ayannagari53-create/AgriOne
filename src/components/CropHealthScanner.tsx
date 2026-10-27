import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanLine, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Bug, 
  FileText,
  Camera,
  CameraOff,
  RotateCcw,
  Sparkles,
  Info,
  HelpCircle,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Activity,
  History,
  Trash2,
  Thermometer,
  RefreshCw,
  X,
  Stethoscope,
  Clock,
  ArrowRight,
  FlipHorizontal,
  Video
} from 'lucide-react';
import { SupportedLanguage } from '../translations';
import { useTranslation } from '../context/LanguageContext';

interface CropHealthScannerProps {
  language?: SupportedLanguage;
}

interface CropScanHistoryItem {
  id: string;
  detected_crop: string;
  plant_part?: string;
  condition: string;
  health_status: string;
  confidence: number;
  severity: string;
  pathogen?: string;
  visible_symptoms?: string[];
  created_at: string;
}

interface DiagnosticResultData {
  valid?: boolean;
  status?: string;
  is_plant?: boolean;
  detected_crop?: string;
  plant_part?: string;
  disease_name?: string;
  condition?: string;
  disease_status?: 'Healthy' | 'Suspected Disease' | 'Likely Disease' | 'Inconclusive' | string;
  health_status?: string;
  confidence?: number;
  severity?: string;
  pathogen?: string;
  visible_symptoms?: string[];
  evidence?: string[];
  possible_cause?: string;
  spread_conditions?: string;
  favorable_conditions?: string;
  prevention?: string[];
  preventative_measures?: string[];
  recommended_treatment?: {
    organic?: string[];
    chemical?: string[];
    advisory_notice?: string;
  };
  organic_treatment?: string[];
  chemical_treatment?: string[];
  immediate_action_plan?: string[];
  immediate_actions?: string[];
  when_to_seek_expert?: string;
  expert_consultation?: string;
  uncertainty_notice?: string;
  farmer_explanation?: string;
  message?: string;
  notice?: string;
  model_used?: string;
  preprocessed_meta?: {
    mime_type?: string;
    dimensions?: string;
    size_kb?: number;
  };
}

export const CropHealthScanner: React.FC<CropHealthScannerProps> = () => {
  const { t, language } = useTranslation();

  // Primary workflow states
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ filename: string; sizeKb: number; mimeType: string } | null>(null);
  const [isFromCamera, setIsFromCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResultData | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [nonPlantNotice, setNonPlantNotice] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stepStage, setStepStage] = useState<string>('');

  // Live Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<{
    title: string;
    message: string;
    type: 'permission_denied' | 'not_found' | 'in_use' | 'unsupported' | 'insecure' | 'generic';
    canRetry: boolean;
  } | null>(null);

  // History & Drawer states
  const [historyOpen, setHistoryOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState<CropScanHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // DOM Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanly stop all camera tracks and release device hardware
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraStarting(false);
  };

  // Component unmount lifecycle cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Load authenticated scan history
  const fetchScanHistory = async () => {
    const token = localStorage.getItem('agrione_token') || '';
    if (!token) return;
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/crop-health/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setScanHistory(data.scans || []);
    } catch (e) {
      console.warn('Failed to load scan history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('agrione_token') || '';
    setScanHistory(prev => prev.filter(item => item.id !== id));
    try {
      await fetch('/api/crop-health/history', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ action: 'delete', id })
      });
    } catch (err) {
      console.error(err);
      fetchScanHistory();
    }
  };

  // 1. Live Camera: Request getUserMedia and stream video
  const startCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    // Stop any existing stream
    stopCamera();

    // Reset error states & previews
    setCameraError(null);
    setErrorNotice(null);
    setNonPlantNotice(null);

    // Check secure context
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setCameraError({
        title: 'Insecure Context Required',
        message: 'Browser camera access requires an HTTPS secure origin (or localhost). Please verify you are connecting via HTTPS.',
        type: 'insecure',
        canRetry: false
      });
      return;
    }

    // Check browser MediaDevices support
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      setCameraError({
        title: 'Camera Not Supported by Browser',
        message: 'Your browser environment does not support mediaDevices.getUserMedia. Please update your browser or use "Select from Device" to upload a photograph.',
        type: 'unsupported',
        canRetry: false
      });
      return;
    }

    setCameraStarting(true);
    setCameraActive(true);

    try {
      let stream: MediaStream;
      try {
        // Primary attempt with specified facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (firstErr: any) {
        // Fallback for hardware (e.g. desktop webcams) that rejects facingMode constraint
        if (firstErr.name === 'OverconstrainedError' || firstErr.name === 'ConstraintNotSatisfiedError') {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } else {
          throw firstErr;
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStarting(false);
    } catch (err: any) {
      console.error('[Crop Health Camera Error]:', err);
      stopCamera();

      const errName = err.name || '';
      const errMsg = (err.message || '').toLowerCase();

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('permission denied')) {
        setCameraError({
          title: 'Camera Permission Denied',
          message: 'Camera permission was blocked by the browser. To allow camera access, open your browser site settings or click the camera/lock icon in the address bar and set Camera to "Allow", then click Retry.',
          type: 'permission_denied',
          canRetry: true
        });
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError' || errMsg.includes('not found') || errMsg.includes('no device')) {
        setCameraError({
          title: 'No Camera Detected',
          message: 'No available camera or video capture hardware was detected on your device. Please ensure a camera is connected or use "Select from Device" to upload a photo.',
          type: 'not_found',
          canRetry: true
        });
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError' || errMsg.includes('already in use') || errMsg.includes('could not start')) {
        setCameraError({
          title: 'Camera Already in Use',
          message: 'Your camera is currently in use by another application or browser tab. Please close other camera applications (such as Zoom, Teams, or Meet) and click Retry.',
          type: 'in_use',
          canRetry: true
        });
      } else if (errName === 'SecurityError') {
        setCameraError({
          title: 'Camera Security Restriction',
          message: 'Camera access was restricted due to browser security policies or iframe permissions.',
          type: 'insecure',
          canRetry: false
        });
      } else {
        setCameraError({
          title: 'Camera Startup Failure',
          message: err.message || 'An unexpected error occurred while starting the camera. Please check your camera settings and try again.',
          type: 'generic',
          canRetry: true
        });
      }
    }
  };

  // Flip front/rear camera
  const flipCamera = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // 2. Capture Snapshot from Live Video onto Canvas
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame at native camera resolution
    ctx.drawImage(video, 0, 0, width, height);

    // Convert to high-fidelity JPEG format
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Instantly stop camera tracks to shut off camera hardware LED & free resources
    stopCamera();

    // Set preview
    setUploadedImagePreview(dataUrl);
    setIsFromCamera(true);
    setImageMeta({
      filename: `camera_specimen_${Date.now()}.jpg`,
      sizeKb: Math.round((dataUrl.length * 3) / 4 / 1024),
      mimeType: 'image/jpeg'
    });
    setDiagnosticResult(null);
    setErrorNotice(null);
    setNonPlantNotice(null);
  };

  // 3. File Selection & Validation (Select from Device)
  const handleFile = (file: File) => {
    if (!file) return;

    // Ensure camera is turned off if user picks a file
    stopCamera();
    setCameraError(null);
    setErrorNotice(null);
    setNonPlantNotice(null);
    setDiagnosticResult(null);

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
      setErrorNotice('Unsupported file format. Please upload a clear photo in JPEG, PNG, or WebP format.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorNotice('File size exceeds the 25 MB limit. Please select a smaller agricultural photograph.');
      return;
    }

    if (file.size < 500) {
      setErrorNotice('The selected file is too small to contain a readable crop photograph. Please select a clear photo.');
      return;
    }

    const sizeKb = Math.round(file.size / 1024);
    setImageMeta({
      filename: file.name,
      sizeKb,
      mimeType: file.type,
    });
    setIsFromCamera(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setUploadedImagePreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // 4. Trigger Scan when farmer clicks "Scan for Disease"
  const startScanForDisease = async () => {
    if (!uploadedImagePreview || analyzing) return;

    setAnalyzing(true);
    setErrorNotice(null);
    setNonPlantNotice(null);
    setDiagnosticResult(null);

    try {
      setStepStage('1. Preprocessing image binary & validating specimen focus...');
      await new Promise((r) => setTimeout(r, 250));

      setStepStage('2. Extracting foliar morphology and symptom lesion patterns...');
      await new Promise((r) => setTimeout(r, 250));

      setStepStage('3. Running Phytopathology AI Vision Model on crop specimen...');

      const token = localStorage.getItem('agrione_token') || '';

      const response = await fetch('/api/crop-health/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          image_base64: uploadedImagePreview,
          filename: imageMeta?.filename || 'crop_specimen.jpg',
          language,
        }),
      });

      const data: DiagnosticResultData = await response.json();

      setStepStage('4. Finalizing evidence-based agronomic recovery plan...');
      await new Promise((r) => setTimeout(r, 200));

      if (!response.ok && !data.status) {
        throw new Error(data.message || `Server returned error (${response.status})`);
      }

      if (data.valid === false) {
        setErrorNotice(data.message || 'Image preprocessing or validation failed. Please upload a clear photo.');
      } else if (data.status === 'NON_PLANT_IMAGE' || data.is_plant === false) {
        setNonPlantNotice(
          data.farmer_explanation || 
          'No agricultural crop, leaf, stem, or fruit was identified in this image. Please upload a clear photograph of a real farm plant.'
        );
      } else if (data.status === 'LOW_CONFIDENCE' || data.status === 'INCONCLUSIVE_IMAGE') {
        setErrorNotice(
          data.farmer_explanation || 
          'AgriOne could not reliably identify symptoms from this image. Please retake the photo in diffuse daylight focused on the affected leaf or fruit.'
        );
        if (data.detected_crop) {
          setDiagnosticResult(data);
        }
      } else {
        // Successful diagnosis
        setDiagnosticResult(data);
        fetchScanHistory();
      }
    } catch (err: any) {
      console.error('[Crop Health Scanner Error]:', err);
      setErrorNotice(
        err.message || 'Network or server processing error. Please ensure your connection is active and click Retry Scan.'
      );
    } finally {
      setAnalyzing(false);
      setStepStage('');
    }
  };

  const resetScanner = () => {
    stopCamera();
    setUploadedImagePreview(null);
    setDiagnosticResult(null);
    setImageMeta(null);
    setIsFromCamera(false);
    setErrorNotice(null);
    setNonPlantNotice(null);
    setCameraError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Confidence Category Determination
  const getConfidenceBadge = (score?: number) => {
    const val = Number(score) || 0;
    if (val >= 75) {
      return { 
        label: 'High Diagnostic Confidence', 
        color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40' 
      };
    }
    if (val >= 50) {
      return { 
        label: 'Moderate Confidence (Monitoring Advised)', 
        color: 'text-amber-300 bg-amber-500/20 border-amber-500/40' 
      };
    }
    return { 
      label: 'Low / Inconclusive Confidence', 
      color: 'text-red-300 bg-red-500/20 border-red-500/40' 
    };
  };

  // Status Badge Determination
  const getStatusBadge = (status?: string, severity?: string) => {
    const s = (status || '').toLowerCase();
    const sev = (severity || '').toLowerCase();

    if (s.includes('healthy') || sev.includes('optimal')) {
      return {
        label: 'Healthy Canopy (No Disease Detected)',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      };
    }
    if (s.includes('suspected')) {
      return {
        label: 'Suspected Condition',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      };
    }
    if (s.includes('inconclusive')) {
      return {
        label: 'Inconclusive Symptoms',
        color: 'bg-zinc-700/40 text-zinc-300 border-zinc-500/40'
      };
    }
    return {
      label: 'Likely Active Disease Detected',
      color: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <ScanLine className="w-3.5 h-3.5" />
            <span>AI CROP DISEASE DETECTION & DIAGNOSIS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Crop Health & Disease Diagnostician
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70 mt-1 max-w-2xl">
            Capture a live camera photo or upload an image of an affected crop leaf, fruit, or stem. AgriOne analyzes visual symptoms with multimodal computer vision and generates actionable treatment steps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#092214] hover:bg-[#0c2e1b] border border-emerald-700/60 text-emerald-300 text-xs font-mono transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>Scan History ({scanHistory.length})</span>
          </button>

          {(uploadedImagePreview || cameraActive) && (
            <button
              onClick={resetScanner}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Scan Another Image</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Camera Viewport / Image Upload & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#081e11] border border-emerald-700/40 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                {cameraActive ? (
                  <>
                    <Video className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>LIVE CAMERA VIEWFINDER</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>SPECIMEN UPLOAD & PREVIEW</span>
                  </>
                )}
              </h3>
              {imageMeta && !cameraActive && (
                <span className="text-[11px] font-mono text-emerald-400">
                  {imageMeta.sizeKb} KB • {imageMeta.mimeType.split('/')[1]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Hidden File Picker Input (Select from Device) */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {/* 1. Camera Error Notice */}
            {cameraError && (
              <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 space-y-3 shadow-lg">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold font-mono text-sm">
                  <CameraOff className="w-5 h-5 shrink-0" />
                  <span>{cameraError.title}</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-100">
                  {cameraError.message}
                </p>
                <div className="pt-2 flex flex-wrap gap-2.5">
                  {cameraError.canRetry && (
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCameraError(null);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0c2b18] text-emerald-300 border border-emerald-600/50 hover:border-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Select from Device Instead</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraError(null)}
                    className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* 2. Live Camera Viewport (When cameraActive is true) */}
            {cameraActive ? (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/60 shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Starting Spinner */}
                  {cameraStarting && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center p-4">
                      <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-mono text-emerald-300 font-semibold">
                        Requesting camera permission & initializing stream...
                      </p>
                    </div>
                  )}

                  {/* Viewfinder Target Framing Reticle */}
                  {!cameraStarting && (
                    <>
                      {/* Top HUD badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>LIVE CAMERA</span>
                      </div>

                      {/* Flip Camera Button */}
                      <button
                        type="button"
                        onClick={flipCamera}
                        className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-emerald-500/40 text-[10px] font-mono text-emerald-300 hover:text-white transition-all cursor-pointer"
                        title="Flip Front/Rear Camera"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span>Flip</span>
                      </button>

                      {/* Viewfinder Focus Reticle Overlay */}
                      <div className="absolute inset-8 pointer-events-none border border-emerald-400/30 rounded-xl flex items-center justify-center">
                        <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0 rounded-tl-lg" />
                        <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0 rounded-tr-lg" />
                        <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0 rounded-bl-lg" />
                        <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0 rounded-br-lg" />
                        <span className="text-[11px] font-mono text-emerald-300/80 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                          Align crop leaf in frame
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Camera Actions Bar */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={cameraStarting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-black" />
                    <span>Capture Photo</span>
                  </button>
                </div>
              </div>
            ) : !uploadedImagePreview ? (
              /* 3. Drop Zone & Upload Options (When no image & camera not active) */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center gap-4 cursor-pointer ${
                  dragOver
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-emerald-700/50 hover:border-emerald-500/80 bg-[#06150c]/80'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <div className="text-base font-bold text-white">
                    Drop diseased crop photo here, or browse
                  </div>
                  <p className="text-xs text-emerald-300/70 max-w-sm">
                    Supports JPEG, PNG, or WebP photographs up to 25 MB
                  </p>
                </div>

                {/* Action Buttons: Take Photo with Camera vs Select from Device */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-black font-bold text-xs shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-green-400 transition-all cursor-pointer active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo with Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0b2616] text-emerald-300 border border-emerald-600/50 text-xs font-semibold hover:border-emerald-400 hover:text-white transition-all cursor-pointer active:scale-95"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Select from Device</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 4. Specimen Preview & Scan Trigger Action (Captured or Uploaded) */
              <div className="space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/80 border border-emerald-500/40 shadow-inner flex items-center justify-center">
                  <img
                    src={uploadedImagePreview}
                    alt="Uploaded crop specimen"
                    className="w-full h-full object-contain"
                  />

                  {/* Active Laser Scanning Beam Animation during AI inference */}
                  {analyzing && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10B981] animate-pulse relative top-1/2 -translate-y-1/2" />
                      <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px]" />
                    </div>
                  )}

                  {/* HUD Specimen Tag */}
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                    {isFromCamera ? 'LIVE CAMERA CAPTURE' : (imageMeta?.filename || 'FIELD_SPECIMEN.JPG')}
                  </div>

                  {/* Remove Image Button */}
                  {!analyzing && (
                    <button
                      onClick={resetScanner}
                      className="absolute top-2 right-2 bg-black/80 hover:bg-black/90 p-1.5 rounded-lg border border-red-500/40 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Progress message during analysis */}
                {analyzing ? (
                  <div className="p-4 rounded-xl bg-[#092214] border border-emerald-600/50 space-y-3">
                    <div className="flex items-center gap-2.5 text-xs font-mono text-emerald-300 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{stepStage || 'Analyzing crop specimen...'}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-emerald-950 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full animate-pulse w-5/6" />
                    </div>
                    <p className="text-[11px] text-emerald-200/60 font-mono">
                      Please wait while the vision model classifies symptoms and checks agronomic databases.
                    </p>
                  </div>
                ) : (
                  /* Primary Action Buttons */
                  <div className="space-y-3">
                    <button
                      onClick={startScanForDisease}
                      disabled={analyzing}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>Scan for Disease</span>
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      {isFromCamera ? (
                        <button
                          type="button"
                          onClick={() => startCamera()}
                          className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono underline cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Retake Photo</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-emerald-400 hover:text-emerald-300 font-mono underline cursor-pointer"
                        >
                          Replace Image
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={resetScanner}
                        className="text-zinc-400 hover:text-zinc-200 font-mono cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Field Photography Advice */}
            <div className="p-4 rounded-xl bg-[#05140b] border border-emerald-900/50 space-y-2 text-xs text-emerald-300/80">
              <div className="font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tips for Accurate Disease Diagnosis</span>
              </div>
              <ul className="space-y-1.5 text-[11px] list-disc list-inside text-emerald-200/70">
                <li><strong className="text-white">Close-up on symptoms:</strong> Focus directly on leaf spots, lesions, blight edges, or stem discolorations.</li>
                <li><strong className="text-white">Lighting:</strong> Diffuse daylight without heavy shadows or direct lens glare produces highest precision.</li>
                <li><strong className="text-white">Both sides:</strong> When possible, inspect leaf undersides for fungal sporulation or mildew growth.</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Right Column: Structured Diagnosis Output & Guidance */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. Non-Plant Rejection Notice */}
          {nonPlantNotice && (
            <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 space-y-3 shadow-xl">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold font-mono text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>NON-PLANT SPECIMEN DETECTED</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-amber-100">
                {nonPlantNotice}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => startCamera()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take New Photo</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#0d2a19] text-emerald-300 border border-emerald-700/50 text-xs font-semibold hover:border-emerald-500 transition-all cursor-pointer"
                >
                  Upload from Device
                </button>
                <button
                  onClick={resetScanner}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* 2. Error Notice with Retry Scan */}
          {errorNotice && (
            <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-200 space-y-3 shadow-xl">
              <div className="flex items-center gap-2.5 text-red-400 font-bold font-mono text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>DIAGNOSTIC NOTICE / ERROR</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-red-100">
                {errorNotice}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                {uploadedImagePreview && (
                  <button
                    onClick={startScanForDisease}
                    disabled={analyzing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Scan</span>
                  </button>
                )}
                <button
                  onClick={() => startCamera()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d2a19] text-emerald-300 border border-emerald-700/50 text-xs font-semibold hover:border-emerald-500 transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Live Photo</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-zinc-850 text-zinc-300 border border-zinc-700 text-xs font-semibold hover:text-white transition-all cursor-pointer"
                >
                  Upload Another Image
                </button>
              </div>
            </div>
          )}

          {/* 3. Validated Structured Diagnosis Results Card */}
          {diagnosticResult && (diagnosticResult.status === 'DIAGNOSIS_COMPLETE' || diagnosticResult.disease_name) && (
            <div className="p-6 rounded-2xl bg-[#092214] border border-emerald-600/40 shadow-xl space-y-6">
              
              {/* Header: Detected Crop, Disease Name, Health Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-900/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                    <span className="font-bold text-emerald-300">
                      {diagnosticResult.detected_crop || 'Agricultural Specimen'}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-300/80">
                      {diagnosticResult.plant_part || 'Leaf'} Specimen
                    </span>
                    {diagnosticResult.model_used && (
                      <span className="text-[10px] text-emerald-500 font-mono">
                        ({diagnosticResult.model_used})
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {diagnosticResult.disease_name || diagnosticResult.condition || 'Healthy Foliage'}
                  </h3>

                  {diagnosticResult.pathogen && (
                    <div className="text-xs font-mono text-emerald-300/90 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Causal Agent / Pathogen: <strong className="text-white">{diagnosticResult.pathogen}</strong></span>
                    </div>
                  )}
                </div>

                <div className="text-right space-y-1.5">
                  <div className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border inline-block ${
                    getStatusBadge(diagnosticResult.disease_status || diagnosticResult.health_status, diagnosticResult.severity).color
                  }`}>
                    {getStatusBadge(diagnosticResult.disease_status || diagnosticResult.health_status, diagnosticResult.severity).label}
                  </div>

                  {diagnosticResult.confidence !== undefined && (
                    <div className="text-xs font-mono block">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${getConfidenceBadge(diagnosticResult.confidence).color}`}>
                        {Number(diagnosticResult.confidence).toFixed(1)}% Confidence
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence Progress Metric */}
              {diagnosticResult.confidence !== undefined && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-emerald-300">
                    <span>Model Confidence Rating</span>
                    <span className="font-bold text-white">{Number(diagnosticResult.confidence).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-emerald-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, Math.min(100, Number(diagnosticResult.confidence) || 0))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Farmer Summary / Plain Language Assessment */}
              {diagnosticResult.farmer_explanation && (
                <div className="p-4 rounded-xl bg-black/40 border border-emerald-800/40 space-y-1.5">
                  <div className="text-xs font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Agronomic Assessment</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                    {diagnosticResult.farmer_explanation}
                  </p>
                </div>
              )}

              {/* Visible Symptoms & Diagnostic Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visible Symptoms */}
                <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50 space-y-2">
                  <h4 className="text-xs font-mono text-emerald-300 font-bold uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Observed Visible Symptoms</span>
                  </h4>
                  {diagnosticResult.visible_symptoms && diagnosticResult.visible_symptoms.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-emerald-100/90">
                      {diagnosticResult.visible_symptoms.map((s: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-300/60 italic">No adverse lesions observed on specimen foliage.</p>
                  )}
                </div>

                {/* Possible Cause */}
                <div className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50 space-y-2">
                  <h4 className="text-xs font-mono text-emerald-300 font-bold uppercase flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Possible Underlying Cause</span>
                  </h4>
                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    {diagnosticResult.possible_cause || 'Fungal, bacterial, or physiological condition identified through leaf visual patterns.'}
                  </p>
                </div>
              </div>

              {/* Spread Conditions & Environmental Triggers */}
              {(diagnosticResult.spread_conditions || diagnosticResult.favorable_conditions) && (
                <div className="p-4 rounded-xl bg-[#071c10] border border-emerald-800/40 space-y-1.5">
                  <div className="text-xs font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Spread Conditions & Environmental Risk Factors</span>
                  </div>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    {diagnosticResult.spread_conditions || diagnosticResult.favorable_conditions}
                  </p>
                  <p className="text-[10px] text-emerald-400/60 font-mono">
                    *Note: General risk factors based on pathology database. Compare with current microclimate on your field.
                  </p>
                </div>
              )}

              {/* Immediate Action Plan (Next 24-48 Hours) */}
              {(diagnosticResult.immediate_action_plan || diagnosticResult.immediate_actions) && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                  <div className="text-xs font-mono text-amber-300 font-bold uppercase flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Immediate Containment Actions (Next 24–48 Hours)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-100">
                    {(diagnosticResult.immediate_action_plan || diagnosticResult.immediate_actions)?.map((act: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">✓</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Treatments: Organic & Chemical */}
              <div className="space-y-4">
                {/* Organic / Biological */}
                {diagnosticResult.recommended_treatment?.organic && diagnosticResult.recommended_treatment.organic.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#0a2817]/70 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 font-bold uppercase">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Organic & Biological Interventions</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-emerald-100">
                      {diagnosticResult.recommended_treatment.organic.map((t: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Chemical Options */}
                {diagnosticResult.recommended_treatment?.chemical && diagnosticResult.recommended_treatment.chemical.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#142318]/70 border border-emerald-600/40 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 font-bold uppercase">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Curative Chemical Treatments (Approved Dosages)</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-emerald-100">
                      {diagnosticResult.recommended_treatment.chemical.map((t: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">→</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                    {/* Mandatory Advisory Notice */}
                    <div className="p-2.5 rounded-lg bg-black/40 border border-amber-600/30 text-[11px] text-amber-200/90 leading-relaxed font-mono">
                      <strong>Responsible Use Advisory:</strong> {diagnosticResult.recommended_treatment.advisory_notice || 'Always verify local pesticide registrations, crop-specific label instructions, correct pre-harvest intervals (PHI), and consult regional agricultural extension guidance before application.'}
                    </div>
                  </div>
                )}

                {/* Prevention Protocol */}
                {(diagnosticResult.prevention || diagnosticResult.preventative_measures) && (
                  <div className="p-4 rounded-xl bg-black/40 border border-emerald-900/60 space-y-2">
                    <div className="text-xs font-mono text-emerald-400 font-bold uppercase">
                      Agronomic Prevention & Field Sanitation
                    </div>
                    <ul className="space-y-1.5 text-xs text-emerald-200/80">
                      {(diagnosticResult.prevention || diagnosticResult.preventative_measures)?.map((p: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expert Consultation Threshold */}
                {(diagnosticResult.when_to_seek_expert || diagnosticResult.expert_consultation) && (
                  <div className="p-3.5 rounded-xl bg-[#06140b] border border-emerald-800/40 flex items-start gap-2.5 text-xs font-mono text-emerald-300/80">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">When to Seek Expert Help: </strong> 
                      {diagnosticResult.when_to_seek_expert || diagnosticResult.expert_consultation}
                    </div>
                  </div>
                )}

                {/* Diagnostic Uncertainty Notice */}
                <div className="p-3.5 rounded-xl bg-[#051109] border border-emerald-900/40 text-[11px] text-emerald-300/70 space-y-1">
                  <div className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    <span>Scientific Diagnostic Notice</span>
                  </div>
                  <p className="leading-relaxed">
                    {diagnosticResult.uncertainty_notice || 'Visual photograph inspection alone provides diagnostic indication but cannot replace laboratory isolation. If symptoms overlap or continue spreading, bring a plant sample to your nearest agricultural research station (KVK) for confirmation.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons at bottom of diagnosis */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-emerald-900/60">
                <button
                  onClick={resetScanner}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Scan Another Specimen</span>
                </button>

                <button
                  onClick={() => setHistoryOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <span>View in Scan History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* 4. Ready to Scan (Image previewed, awaiting user click) */}
          {uploadedImagePreview && !analyzing && !diagnosticResult && !nonPlantNotice && !errorNotice && (
            <div className="p-8 rounded-2xl bg-[#081e11] border border-emerald-600/40 text-center space-y-5 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-white">Specimen Ready for Analysis</h4>
                <p className="text-xs text-emerald-300/70 max-w-md mx-auto leading-relaxed">
                  Your image has been captured and validated. Click <strong>Scan for Disease</strong> to evaluate leaf lesions, identify pathogen causes, and generate recovery protocols.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={startScanForDisease}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                >
                  Scan for Disease Now
                </button>
              </div>
            </div>
          )}

          {/* 5. Empty State before upload or live camera */}
          {!uploadedImagePreview && !cameraActive && !analyzing && !errorNotice && !nonPlantNotice && (
            <div className="p-12 rounded-2xl bg-[#081e11] border border-emerald-800/40 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <ScanLine className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">No Specimen Captured Yet</h4>
                <p className="text-xs text-emerald-300/70 max-w-md mx-auto leading-relaxed">
                  Take a photo of any crop leaf, fruit, or stem with symptoms using your camera or select an existing picture from your device. The system will inspect the specimen, identify the plant, classify the disease, and generate treatment steps.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => startCamera()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0b2616] text-emerald-300 border border-emerald-600/50 hover:border-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Select from Device</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* History Drawer Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-[#092214] border border-emerald-500/40 p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Crop Health Scan History</h3>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-emerald-400 hover:text-white cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingHistory ? (
                <div className="p-8 text-center text-xs text-emerald-300/70 font-mono">
                  Loading scan records...
                </div>
              ) : scanHistory.length > 0 ? (
                scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-4 rounded-xl bg-[#06140b] border border-emerald-900/50 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{scan.detected_crop}</span>
                        <span>•</span>
                        <span className="text-emerald-300">{scan.condition}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                          {scan.confidence}%
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400/70">
                        {scan.created_at} • Severity: {scan.severity}
                      </div>
                    </div>

                    <button
                      onClick={(e) => deleteHistoryItem(scan.id, e)}
                      className="p-2 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900/60 transition-all cursor-pointer"
                      title="Delete scan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-emerald-300/70 font-mono">
                  No previous scans recorded yet. Capture or upload a crop photograph to create your first diagnostic scan.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-emerald-900/60 flex justify-end">
              <button
                onClick={() => setHistoryOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
