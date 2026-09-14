import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, Fingerprint, Loader2, RefreshCw, ShieldCheck, UserX, X, Zap } from 'lucide-react';
import { sound } from '../../utils/soundEffects';
import { UserProfile } from '../../lib/supabase';
import { verifyBiometricFrames } from '../../lib/biometricLogin';
import * as faceapi from '@vladmandic/face-api';

interface PasswordlessFastLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onSwitchToRegister: () => void;
}

type ScanState = 'idle' | 'loading' | 'scanning' | 'verifying' | 'success' | 'rejected';

export const PasswordlessFastLoginModal: React.FC<PasswordlessFastLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onSwitchToRegister,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [status, setStatus] = useState('Position your face inside the frame.');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [distance, setDistance] = useState<number | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setScanState('loading');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not supported by this browser.');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setScanState('idle');
      setStatus(modelReady ? 'Ready. Click Verify Face & Fast Login.' : 'Loading face-recognition model...');
    } catch (e: any) {
      setScanState('idle');
      setError(e?.message || 'Unable to access the camera.');
    }
  }, [modelReady]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
        ]);
        if (mounted) setModelReady(true);
      } catch {
        if (mounted) setError('Face-recognition models could not be loaded.');
      }
    })();
    startCamera();
    return () => { mounted = false; stopCamera(); };
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureFrames = async (): Promise<number[][]> => {
    if (!modelReady || !videoRef.current || !cameraActive) throw new Error('Camera and face-recognition model are not ready.');
    const frames: number[][] = [];
    const boxes: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 3; i++) {
      setProgress(20 + i * 20);
      setStatus(`Live face check ${i + 1}/3 — keep your face visible and move slightly.`);
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.55 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection?.descriptor) throw new Error('No clear face detected. Look at the camera and try again.');
      frames.push(Array.from(detection.descriptor));
      boxes.push({ x: detection.detection.box.x, y: detection.detection.box.y });
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    const motion = Math.abs(boxes[2].x - boxes[0].x) + Math.abs(boxes[2].y - boxes[0].y);
    if (motion < 6) throw new Error('Liveness motion check failed. Please move your head slightly and retry.');
    return frames;
  };

  const handleScan = async () => {
    if (scanState === 'scanning' || scanState === 'verifying') return;
    sound.playClick();
    setError(null);
    setDistance(null);
    setProgress(5);
    setScanState('scanning');
    try {
      const frames = await captureFrames();
      setScanState('verifying');
      setProgress(75);
      setStatus('Secure server verification in progress.');
      const result = await verifyBiometricFrames(frames);
      setProgress(100);
      if (!result.matched || !result.user) {
        setScanState('rejected');
        setDistance(result.distance ?? null);
        setStatus('Face not registered or biometric threshold was not satisfied.');
        sound.playError();
        return;
      }

      setDistance(result.distance ?? null);
      setScanState('success');
      setStatus(`Identity verified. Match distance: ${result.distance?.toFixed(4) ?? 'verified'}.`);
      sound.playSuccess();

      // The Edge Function issues a one-time Supabase Auth magic link after server-side matching.
      // Navigating to it creates the real Auth session; the dashboard is then resolved by AuthContext.
      if (result.action_link) {
        window.setTimeout(() => { window.location.assign(result.action_link!); }, 700);
      } else {
        const fallbackProfile: UserProfile = {
          id: result.user!.id,
          username: result.user!.email.split('@')[0],
          fullName: result.user!.fullName,
          email: result.user!.email,
          role: result.user!.role as UserProfile['role'],
          institute: 'Capacity Connect',
          designation: '',
          avatar: '',
          phone: '',
          bio: 'Biometrically verified user',
          qualifications: '',
          workExperience: '',
          igotKarmaPoints: 0,
          interests: [],
          skills: [],
          certificates: [],
        };
        onLoginSuccess(fallbackProfile);
      }
    } catch (e: any) {
      setScanState('rejected');
      setError(e?.message || 'Biometric verification failed.');
      setStatus('Verification failed. No login session was created.');
      sound.playError();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white dark:bg-[#0d1522] border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-600 text-white"><Zap className="h-5 w-5" /></div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">Biometric Fast Login</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live face detection + liveness check + secure server verification</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950 border-2 border-slate-700">
            <video ref={videoRef} playsInline muted autoPlay className={`h-full w-full object-cover -scale-x-100 ${cameraActive ? 'opacity-100' : 'opacity-0'}`} />
            {!cameraActive && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300"><Camera className="h-8 w-8" /><span className="text-sm">Camera is not active</span><button onClick={startCamera} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold">Enable Camera</button></div>}
            {cameraActive && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className={`h-56 w-48 rounded-[45%] border-2 border-dashed ${scanState === 'success' ? 'border-emerald-400' : scanState === 'rejected' ? 'border-red-400' : 'border-cyan-400'}`} /></div>}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {scanState === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : scanState === 'rejected' ? <UserX className="h-5 w-5 text-red-500" /> : <Fingerprint className="h-5 w-5 text-cyan-500" />}
              {status}
            </div>
            {error && <div className="mt-2 flex items-start gap-2 text-xs text-red-600 dark:text-red-300"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
            {distance !== null && <div className="mt-2 text-[11px] font-mono text-slate-500">Server match distance: {distance.toFixed(4)} · threshold ≤ 0.450</div>}
          </div>

          {(scanState === 'scanning' || scanState === 'verifying') && <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-rose-600 transition-all" style={{ width: `${progress}%` }} /></div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" disabled={!modelReady || !cameraActive || scanState === 'scanning' || scanState === 'verifying'} onClick={handleScan} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2">
              {scanState === 'scanning' || scanState === 'verifying' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {scanState === 'scanning' || scanState === 'verifying' ? 'Verifying…' : 'Verify Face & Fast Login'}
            </button>
            <button type="button" onClick={startCamera} className="rounded-2xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4" /> Retry Camera</button>
          </div>

          {scanState === 'rejected' && <button type="button" onClick={() => { onClose(); onSwitchToRegister(); }} className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">Face not registered? Register your account and face instead.</button>}
          <p className="text-center text-[10px] text-slate-400">Biometric vectors are matched server-side. The browser does not download the registered face database.</p>
        </div>
      </div>
    </div>
  );
};
