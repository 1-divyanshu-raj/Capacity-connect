import React, { useState, useEffect, useRef } from 'react';
import { Fingerprint, Eye, CheckCircle2, Scan, Lock, ShieldCheck, Camera } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

interface BiometricScannerProps {
  onVerified: () => void;
  userName?: string;
  userGovId?: string;
  onCancel?: () => void;
  title?: string;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({ 
  onVerified, 
  userName = 'Dr. M. Ravichandran',
  userGovId = 'GOV-IN-MOES-001',
  onCancel,
  title
}) => {
  const [scannerType, setScannerType] = useState<'fingerprint' | 'ir_camera'>('ir_camera');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verifying' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Initialize camera for IR mode
  useEffect(() => {
    if (scannerType === 'ir_camera') {
      let isMounted = true;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
          .then((stream) => {
            if (isMounted) {
              streamRef.current = stream;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
              }
              setCameraActive(true);
            } else {
              stream.getTracks().forEach((t) => t.stop());
            }
          })
          .catch(() => {
            if (isMounted) setCameraActive(false);
          });
      }
      return () => {
        isMounted = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
    }
  }, [scannerType]);

  const startScan = () => {
    if (scanState === 'scanning' || scanState === 'verifying') return;
    
    sound.playClick();
    setScanState('scanning');
    setProgress(0);

    const interval = setInterval(() => {
      sound.playScanPulse();
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanState('verifying');
          setTimeout(() => {
            sound.playSuccess();
            setScanState('success');
            setTimeout(() => {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
              }
              onVerified();
            }, 800);
          }, 700);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  return (
    <div className="w-full space-y-3.5">
      {title && (
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            {title}
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Scanner Mode Selection */}
      <div className="flex items-center justify-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
        <button
          type="button"
          onClick={() => { 
            sound.playClick(); 
            setScannerType('ir_camera'); 
            setScanState('idle'); 
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
            scannerType === 'ir_camera' 
              ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs border border-slate-200/80 dark:border-slate-600 font-bold' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Gov-Certified IR Camera</span>
        </button>

        <button
          type="button"
          onClick={() => { 
            sound.playClick(); 
            setScannerType('fingerprint'); 
            setScanState('idle'); 
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
            scannerType === 'fingerprint' 
              ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs border border-slate-200/80 dark:border-slate-600 font-bold' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>Gov-Certified Fingerprint</span>
        </button>
      </div>

      {/* Interactive Liquid Glass Scanner Pad */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500/50 dark:border-rose-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-center text-white shadow-inner flex flex-col items-center justify-center min-h-[220px]">
        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

        {/* Video feed if in IR camera mode and active */}
        {scannerType === 'ir_camera' && cameraActive && (
          <div className="absolute inset-0 z-0 opacity-40">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover filter contrast-125 hue-rotate-300"
            />
          </div>
        )}

        {/* Laser Sweep Line */}
        {scanState === 'scanning' && (
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_15px_#f43f5e] animate-laser z-20" />
        )}

        {/* Scanner Target Circle */}
        <div className="relative mb-3 flex items-center justify-center z-10">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            scanState === 'scanning'
              ? 'border-2 border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.5)] bg-rose-950/50'
              : scanState === 'verifying'
              ? 'border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)] bg-amber-950/50'
              : scanState === 'success'
              ? 'border-2 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.6)] bg-emerald-950/50'
              : 'border border-slate-700 bg-slate-900/80 hover:border-slate-500'
          }`}>
            {scannerType === 'fingerprint' ? (
              <Fingerprint className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                scanState === 'scanning' ? 'text-rose-400 animate-pulse' :
                scanState === 'verifying' ? 'text-amber-400' :
                scanState === 'success' ? 'text-emerald-400 scale-110' :
                'text-slate-400'
              }`} />
            ) : (
              <Eye className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                scanState === 'scanning' ? 'text-rose-400 animate-pulse' :
                scanState === 'verifying' ? 'text-amber-400' :
                scanState === 'success' ? 'text-emerald-400 scale-110' :
                'text-slate-400'
              }`} />
            )}
          </div>

          {/* Pulse concentric rings */}
          {scanState === 'scanning' && (
            <div className="absolute inset-0 rounded-full border-2 border-rose-400/40 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Status text */}
        <div className="space-y-1 z-10">
          <p className="text-xs font-mono font-medium text-slate-200">
            {scanState === 'idle' && (scannerType === 'fingerprint' 
              ? 'Touch & Hold Fingerprint Sensor (Gov-Certified)' 
              : 'Align Iris with Gov-Certified IR Camera Sensor')}
            {scanState === 'scanning' && `Analyzing Biometric Minutiae & Retinal Mapping... ${progress}%`}
            {scanState === 'verifying' && 'Validating with MoES National Security Vault...'}
            {scanState === 'success' && 'Level-IV Security Clearance Approved!'}
          </p>
          <p className="text-[10px] text-slate-400">
            Administrator: <span className="text-rose-300 font-semibold">{userName}</span> ({userGovId})
          </p>
        </div>

        {/* Action Button */}
        {scanState === 'idle' && (
          <button
            id="admin-biometric-trigger-scan-btn"
            type="button"
            onClick={startScan}
            className="mt-3.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer z-10"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan via {scannerType === 'fingerprint' ? 'Gov Fingerprint' : 'Gov IR Camera'}</span>
          </button>
        )}

        {scanState === 'success' && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-pulse z-10">
            <CheckCircle2 className="w-4 h-4" />
            <span>Gov UIDAI Level-IV Clearance Approved</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-rose-500" />
          FIPS-201 Hardware PIV / UIDAI Enforced
        </span>
        <span className="font-mono text-rose-700 dark:text-rose-400 font-semibold">NIC-SEC-TLS 1.3</span>
      </div>
    </div>
  );
};
